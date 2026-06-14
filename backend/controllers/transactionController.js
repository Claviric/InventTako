const db = require('../config/database');

exports.createTransaction = async (req, res) => {
    const { cart, totalBelanja, uangTunai, kembalian } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong!' });
    }
    const normalizedCart = cart.map((item) => ({
        ...item,
        qty: Number(item.qty),
        harga: Number(item.harga),
        subtotal: Number(item.subtotal)
    }));
    if (normalizedCart.some((item) => !Number.isInteger(item.qty) || item.qty < 1 || !Number.isFinite(item.harga) || item.harga <= 0)) {
        return res.status(400).json({ message: 'Data barang transaksi tidak valid!' });
    }
    const calculatedTotal = normalizedCart.reduce((sum, item) => sum + item.harga * item.qty, 0);
    if (Number(uangTunai) < calculatedTotal) {
        return res.status(400).json({ message: 'Uang tunai tidak mencukupi.' });
    }

    // Buat nomor nota otomatis (Format: TRX-Timestamp)
    const noNota = `TRX-${Date.now()}`;
    const totalItem = normalizedCart.reduce((sum, item) => sum + item.qty, 0);

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        for (let item of normalizedCart) {
            const [stockRows] = await connection.query(
                'SELECT nama, stok FROM items WHERE id = ? AND idUser = ? FOR UPDATE',
                [item.id, req.userId]
            );
            if (stockRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: `Barang ${item.nama || item.id} tidak ditemukan.` });
            }
            if (Number(stockRows[0].stok) < item.qty) {
                await connection.rollback();
                return res.status(400).json({ message: `Stok ${stockRows[0].nama} tidak cukup. Sisa stok ${stockRows[0].stok}.` });
            }
        }

        //Simpan ke tabel transactions
        const [transResult] = await connection.query(
            'INSERT INTO transactions (no_nota, total_item, total_belanja, uang_tunai, kembalian, idUser) VALUES (?, ?, ?, ?, ?, ?)',
            [noNota, totalItem, calculatedTotal, Number(uangTunai), Number(uangTunai) - calculatedTotal, req.userId]
        );
        const idTransaksi = transResult.insertId;

        //Simpan detail barang & kurangi stok
        for (let item of normalizedCart) {
            // Simpan detail
            await connection.query(
                'INSERT INTO transaction_details (id_transaksi, id_barang, kode_barang, nama_barang, qty, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [idTransaksi, item.id, item.kode, item.nama, item.qty, item.harga, item.harga * item.qty]
            );

            // Kurangi stok di tabel items
            await connection.query(
                'UPDATE items SET stok = stok - ? WHERE id = ? AND idUser = ? AND stok >= ?',
                [item.qty, item.id, req.userId, item.qty]
            );
        }

        const [negativeRows] = await connection.query(
            'SELECT COUNT(*) AS total FROM items WHERE idUser = ? AND stok < 0',
            [req.userId]
        );
        if (negativeRows[0].total > 0) {
            throw new Error('Stok tidak valid.');
        }

        await connection.commit();
        res.status(201).json({ message: 'Transaksi berhasil disimpan!', no_nota: noNota });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan transaksi.' });
    } finally {
        connection.release();
    }
};

// Mengambil semua riwayat transaksi untuk tabel
exports.getAllTransactions = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [transactions] = await connection.query(
            'SELECT id, no_nota, total_item, total_belanja, tanggal FROM transactions WHERE idUser = ? ORDER BY tanggal DESC',
            [req.userId]
        );
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil riwayat transaksi.' });
    } finally {
        connection.release();
    }
};

// Mengambil detail satu transaksi beserta barang-barangnya (Untuk Struk)
exports.getTransactionDetail = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        
        //Ambil data nota utama
        const [trans] = await connection.query(
            'SELECT * FROM transactions WHERE id = ? AND idUser = ?', 
            [id, req.userId]
        );
        
        if (trans.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        //Ambil rincian barang yang dibeli di transaksi tersebut
        const [details] = await connection.query(
            'SELECT nama_barang, qty, harga_satuan, subtotal FROM transaction_details WHERE id_transaksi = ?', 
            [id]
        );

        res.status(200).json({
            transaksi: trans[0],
            details: details
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil detail transaksi.' });
    } finally {
        connection.release();
    }
};

// Mengambil data analitik untuk grafik profil
exports.getAnalytics = async (req, res) => {
    const connection = await db.getConnection();
    try {
        //Ambil semua transaksi (untuk grafik garis & pie chart waktu)
        const [transactions] = await connection.query(
            'SELECT total_belanja, tanggal FROM transactions WHERE idUser = ? ORDER BY tanggal ASC',
            [req.userId]
        );

        //Ambil 5 Barang Terlaku (Gabungkan detail & nota)
        const [topItems] = await connection.query(
            `SELECT td.nama_barang, SUM(td.qty) as total_qty
             FROM transaction_details td
             JOIN transactions t ON td.id_transaksi = t.id
             WHERE t.idUser = ?
             GROUP BY td.nama_barang
             ORDER BY total_qty DESC
             LIMIT 5`,
            [req.userId]
        );

        res.status(200).json({ transactions, topItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data analitik.' });
    } finally {
        connection.release();
    }
};
