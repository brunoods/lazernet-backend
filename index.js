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

// 1. Base de conhecimento massivamente expandida com base nas suas perguntas.
const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa e Atendimento
- Nome: LAZERNET.COM.BR LTDA (CNPJ: 10.922.171/0001-21).
- Descrição: Provedor de internet fibra óptica com mais de 16 anos de experiência na região de Mirassol, SP.
- Canais de Atendimento: O principal canal para suporte, vendas e dúvidas é o WhatsApp (17) 99102-3030.
- Horário de Atendimento: Segunda a Sexta, das 08:00 às 18:00. Sábados, das 08:00 às 12:00.
- Atendimento Presencial: Sim, no nosso endereço em R. Aristídes Baccan, 2638 - Santa Casa, Mirassol - SP.
- Autoatendimento: Os clientes podem gerir suas contas, faturas e dados através da "Central do Cliente" no site ou pelo nosso aplicativo, disponível para Android e iOS.
- Privacidade de Dados: A Lazernet trata a privacidade dos dados com seriedade, conforme a Política de Privacidade disponível no nosso site. Não monitoramos os sites que os clientes acessam.

# Planos, Vendas e Instalação
- Tecnologia: Oferecemos exclusivamente internet via Fibra Óptica, que é superior a cabo e rádio em velocidade e estabilidade.
- Planos Disponíveis:
  - **Lazernet Fibra Básico**: 100 mega de download / 50 mega de upload. Preço: R$ 69,90/mês. Ideal para uso básico.
  - **Lazernet Fibra Padrão**: 350 mega de download / 175 mega de upload. Preço: R$ 84,90/mês. Ideal para home office e streaming.
  - **Lazernet Fibra Premium**: 500 mega de download / 250 mega de upload. Preço: R$ 99,90/mês (MAIS POPULAR). Ideal para jogos e múltiplos dispositivos.
- Consulta de Cobertura: Para saber se há disponibilidade, o cliente deve entrar em contato pelo WhatsApp e informar o seu endereço completo.
- Cidades com Cobertura: Mirassol, Talhado, Mirassolândia, Ibiporanga, Monções, Floreal, Magda, General Salgado, São Luiz de Japiuba, Prudêncio e Moraes, Palestina, Duplo Céu, Boturuna, Ingás, Mangaratu, Pontes Gestal.
- Taxa de Instalação: Não há informação sobre taxas na base de dados. O cliente deve consultar no WhatsApp.
- Prazo de Instalação: É agendado com o cliente após a contratação.
- Pacotes de TV ou Telefone: Não oferecemos pacotes de TV ou telefone fixo. O nosso foco é 100% em internet fibra óptica de alta qualidade.
- Upgrade de Plano: Pode ser solicitado a qualquer momento pelo WhatsApp, sem custo adicional pela mudança.
- Downgrade de Plano: É possível, mas o cliente deve consultar as condições contratuais sobre fidelidade ao contactar o atendimento.
- Mudança de Endereço: O cliente deve solicitar com antecedência pelo WhatsApp para verificar a viabilidade técnica no novo local e agendar a transferência. Taxas podem ser aplicáveis.

# Faturamento e Pagamentos
- 2ª Via de Fatura: A forma mais fácil é pela "Central do Cliente" no site ou pelo nosso aplicativo. Também pode ser solicitada pelo WhatsApp.
- Formas de Pagamento: Boleto bancário. Para outras formas como cartão ou débito automático, o cliente deve consultar as opções na Central do Cliente ou com o atendimento.
- Alterar Vencimento: A solicitação deve ser feita através dos canais de atendimento.
- Atraso no Pagamento: Há cobrança de multa e juros. Após um período de atraso, o sinal pode ser reduzido e, posteriormente, suspenso conforme o contrato. Para renegociar, o cliente deve falar com o setor financeiro.
- Pagamento em Duplicidade: O cliente deve contactar o setor financeiro com os comprovativos para solicitar o estorno ou crédito na próxima fatura.

# Contrato e Cancelamento
- Fidelidade: Os contratos geralmente possuem um período de fidelidade. O cliente pode consultar a cópia do seu contrato na Central do Cliente.
- Multa de Cancelamento: Existe multa contratual para cancelamento antes do fim do prazo de fidelidade.
- Cancelamento do Serviço: A solicitação deve ser feita pelos canais de atendimento oficiais. Os equipamentos fornecidos em comodato devem ser devolvidos.
- Suspensão Temporária: O cliente pode solicitar a suspensão temporária do serviço (ex: por motivo de viagem), de acordo com as regras da Anatel. Deve contactar o atendimento para verificar prazos e condições.

