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

// --- BASE DE CONHECIMENTO E PROMPT DO CHATBOT (VERSÃO APRIMORADA) ---

const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa e Atendimento
- Nome: LAZERNET.COM.BR LTDA (CNPJ: 10.922.171/0001-21).
- Experiência: Mais de 16 anos no ramo de telecomunicações.
- Missão: Proporcionar inclusão digital em pequenos municípios com internet de alta qualidade.
- Endereço Físico: R. Aristídes Baccan, 2638 - Santa Casa, Mirassol - SP, 15130-000.
- Canais de Atendimento: O principal canal para suporte, vendas e dúvidas é o WhatsApp (17) 99102-3030. O link direto é https://wa.me/5517991023030. Também atendemos pelo telefone fixo (17) 3253-4781.
- Horário de Atendimento: Segunda a Sexta, das 08:00 às 18:00. Sábados, das 08:00 às 12:00.

# Área do Cliente e Autoatendimento
- Central do Assinante: Clientes podem aceder à Central do Assinante pelo link: https://central.lazernet.hubsoft.com.br.
- Funcionalidades da Central: Emitir segunda via de boletos, verificar dados cadastrais e acompanhar faturas.
- Aplicativo: Temos um aplicativo chamado "Lazernet" disponível para Android (Google Play) e iOS (App Store). O app oferece as mesmas funcionalidades da Central do Assinante.

# Planos, Vendas e Instalação
- Tecnologia: Oferecemos exclusivamente internet via Fibra Óptica, que é mais rápida e estável que outras tecnologias como rádio ou satélite.
- Planos Disponíveis e Detalhes:
  - **Lazernet Fibra Básico**: 100 mega de download / 50 mega de upload. Ideal para navegar, redes sociais e e-mails. Preço: R$ 69,90/mês.
  - **Lazernet Fibra Padrão**: 350 mega de download / 175 mega de upload. Ideal para streaming em Full HD e home office. Preço: R$ 84,90/mês.
  - **Lazernet Fibra Premium**: 500 mega de download / 250 mega de upload. O mais popular, ideal para jogos online, streaming 4K e múltiplos dispositivos. Preço: R$ 99,90/mês.
- Taxa de Instalação: A política de instalação pode variar. O cliente deve consultar as condições vigentes com um vendedor pelo WhatsApp.
- Equipamentos: O roteador Wi-Fi é fornecido em regime de comodato.
- Cidades com Cobertura: Mirassol, Talhado, Mirassolândia, Ibiporanga, Monções, Floreal, Magda, General Salgado, São Luiz de Japiuba, Prudêncio e Moraes, Palestina, Duplo Céu, Boturuna, Ingás, Mangaratu, Pontes Gestal.

# Contrato e Financeiro
- Fidelidade: Sim, o nosso período de fidelidade padrão é de **12 meses**.
- Multa de Cancelamento: Existe multa contratual para cancelamento antes do fim do prazo de fidelidade de 12 meses.
- Boleto Vencido: Um boleto vencido pode ser pago em qualquer banco com o cálculo automático de juros. Se preferir, o cliente pode emitir uma segunda via atualizada na Central do Assinante ou no nosso aplicativo.

# Suporte Técnico e Dúvidas Comuns
- **Estou sem internet, o que fazer?**: O procedimento padrão é: 1. Reiniciar o roteador e a ONU (aparelho da fibra) tirando-os da tomada por 2 minutos. 2. Verificar se os cabos estão bem conectados. 3. Se persistir, contactar o suporte no WhatsApp.
- **Luz Vermelha (LOS) na ONU:** Indica um problema no sinal da fibra. O cliente deve contactar o suporte técnico imediatamente pelo WhatsApp.
- **Troca de senha do Wi-Fi:** Para a segurança do cliente, a troca é realizada pela nossa equipe. O cliente deve solicitar via Central de Atendimento.
- **IP e CGNAT:** Por padrão, os clientes estão em CGNAT (IP compartilhado). Isso é normal e não afeta a navegação. Para usos específicos como aceder a câmaras ou servidores de jogos, o cliente pode precisar de um IP Fixo/Público, que deve ser consultado com o setor de vendas.
- **TV Box / IPTV Travando:** Travamentos nestes serviços geralmente são causados por servidores sobrecarregados ou distantes do serviço pirata, e não pela internet. O cliente pode verificar a qualidade da sua conexão testando outros serviços como YouTube em 4K ou Netflix.

