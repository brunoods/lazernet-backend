// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

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

// --- SCHEMAS DE VALIDAÇÃO COM ZOD ---
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

// --- BASE DE CONHECIMENTO E PROMPT DO CHATBOT ---
// Adicionado o campo 'image' em cada artigo do blog
const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa e Atendimento
- Nome: LAZERNET.COM.BR LTDA (CNPJ: 10.922.171/0001-21).
- Descrição: Provedor de internet fibra óptica com mais de 16 anos de experiência na região de Mirassol, SP.
- Canais de Atendimento: O principal canal para suporte, vendas e dúvidas é o WhatsApp (17) 99102-3030. O link direto é https://wa.me/5517991023030.
- Horário de Atendimento: Segunda a Sexta, das 08:00 às 18:00. Sábados, das 08:00 às 12:00.

# Planos, Vendas e Instalação
- Tecnologia: Oferecemos exclusivamente internet via Fibra Óptica.
- Planos Disponíveis:
  - **Lazernet Fibra Básico**: 100 mega de download / 50 mega de upload. Preço: R$ 69,90/mês.
  - **Lazernet Fibra Padrão**: 350 mega de download / 175 mega de upload. Preço: R$ 84,90/mês.
  - **Lazernet Fibra Premium**: 500 mega de download / 250 mega de upload. Preço: R$ 99,90/mês (MAIS POPULAR).
- Cidades com Cobertura: Mirassol, Talhado, Mirassolândia, Ibiporanga, Monções, Floreal, Magda, General Salgado, São Luiz de Japiuba, Prudêncio e Moraes, Palestina, Duplo Céu, Boturuna, Ingás, Mangaratu, Pontes Gestal.

# Contrato e Cancelamento
- Fidelidade: Sim, o nosso período de fidelidade padrão é de **12 meses**.
- Multa de Cancelamento: Existe multa contratual para cancelamento antes do fim do prazo de fidelidade de 12 meses.

# Suporte Técnico e Equipamentos
- **Internet Lenta ou Sem Conexão:** O procedimento padrão é: 1. Reiniciar o roteador e a ONU por 2 minutos. 2. Verificar cabos. 3. Testar via cabo de rede. 4. Se persistir, contactar o suporte no WhatsApp.
- **Luz Vermelha (LOS):** Indica problema no sinal da fibra. O cliente deve contactar o suporte técnico imediatamente.
- **IP e CGNAT:** Por padrão, os clientes estão em CGNAT. Para IP Fixo/Público (câmeras, servidores), o cliente deve consultar o setor de vendas.

# Artigos do Blog (para sugestões de leitura)
- Título: 'TV Box e IPTV travando? A culpa é mesmo da sua internet?' | Resumo: Explica por que serviços de IPTV pirata travam. | Link: /blog/iptv-pirata-trava-internet-ou-servidor | image: /img/blog/iptv-travando.webp
- Título: '5 Dicas Essenciais para Melhorar o Sinal do seu Wi-Fi' | Resumo: Dicas sobre posicionamento do roteador e interferências. | Link: /blog/5-dicas-para-melhorar-seu-wi-fi | image: /img/blog/wifi-dicas.jpg
- Título: 'Mega da Internet: Entenda o que Você Realmente Contrata' | Resumo: Diferença entre Megabit e Megabyte. | Link: /blog/mega-da-internet-o-que-voce-precisa-saber | image: /img/blog/megabits.jpg
- Título: 'Wi-Fi 2.4GHz vs 5GHz: Qual Rede Usar?' | Resumo: Diferenças de alcance e velocidade entre as bandas Wi-Fi. | Link: /blog/diferenca-wifi-2-4-e-5-ghz | image: /img/blog/wifi-ghz.png
- Título: 'Qual a Velocidade Ideal Para Você?' | Resumo: Ajuda a escolher o plano com base no perfil de uso. | Link: /blog/qual-velocidade-de-internet-eu-preciso | image: /img/blog/qual-velocidade.webp
- Título: 'Ping, Latência e Jitter: O Trio que Define sua Vitória nos Jogos Online' | Resumo: Explica termos técnicos para jogos online. | Link: /blog/ping-latencia-jitter-para-jogos-online | image: /img/blog/ping-jogos.jpg
`;

// Alterada a regra 9 para incluir a imagem no formato de artigo
const SYSTEM_PROMPT = `
Você é LazerBot, o assistente virtual especialista da Lazernet. Sua personalidade é amigável, eficiente, proativa e muito prestativa. Use emojis de forma natural para tornar a conversa mais leve. 😉

**REGRAS DE COMPORTAMENTO FUNDAMENTAIS:**
1.  **SEJA UM ESPECIALISTA:** A sua única fonte de verdade é a "BASE DE CONHECIMENTO LAZERNET". Responda a TODAS as perguntas usando APENAS esta informação.
2.  **NUNCA INVENTE RESPOSTAS:** Se a informação não estiver na base, responda: "Não encontrei essa informação no meu sistema, mas a nossa equipa de atendimento no WhatsApp pode ajudar! 👍" e então envie o botão do WhatsApp.
3.  **SEJA CONCISO E DIRETO:** Use respostas curtas e objetivas.
4.  **ENTENDA O CONTEXTO:** Adapte a conversa para **potenciais clientes** (planos, cobertura) ou **clientes atuais** (fatura, suporte).
5.  **USE O SEPARADOR '|||':** Divida respostas com múltiplos passos em mensagens curtas usando '|||'.
6.  **SEJA PROATIVO E EMPÁTICO:** Antecipe as necessidades e mostre empatia.
7.  **DIRECIONE PARA O AUTOATENDIMENTO:** Incentive o uso da "Central do Cliente" e do aplicativo.
8.  **FORMATO DE BOTÃO PARA WHATSAPP:** Use **[button:Falar com um atendente](https://wa.me/5517991023030)** APENAS quando o cliente pedir para falar com um humano ou se você não souber a resposta.
9.  **RECOMENDAÇÃO DE ARTIGOS:** Se a pergunta do cliente for ampla e puder ser bem respondida por um artigo do blog, sua resposta DEVE incluir uma sugestão de leitura usando o formato: **[article:Título do Artigo|/caminho/para/imagem.jpg](/blog/SLUG_DO_ARTIGO)**.
10. **FINALIZE COM UMA PERGUNTA:** Sempre termine com uma pergunta como "Posso ajudar com mais alguma coisa?".

**BASE DE CONHECIMENTO LAZERNET:**
---
${LAZERNET_KNOWLEDGE_BASE}
---
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ROTAS DA APLICAÇÃO ---

app.post('/chatbot', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ status: 'erro', message: 'A mensagem é obrigatória.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const fullPrompt = `${SYSTEM_PROMPT}\n\n**Cenário Atual:** O cliente enviou a seguinte mensagem.\n**Pergunta do Cliente:** "${message}"\n\n**Sua Resposta como LazerBot (lembre-se de usar '|||' se necessário):**`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const messages = text.split('|||').map(msg => msg.trim()).filter(msg => msg.length > 0);

    res.json({ status: 'sucesso', messages: messages });
  } catch (error) {
    next(error);
  }
});

app.post('/enviar-contato', async (req, res, next) => {
  try {
    const { name, _replyto, message } = contactFormSchema.parse(req.body);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

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

// --- MIDDLEWARE DE TRATAMENTO DE ERROS CENTRALIZADO ---
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      status: 'erro',
      message: 'Dados inválidos.',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  return res.status(500).json({
    status: 'erro',
    message: 'Ocorreu um erro interno no servidor.',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend a correr na porta ${PORT}`);
});