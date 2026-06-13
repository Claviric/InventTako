# Cara Menjalankan InvenTako

## 1. Siapkan MySQL

Gunakan XAMPP, Laragon, MySQL Server, atau MariaDB.

Jika memakai phpMyAdmin:

1. Buka `http://localhost/phpmyadmin`.
2. Klik tab `Import`.
3. Pilih file `backend/inventako.sql`.
4. Klik `Go`.

Database yang dibuat bernama `inventako`.

## 2. Cek konfigurasi backend

File konfigurasi ada di `backend/.env`.

Isi default:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventako
JWT_SECRET=inventako_secret_dev
```

Jika MySQL kamu memakai password, isi bagian `DB_PASSWORD`.

Contoh:

```env
DB_PASSWORD=password_mysql_kamu
```

## 3. Install Node.js

Pastikan Node.js sudah terinstall.

Cek di terminal:

```bash
node -v
npm -v
```

Jika belum ada, install Node.js versi LTS dari website resmi Node.js.

## 4. Install dependency backend

Buka terminal di folder `backend`:

```bash
cd "C:\Materi Kuliah\Materi Kuliah Semester 4\Impal\Tubes\InvenTako-main\backend"
npm install
```

## 5. Jalankan backend

Masih di folder `backend`, jalankan:

```bash
npm start
```

Jika berhasil, terminal akan menampilkan:

```text
Server jalan di http://localhost:3000
```

Backend juga akan mengecek dan membuat tabel otomatis jika belum ada.

## 6. Buka aplikasi

Buka browser:

```text
http://localhost:3000
```

Mulai dari halaman register, lalu login.

Catatan: email register harus berakhiran `@gmail.com`.
