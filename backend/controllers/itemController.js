const db = require('../config/database');

exports.getItems = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM items WHERE idUser = ? ORDER BY id DESC', [req.userId]);
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server saat mengambil data barang.' });
    }
};

exports.createItem = async (req, res) => {
    const { kode, nama, kategori, harga, stok, deskripsi } = req.body;
    
    if (!kode || !nama || !kategori || !harga || !stok) {
        return res.status(400).json({ message: 'Semua kolom wajib diisi!' });
    }

    try {
        // Cek apakah kode barang sudah ada untuk user ini
        const [existing] = await db.query('SELECT * FROM items WHERE kode = ? AND idUser = ?', [kode, req.userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kode barang sudah digunakan!' });
        }

        await db.query(
            'INSERT INTO items (kode, nama, kategori, harga, stok, deskripsi, idUser) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [kode, nama, kategori, harga, stok, deskripsi || '', req.userId]
        );
        res.status(201).json({ message: 'Barang berhasil ditambahkan!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server saat menambahkan barang.' });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM items WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (items.length === 0) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
        res.status(200).json(items[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server saat mengambil data barang.' });
    }
};

exports.updateItem = async (req, res) => {
    const { kode, nama, kategori, harga, stok, deskripsi } = req.body;
    
    if (!kode || !nama || !kategori || !harga || !stok) {
        return res.status(400).json({ message: 'Semua kolom wajib diisi!' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM items WHERE kode = ? AND id != ? AND idUser = ?', [kode, req.params.id, req.userId]);
        if (existing.length > 0) return res.status(400).json({ message: 'Kode barang sudah digunakan oleh barang lain!' });

        const [result] = await db.query(
            'UPDATE items SET kode = ?, nama = ?, kategori = ?, harga = ?, stok = ?, deskripsi = ? WHERE id = ? AND idUser = ?',
            [kode, nama, kategori, harga, stok, deskripsi || '', req.params.id, req.userId]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
        res.status(200).json({ message: 'Barang berhasil diperbarui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server saat memperbarui barang.' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM items WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
        res.status(200).json({ message: 'Barang berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server saat menghapus barang.' });
    }
};
