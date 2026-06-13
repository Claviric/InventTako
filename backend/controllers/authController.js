const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password tidak boleh kosong!' });
    }

    // CEK FORMAT GMAIL
    if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Email harus berakhiran @gmail.com!' });
    }

    // AMBIL USERNAME DARI EMAIL
    const extractedUsername = email.split('@')[0];

    try {
        const [existing] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email sudah terdaftar!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // UPDATE QUERY: Tambahkan Username ke database
        await db.query(
            'INSERT INTO user (Username, email, password) VALUES (?, ?, ?)', 
            [extractedUsername, email, hashedPassword]
        );
        
        res.status(201).json({ message: 'Registrasi berhasil!' });
    } catch (error) {
        res.status(500).json({ message: 'Error server saat registrasi.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ message: 'Email tidak ditemukan.' });

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) return res.status(401).json({ message: 'Password salah.' });

        const token = jwt.sign({ id: users[0].idUser }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ message: 'Login berhasil!', token, username: users[0].Username });
    } catch (error) {
        res.status(500).json({ message: 'Error server saat login.' });
    }
};