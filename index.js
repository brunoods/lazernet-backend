// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// --- ROTA PARA O FORMULÁRIO DE CONTATO ---
app.post('/enviar-contato', async (req, res) => {
  const { name, _replyto, message } = req.body;

  if (!name || !_replyto || !message) {
    return res.status(400).json({ status: 'erro', message: 'Faltam campos obrigatórios.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Nova Mensagem de Contato de ${name}`,
      replyTo: _replyto,
      html: `
        <h3>Nova mensagem de Contato recebida do site:</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${_replyto}</p>
        <hr>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });
    res.status(200).json({ status: 'sucesso', message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro no formulário de contato:', error);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro interno.' });
  }
});

// --- ROTA PARA O FORMULÁRIO DE NEWSLETTER ---
app.post('/inscrever-newsletter', async (req, res) => {
  const { name, _replyto, whatsapp } = req.body;

  if (!name || !_replyto) {
    return res.status(400).json({ status: 'erro', message: 'Nome e e-mail são obrigatórios.' });
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"Inscrição Newsletter" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Nova Inscrição na Newsletter: ${name}`,
      replyTo: _replyto,
      html: `
        <h3>Nova inscrição na Newsletter recebida do site:</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${_replyto}</p>
        ${whatsapp ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>` : ''}
      `,
    });
    res.status(200).json({ status: 'sucesso', message: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    console.error('Erro no formulário de newsletter:', error);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro interno.' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend a correr na porta ${PORT}`);
});