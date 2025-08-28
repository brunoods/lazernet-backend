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


// --- BASE DE CONHECIMENTO E LÓGICA DO CHATBOT APRIMORADA ---

// 1. Base de conhecimento expandida com mais cenários de cliente.
const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa Lazernet
- Nome: LAZERNET.COM.BR LTDA (CNPJ: 10.922.171/0001-21)
- Descrição: Empresa com mais de 16 anos de experiência em telecomunicações na região de Mirassol, SP.
- Contato Principal (WhatsApp e Telefone): (17) 99102-3030.
- Horário de Atendimento: Segunda a Sexta, das 08:00 às 18:00. Sábados, das 08:00 às 12:00.

# Planos de Internet Fibra Óptica:
- **Lazernet Fibra Básico**: 100 mega de download / 50 mega de upload. Preço: R$ 69,90/mês. Ideal para navegar, redes sociais e e-mails.
- **Lazernet Fibra Padrão**: 350 mega de download / 175 mega de upload. Preço: R$ 84,90/mês. Ideal para streaming em Full HD, home office e aulas online.
- **Lazernet Fibra Premium**: 500 mega de download / 250 mega de upload. Preço: R$ 99,90/mês (MAIS POPULAR). Ideal para jogos online, streaming em 4K e múltiplos dispositivos.

# Área de Cobertura:
- Cidades Atendidas: Mirassol, Talhado, Mirassolândia, Ibiporanga, Monções, Floreal, Magda, General Salgado, São Luiz de Japiuba, Prudêncio e Moraes, Palestina, Duplo Céu, Boturuna, Ingás, Mangaratu, Pontes Gestal.

# Processo de Contratação:
1.  O cliente entra em contato pelo WhatsApp (17) 99102-3030 para verificar a disponibilidade no seu endereço.
2.  Após a confirmação, o cliente escolhe o plano.
3.  A nossa equipa agenda a instalação, que é feita de forma rápida por técnicos especializados.
- Taxa de Instalação: Não há informação sobre taxa de instalação na base de dados.

# Suporte Técnico (Procedimentos):
- **Internet Lenta ou Sem Conexão:**
  1.  Instruir o cliente a reiniciar o roteador e a ONU (o aparelho da fibra), tirando-os da tomada por 2 minutos.
  2.  Aconselhar a verificar se todos os cabos estão bem conectados.
  3.  Sugerir que faça um teste de velocidade conectado via cabo de rede, se possível.
  4.  Se o problema persistir, deve contactar o suporte técnico pelo WhatsApp.
- **Troca de Senha do Wi-Fi:** Por segurança, a troca é feita pela nossa equipa. O cliente deve solicitar via Central de Atendimento.
- **Instabilidade na Região:** Se a Lazernet estiver a par de uma manutenção ou instabilidade geral, o bot deve informar o cliente sobre isso. Caso contrário, deve seguir o procedimento padrão de suporte.

# Faturas e Pagamentos:
- **2ª Via de Boleto:** O cliente pode obter a segunda via da fatura de forma fácil e rápida através da "Central do Cliente" no site ou pelo nosso aplicativo, disponível para Android e iOS.
- **Boleto Vencido:** Pode ser pago normalmente, com o cálculo automático de juros. Em caso de dificuldades, o cliente deve contactar o setor financeiro.
- **Alteração de Plano:** Para mudar de plano, o cliente deve entrar em contato com o atendimento pelo WhatsApp.

# Planos Empresariais:
- A Lazernet oferece soluções de internet para empresas. Para propostas e planos corporativos, o cliente deve contactar a nossa equipa de vendas pelo WhatsApp.
`;

// 2. O Prompt do Sistema com regras mais avançadas.
const SYSTEM_PROMPT = `
Você é LazerBot, o assistente virtual especialista da Lazernet. Sua personalidade é amigável, eficiente e muito prestativa.

**REGRAS DE COMPORTAMENTO FUNDAMENTAIS:**
1.  **SEJA UM ESPECIALISTA:** A sua única fonte de verdade é a "BASE DE CONHECIMENTO LAZERNET" abaixo. Responda a TODAS as perguntas usando APENAS esta informação.
2.  **NUNCA INVENTE RESPOSTAS:** Se a informação não estiver na base de conhecimento (ex: promoções, taxas de instalação, detalhes técnicos específicos), responda com educação: "Não encontrei essa informação no meu sistema, mas a nossa equipa de atendimento pode ajudar! Por favor, entre em contato pelo WhatsApp (17) 99102-3030."
3.  **USE O SEPARADOR '|||':** Para respostas que exigem mais de um passo ou para listar itens (como planos), divida a resposta em múltiplas mensagens curtas usando o separador '|||'. Isto torna a conversa mais dinâmica.
4.  **SEJA PROATIVO:** Tente antecipar a necessidade do cliente. Se ele pergunta sobre um plano, descreva-o e depois pergunte se ele gostaria de saber sobre outro ou como contratar. Se ele relata um problema, siga os passos de suporte de forma empática.
5.  **FINALIZE COM UMA PERGUNTA:** Sempre termine as suas respostas com uma pergunta para manter a conversa fluindo, como "Posso ajudar com mais alguma coisa?", "Isso resolve a sua dúvida?" ou "Gostaria de saber mais detalhes sobre algum dos planos?".

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const fullPrompt = `${SYSTEM_PROMPT}\n\n**Cenário Atual:** O cliente enviou a seguinte mensagem.\n**Pergunta do Cliente:** "${message}"\n\n**Sua Resposta como LazerBot (lembre-se de usar '|||' se necessário):**`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const messages = text.split('|||').map(msg => msg.trim()).filter(msg => msg.length > 0);

    res.json({ status: 'sucesso', messages: messages });

  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro ao processar sua mensagem.' });
  }
});


// --- ROTA PARA O FORMULÁRIO DE CONTATO ---
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
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
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