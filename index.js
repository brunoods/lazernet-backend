// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { SYSTEM_PROMPT } = require('./chatbotConfig'); 

// VERIFICAÇÃO INICIAL DE VARIÁVEIS DE AMBIENTE
const requiredEnvVars = [
  'CORS_ORIGINS', 'GEMINI_API_KEY', 'SMTP_HOST', 'SMTP_PORT',
  'SMTP_USER', 'SMTP_PASS', 'EMAIL_TO'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`❌ Erro Crítico: As seguintes variáveis de ambiente estão em falta: ${missingVars.join(', ')}`);
  process.exit(1); 
}

const app = express();

// CONFIGURAÇÃO DE CORS
const allowedOrigins = process.env.CORS_ORIGINS.split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Este domínio não tem permissão pela política de CORS.'));
    }
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SCHEMAS DE VALIDAÇÃO COM ZOD
const contactFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  _replyto: z.string().email("Por favor, insira um e-mail válido."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
});
const newsletterSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  _replyto: z.string().email("Por favor, insira um e-mail válido."),
  whatsapp: z.string().optional(),
});
const chatbotSchema = z.object({
    message: z.string().min(1, "A mensagem não pode estar vazia.").max(500, "A mensagem é muito longa."),
});

// INSTÂNCIAS DE SERVIÇOS
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ROTA DO CHATBOT COM TRATAMENTO DE ERRO DE QUOTA
app.post('/chatbot', async (req, res, next) => {
  try {
    const { message } = chatbotSchema.parse(req.body);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n**Pergunta do Cliente:** "${message}"\n\n**Sua Resposta como LazerBot:**`;
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A API demorou muito para responder.')), 10000)
    );
    const result = await Promise.race([
        model.generateContent(fullPrompt),
        timeoutPromise
    ]);
    const response = await result.response;
    const text = response.text();
    const messages = text.split('|||').map(msg => msg.trim()).filter(Boolean);
    res.json({ status: 'sucesso', messages });
  } catch (error) {
    console.error(`[CHATBOT_ERROR]: ${error.message}`);
    // --- ALTERAÇÃO APLICADA AQUI ---
    // Verifica se o erro é de limite de quota (status 429)
    if (error.status === 429) {
      return res.status(429).json({
        status: 'erro_quota',
        // Mensagem mais amigável para o utilizador
        messages: ["Estou a receber muitas perguntas no momento! 😅 Por favor, tente novamente em alguns instantes."]
      });
    }
    next(error);
  }
});

app.post('/enviar-contato', async (req, res, next) => {
  try {
    const { name, _replyto, message } = contactFormSchema.parse(req.body);
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Nova Mensagem de Contato de ${name}`,
      replyTo: _replyto,
      html: `<p><strong>Nome:</strong> ${name}</p><p><strong>E-mail:</strong> ${_replyto}</p><hr><p><strong>Mensagem:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });
    res.status(200).json({ status: 'sucesso', message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    next(error);
  }
});

app.post('/inscrever-newsletter', async (req, res, next) => {
  try {
    const { name, _replyto, whatsapp } = newsletterSchema.parse(req.body);
    await transporter.sendMail({
      from: `"Inscrição Newsletter" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Nova Inscrição na Newsletter: ${name}`,
      replyTo: _replyto,
      html: `<p><strong>Nome:</strong> ${name}</p><p><strong>E-mail:</strong> ${_replyto}</p>${whatsapp ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>` : ''}`,
    });
    res.status(200).json({ status: 'sucesso', message: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    next(error);
  }
});


// MIDDLEWARE DE TRATAMENTO DE ERROS CENTRALIZADO
app.use((err, req, res, next) => {
  console.error(err); 
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      status: 'erro',
      message: 'Dados inválidos.',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }
  // Se a resposta ainda não foi enviada, envia uma resposta de erro genérica.
  if (!res.headersSent) {
    return res.status(500).json({
      status: 'erro',
      message: 'Ocorreu um erro inesperado no servidor. Por favor, tente novamente mais tarde.',
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend a correr na porta ${PORT}`);
});