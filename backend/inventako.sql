CREATE DATABASE IF NOT EXISTS inventako;
USE inventako;

CREATE TABLE IF NOT EXISTS user (
    idUser INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

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
);

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
);

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
);
