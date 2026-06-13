const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));
const sendApp = (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
};

app.get('/', sendApp);
app.get([
    '/login.html',
    '/register.html',
    '/dashboard.html',
    '/barang.html',
    '/tambah-barang.html',
    '/edit-barang.html',
    '/transaksi.html',
    '/riwayat-transaksi.html',
    '/profil.html'
], sendApp);

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const transactionsRoutes = require('./routes/transactions');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/transactions', transactionsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
