require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Servírování statických souborů
app.use(express.static(path.join(__dirname, '..')));

// Výchozí route pro index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Pro případ self-signed certifikátu
    }
});

// Endpoint pro odeslání emailu
app.post('/send-report', async (req, res) => {
    try {
        const { email, report } = req.body;

        // Kontrola emailu
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ error: 'Neplatný email' });
        }

        // Odeslání emailu
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Váš report z Hypoteeka.cz prescoring kalkulačky',
            text: report,
            html: report.replace(/\n/g, '<br>')
        });

        res.json({ message: 'Email byl úspěšně odeslán' });
    } catch (error) {
        console.error('Chyba při odesílání emailu:', error);
        res.status(500).json({ error: 'Chyba při odesílání emailu' });
    }
});

// Start serveru
app.listen(port, () => {
    console.log(`Server běží na portu ${port}`);
});