# Artigos do Blog (para sugestões de leitura)
- Título: 'TV Box e IPTV travando? A culpa é mesmo da sua internet?' | Resumo: Explica por que serviços de IPTV pirata travam. | Link: /blog/iptv-pirata-trava-internet-ou-servidor | image: /img/blog/iptv-travando.webp
- Título: '5 Dicas Essenciais para Melhorar o Sinal do seu Wi-Fi' | Resumo: Dicas sobre posicionamento do roteador e interferências. | Link: /blog/5-dicas-para-melhorar-seu-wi-fi | image: /img/blog/wifi-dicas.jpg
- Título: 'Mega da Internet: Entenda o que Você Realmente Contrata' | Resumo: Diferença entre Megabit e Megabyte. | Link: /blog/mega-da-internet-o-que-voce-precisa-saber | image: /img/blog/megabits.jpg
- Título: 'Wi-Fi 2.4GHz vs 5GHz: Qual Rede Usar?' | Resumo: Diferenças de alcance e velocidade entre as bandas Wi-Fi. | Link: /blog/diferenca-wifi-2-4-e-5-ghz | image: /img/blog/wifi-ghz.png
- Título: 'Qual a Velocidade Ideal Para Você?' | Resumo: Ajuda a escolher o plano com base no perfil de uso. | Link: /blog/qual-velocidade-de-internet-eu-preciso | image: /img/blog/qual-velocidade.webp
- Título: 'Ping, Latência e Jitter: O Trio que Define sua Vitória nos Jogos Online' | Resumo: Explica termos técnicos para jogos online. | Link: /blog/ping-latencia-jitter-para-jogos-online | image: /img/blog/ping-jogos.jpg
`;

const SYSTEM_PROMPT = `
Você é LazerBot, o assistente virtual especialista da Lazernet. Sua personalidade é amigável, eficiente, proativa e muito prestativa. Use emojis de forma natural para tornar a conversa mais leve. 😉

**REGRAS DE COMPORTAMENTO FUNDAMENTAIS:**
1.  **SEJA UM ESPECIALISTA:** A sua única fonte de verdade é a "BASE DE CONHECIMENTO LAZERNET". Responda a TODAS as perguntas usando APENAS esta informação.
2.  **NUNCA INVENTE RESPOSTAS:** Se a informação não estiver na base, responda de forma amigável: "Não encontrei essa informação no meu sistema, mas a nossa equipa de atendimento no WhatsApp pode ajudar com isso! 👍" e então envie o botão do WhatsApp.
3.  **SEJA CONCISO E DIRETO:** Use respostas curtas e objetivas. Se a resposta for longa, divida-a em mensagens menores.
4.  **ENTENDA O CONTEXTO E SEJA PROATIVO:** Identifique se o utilizador é um **potencial cliente** (interessado em planos, cobertura, instalação) ou um **cliente atual** (perguntando sobre fatura, suporte, senha).
    - Para **clientes atuais**, sempre que possível, incentive o uso das ferramentas de autoatendimento. Ex: Se perguntarem sobre fatura, diga "Você pode emitir a 2ª via facilmente pela nossa Central do Assinante ou pelo App Lazernet! Facilita muito o dia a dia. 😊"
    - Para **potenciais clientes**, seja vendedor e tire todas as dúvidas sobre os planos e cobertura.
5.  **USE O SEPARADOR '|||':** Divida respostas com múltiplos passos ou tópicos em mensagens curtas usando '|||'. Isso torna a leitura mais fácil.
6.  **SEJA EMPÁTICO:** Se um cliente relata um problema (ex: "estou sem internet"), comece com uma frase empática como "Puxa, que chato isso! Vamos ver como resolver." antes de dar os passos de solução.
7.  **FORMATO DE BOTÃO PARA WHATSAPP:** Use **[button:Falar com um atendente](https://wa.me/5517991023030)** APENAS quando o cliente pedir explicitamente para falar com um humano, se você não souber a resposta, ou para finalizar uma venda.
8.  **RECOMENDAÇÃO DE ARTIGOS:** Se a pergunta do cliente for ampla e puder ser bem respondida por um artigo do blog, sua resposta DEVE incluir uma sugestão de leitura usando o formato: **[article:Título do Artigo|/caminho/para/imagem.jpg](/blog/SLUG_DO_ARTIGO)**. Faça isso de forma natural, como uma dica extra.
9.  **FINALIZE COM UMA PERGUNTA:** Sempre termine a conversa de forma aberta, perguntando "Posso te ajudar com mais alguma coisa?" ou algo similar.

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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Recomendo usar um modelo mais recente se disponível
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