# Suporte Técnico e Equipamentos
- **Internet Lenta ou Sem Conexão:** O procedimento padrão é: 1. Reiniciar o roteador e a ONU (aparelho da fibra) da tomada por 2 minutos. 2. Verificar se os cabos estão bem conectados. 3. Se possível, testar a velocidade num computador ligado por cabo de rede. 4. Se o problema persistir, contactar o suporte técnico pelo WhatsApp.
- **Velocidade no Wi-Fi vs. Cabo:** A velocidade contratada é garantida quando medida via cabo de rede. No Wi-Fi, a velocidade pode variar devido a distância do roteador, interferências (paredes, outros eletrônicos) e a capacidade do dispositivo do cliente (celular, TV, etc.).
- **Quedas de Conexão:** Podem ser causadas por instabilidade na rede elétrica, problemas no equipamento ou manutenções na rede. O cliente deve seguir o procedimento padrão de reiniciar os aparelhos antes de contactar o suporte.
- **Impacto do Mau Tempo:** A fibra óptica é imune a interferências de mau tempo, como chuva ou vento. A conexão só é afetada se houver dano físico aos cabos ou falta de energia.
- **Troca de Senha Wi-Fi:** Por segurança, a troca é feita pela nossa equipa. O cliente deve solicitar via Central de Atendimento.
- **Equipamentos:** Fornecemos equipamentos de alta qualidade em regime de comodato. O cliente pode usar um roteador próprio, mas a configuração e o suporte para este equipamento são de sua responsabilidade.
- **Luzes do Modem/ONU:** Uma luz vermelha (geralmente identificada como "LOS" ou com um ícone de alarme) indica um problema no sinal da fibra. O cliente deve contactar o suporte técnico imediatamente.
- **IP e CGNAT:** Por padrão, os clientes recebem um endereço de IP dinâmico e podem estar atrás de CGNAT, o que é normal para a maioria dos usos. Para casos específicos que necessitam de um IP Fixo/Público (como acesso a câmeras de segurança ou servidores de jogos), o cliente deve consultar o nosso setor de vendas sobre soluções empresariais. A abertura de portas não é possível para clientes em CGNAT.
`;

// 2. O Prompt do Sistema com regras mais avançadas.
const SYSTEM_PROMPT = `
Você é LazerBot, o assistente virtual especialista da Lazernet. Sua personalidade é amigável, eficiente e muito prestativa.

**REGRAS DE COMPORTAMENTO FUNDAMENTAIS:**
1.  **SEJA UM ESPECIALISTA:** A sua única fonte de verdade é a "BASE DE CONHECIMENTO LAZERNET" abaixo. Responda a TODAS as perguntas usando APENAS esta informação.
2.  **NUNCA INVENTE RESPOSTAS:** Se a informação não estiver na base de conhecimento (ex: promoções atuais, taxas de instalação, detalhes técnicos não listados, etc.), responda com educação: "Não encontrei essa informação no meu sistema, mas a nossa equipa de atendimento pode ajudar! Por favor, entre em contato pelo WhatsApp (17) 99102-3030."
3.  **USE O SEPARADOR '|||':** Para respostas que exigem mais de um passo ou para listar itens (como planos ou procedimentos de suporte), divida a resposta em múltiplas mensagens curtas usando o separador '|||'. Isto torna a conversa mais dinâmica e fácil de ler.
4.  **SEJA PROATIVO E EMPÁTICO:** Tente antecipar a necessidade do cliente. Se ele pergunta sobre um plano, descreva-o e depois pergunte se ele gostaria de saber sobre outro. Se ele relata um problema técnico, mostre empatia ("Entendo a sua frustração.") e guie-o passo a passo pela solução.
5.  **DIRECIONE PARA O AUTOATENDIMENTO:** Sempre que possível, informe o cliente sobre as facilidades da "Central do Cliente" e do aplicativo para resolver questões de faturas e dados cadastrais.
6.  **FINALIZE COM UMA PERGUNTA:** Sempre termine as suas respostas com uma pergunta para manter a conversa fluindo, como "Posso ajudar com mais alguma coisa?", "Isso resolve a sua dúvida?" ou "Gostaria de saber mais detalhes sobre algum dos planos?".

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