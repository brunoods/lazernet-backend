// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// --- CONFIGURAÇÃO DE CORS USANDO VARIÁVEIS DE AMBIENTE ---
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Este domínio não tem permissão pela política de CORS.'));
    }
  }
};
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// --- BASE DE CONHECIMENTO E LÓGICA DO CHATBOT ---

// 1. Informações extraídas dos ficheiros do seu site para "treinar" o bot
const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa Lazernet
- Nome: LAZERNET.COM.BR LTDA
- CNPJ: 10.922.171/0001-21
- Descrição: Uma empresa com mais de 16 anos de atuação em telecomunicações e redes de internet na região de Mirassol, focada em inclusão digital, tecnologia de ponta e internet de alta qualidade.
- Endereço Principal: R. Aristídes Baccan, 2638 - Santa Casa, Mirassol - SP.
- Contato Principal (WhatsApp): (17) 99102-3030.

# Planos de Internet Fibra Óptica Disponíveis:
- Plano: Lazernet Fibra Básico; Velocidade: 100 mega; Upload: 50 mega; Preço: R$ 69,90/mês; Ideal para: Navegar, redes sociais e e-mails.
- Plano: Lazernet Fibra Padrão; Velocidade: 350 mega; Upload: 175 mega; Preço: R$ 84,90/mês; Ideal para: Streaming em Full HD, home office e aulas online.
- Plano: Lazernet Fibra Premium; Velocidade: 500 mega; Upload: 250 mega; Preço: R$ 99,90/mês (MAIS POPULAR); Ideal para: Jogos online, streaming em 4K e múltiplos dispositivos.

# Área de Cobertura:
- Mirassol (cidade e zona rural)
- Talhado (Distrito)
- Mirassolândia
- Ibiporanga
- Monções
- Floreal
- Magda
- General Salgado
- São Luiz de Japiuba
- Prudêncio e Moraes
- Palestina
- Duplo Céu
- Boturuna
- Ingás
- Mangaratu
- Pontes Gestal

# Perguntas Frequentes (FAQ):
- P: Estou sem Internet. O que devo fazer?
  R: Primeiro, reinicie o seu roteador e o seu modem (o aparelho da fibra), tirando-os da tomada por 2 minutos. Se o sinal não voltar, entre em contato com a nossa central de atendimento.
- P: Qual a diferença entre a rede Wi-Fi 2.4GHz e a 5GHz?
  R: A rede 2.4GHz tem um alcance maior, mas é mais lenta. A rede 5GHz é muito mais rápida e estável, ideal para planos acima de 100 Mega.
- P: Minha TV Box ou IPTV está a travar. É problema na internet?
  R: Geralmente, não. Travamentos em serviços de IPTV costumam acontecer porque os servidores que fornecem o conteúdo são de baixa qualidade ou estão sobrecarregados.
- P: Como faço para trocar a senha do Wi-Fi?
  R: Para sua segurança, a troca de senha deve ser feita pela nossa equipe. Por favor, entre em contato com a nossa Central de Atendimento para solicitar a alteração.
`;

// 2. O Prompt do Sistema que define a personalidade e as regras do bot
const SYSTEM_PROMPT = `
Você é um assistente virtual especialista da Lazernet, um provedor de internet fibra óptica. Seu nome é LazerBot.
Sua personalidade é amigável, prestativa e profissional.
Sua principal função é responder às perguntas dos clientes com base ESTRITAMENTE na "BASE DE CONHECIMENTO LAZERNET" fornecida abaixo.

**REGRAS IMPORTANTES:**
1.  **NÃO INVENTE INFORMAÇÕES.** Se a pergunta for sobre algo que não está na base de conhecimento (ex: promoções específicas, detalhes técnicos não listados, outras cidades), responda de forma educada que você não possui essa informação e instrua o cliente a contactar o atendimento humano pelo WhatsApp (17) 99102-3030.
2.  Seja conciso e direto nas respostas. Use listas (bullet points) se ajudar a organizar a informação.
3.  Quando perguntarem sobre planos, sempre mencione o nome, a velocidade e o preço.
4.  Se o cliente expressar frustração (ex: "minha internet não funciona"), seja empático e siga o procedimento do FAQ.
5.  Sempre que for relevante, termine a sua resposta incentivando o cliente a contratar ou a entrar em contato.

**BASE DE CONHECIMENTO LAZERNET:**
---
${LAZERNET_KNOWLEDGE_BASE}
---
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chatbot', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ status: 'erro', message: 'A mensagem é obrigatória.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    // 3. Juntamos o prompt do sistema com a mensagem do utilizador
    const fullPrompt = `${SYSTEM_PROMPT}\n\n**Pergunta do Cliente:** "${message}"\n\n**Sua Resposta como LazerBot:**`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ status: 'sucesso', message: text });
  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro ao processar sua mensagem.' });
  }
});


// --- ROTAS DE FORMULÁRIO (mantidas como estavam) ---

app.post('/enviar-contato', async (req, res) => {
  const { name, _replyto, message } = req.body;
  if (!name || !_replyto || !message) {
    return res.status(400).json({ status: 'erro', message: 'Faltam campos obrigatórios.' });
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`, to: process.env.EMAIL_TO,
      subject: `Nova Mensagem de Contato de ${name}`, replyTo: _replyto,
      html: `<h3>Nova mensagem de Contato recebida do site:</h3><p><strong>Nome:</strong> ${name}</p><p><strong>E-mail:</strong> ${_replyto}</p><hr><p><strong>Mensagem:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });
    res.status(200).json({ status: 'sucesso', message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro no formulário de contato:', error);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro interno.' });
  }
});

app.post('/inscrever-newsletter', async (req, res) => {
  const { name, _replyto, whatsapp } = req.body;
  if (!name || !_replyto) {
    return res.status(400).json({ status: 'erro', message: 'Nome e e-mail são obrigatórios.' });
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transporter.sendMail({
      from: `"Inscrição Newsletter" <${process.env.SMTP_USER}>`, to: process.env.EMAIL_TO,
      subject: `Nova Inscrição na Newsletter: ${name}`, replyTo: _replyto,
      html: `<h3>Nova inscrição na Newsletter recebida do site:</h3><p><strong>Nome:</strong> ${name}</p><p><strong>E-mail:</strong> ${_replyto}</p>${whatsapp ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>` : ''}`,
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