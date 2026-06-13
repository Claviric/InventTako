const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const sslConfig = () => {
    if (process.env.DB_SSL !== 'true') return undefined;
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    if (process.env.DB_CA_CERT_PATH) {
        return {
            ca: fs.readFileSync(process.env.DB_CA_CERT_PATH, 'utf8'),
            rejectUnauthorized
        };
    }
    return { rejectUnauthorized };
};

const db = mysql.createPool({
    host: process.env.DB_CONNECT_HOST || process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig()
});

// Otomatis membuat tabel jika belum ada
const initDB = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user (
                idUser INT AUTO_INCREMENT PRIMARY KEY,
                Username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `;
        await db.query(createTableQuery);

        const createItemsTableQuery = `
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kode VARCHAR(50) NOT NULL,
                nama VARCHAR(255) NOT NULL,
                kategori VARCHAR(100) NOT NULL,
                harga DECIMAL(15, 2) NOT NULL,
                stok INT NOT NULL,
                deskripsi TEXT,
                idUser INT NOT NULL,
                FOREIGN KEY (idUser) REFERENCES user(idUser) ON DELETE CASCADE
            )
        `;
        await db.query(createItemsTableQuery);

        const createTransactionsTableQuery = `
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                no_nota VARCHAR(50) NOT NULL UNIQUE,
                total_item INT NOT NULL,
                total_belanja DECIMAL(15, 2) NOT NULL,
                uang_tunai DECIMAL(15, 2) NOT NULL,
                kembalian DECIMAL(15, 2) NOT NULL,
                tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
                idUser INT NOT NULL,
                FOREIGN KEY (idUser) REFERENCES user(idUser) ON DELETE CASCADE
            )
        `;
        await db.query(createTransactionsTableQuery);

        const createTransactionDetailsTableQuery = `
            CREATE TABLE IF NOT EXISTS transaction_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_transaksi INT NOT NULL,
                id_barang INT,
                kode_barang VARCHAR(50),
                nama_barang VARCHAR(255),
                qty INT NOT NULL,
                harga_satuan DECIMAL(15, 2) NOT NULL,
                subtotal DECIMAL(15, 2) NOT NULL,
                FOREIGN KEY (id_transaksi) REFERENCES transactions(id) ON DELETE CASCADE,
                FOREIGN KEY (id_barang) REFERENCES items(id) ON DELETE SET NULL
            )
        `;
        await db.query(createTransactionDetailsTableQuery);
        
        console.log("Database siap: Tabel 'user', 'items', 'transactions', dan 'transaction_details' berhasil dicek/dibuat otomatis.");
    } catch (error) {
        console.error("Gagal membuat tabel:", error);
    }
};

initDB();

module.exports = db;
