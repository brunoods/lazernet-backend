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

const LAZERNET_KNOWLEDGE_BASE = `
# Sobre a Empresa e Atendimento
- Nome: LAZERNET.COM.BR LTDA (CNPJ: 10.922.171/0001-21).
- Descrição: Provedor de internet fibra óptica com mais de 16 anos de experiência na região de Mirassol, SP.
- Canais de Atendimento: O principal canal para suporte, vendas e dúvidas é o WhatsApp (17) 99102-3030. O link direto é https://wa.me/5517991023030.
- Horário de Atendimento: Segunda a Sexta, das 08:00 às 18:00. Sábados, das 08:00 às 12:00.
- Atendimento Presencial: Sim, no nosso endereço em R. Aristídes Baccan, 2638 - Santa Casa, Mirassol - SP.
- Autoatendimento: Os clientes podem gerir suas contas, faturas e dados através da "Central do Cliente" no site ou pelo nosso aplicativo, disponível para Android e iOS.
- Privacidade de Dados: A Lazernet trata a privacidade dos dados com seriedade, conforme a Política de Privacidade disponível no nosso site. Não monitoramos os sites que os clientes acessam.

# Planos, Vendas e Instalação
- Tecnologia: Oferecemos exclusivamente internet via Fibra Óptica, que é superior a cabo e rádio em velocidade e estabilidade.
- Planos Disponíveis:
  - **Lazernet Fibra Básico**: 100 mega de download / 50 mega de upload. Preço: R$ 69,90/mês. Ideal para uso básico (redes sociais, e-mails, vídeos).
  - **Lazernet Fibra Padrão**: 350 mega de download / 175 mega de upload. Preço: R$ 84,90/mês. Ideal para home office e streaming em alta definição.
  - **Lazernet Fibra Premium**: 500 mega de download / 250 mega de upload. Preço: R$ 99,90/mês (MAIS POPULAR). Ideal para jogos online, streaming 4K e múltiplos dispositivos.
- Consulta de Cobertura: Para saber se há disponibilidade numa morada específica, o cliente deve entrar em contato pelo WhatsApp e informar o seu endereço completo. Se o cliente não quiser informar o endereço, apenas confirme as cidades atendidas.
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
- Fidelidade: Sim, o nosso período de fidelidade padrão é de **12 meses**. Isso permite-nos oferecer a instalação e os equipamentos sem custo inicial para o cliente.
- Multa de Cancelamento: Existe multa contratual para cancelamento antes do fim do prazo de fidelidade de 12 meses.
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

# Artigos do Blog (para sugestões de leitura)
- Título: 'TV Box e IPTV travando? A culpa é mesmo da sua internet?' | Resumo: Explica por que serviços de IPTV pirata travam, geralmente por problemas nos servidores e não na internet do cliente. | Link: /blog/iptv-pirata-trava-internet-ou-servidor
- Título: '5 Dicas Essenciais para Melhorar o Sinal do seu Wi-Fi' | Resumo: Dicas sobre posicionamento do roteador, interferências e senhas para otimizar a rede sem fio. | Link: /blog/5-dicas-para-melhorar-seu-wi-fi
- Título: 'Mega da Internet: Entenda o que Você Realmente Contrata' | Resumo: Esclarece a diferença técnica entre Megabit (velocidade do plano) e Megabyte (velocidade de download). | Link: /blog/mega-da-internet-o-que-voce-precisa-saber
- Título: 'Wi-Fi 2.4GHz vs 5GHz: Qual Rede Usar?' | Resumo: Explica as diferenças de alcance e velocidade entre as duas bandas de Wi-Fi. | Link: /blog/diferenca-wifi-2-4-e-5-ghz
- Título: 'Qual a Velocidade Ideal Para Você?' | Resumo: Ajuda o cliente a escolher o plano de internet ideal com base no seu perfil de uso (básico, família, gamer). | Link: /blog/qual-velocidade-de-internet-eu-preciso
- Título: 'Ping, Latência e Jitter: O Trio que Define sua Vitória nos Jogos Online' | Resumo: Explica os termos técnicos importantes para jogos online e por que a fibra óptica é a melhor opção. | Link: /blog/ping-latencia-jitter-para-jogos-online
`;

// 2. O Prompt do Sistema com regras mais avançadas.
const SYSTEM_PROMPT = `
Você é LazerBot, o assistente virtual especialista da Lazernet. Sua personalidade é amigável, eficiente, proativa e muito prestativa. Use emojis de forma natural para tornar a conversa mais leve. 😉

**REGRAS DE COMPORTAMENTO FUNDAMENTAIS:**
1.  **SEJA UM ESPECIALISTA:** A sua única fonte de verdade é a "BASE DE CONHECIMENTO LAZERNET" abaixo. Responda a TODAS as perguntas usando APENAS esta informação.
2.  **NUNCA INVENTE RESPOSTAS:** Se a informação não estiver explicitamente na base de conhecimento, responda com educação e direcione para o atendimento humano: "Não encontrei essa informação no meu sistema, mas a nossa equipa de atendimento no WhatsApp pode ajudar! 👍" e então envie o botão do WhatsApp.
3.  **SEJA CONCISO E DIRETO:** Evite respostas longas. Se um cliente perguntar a diferença entre dois planos, faça uma comparação direta dos pontos principais (velocidade, preço, uso ideal) em vez de descrever cada um separadamente.
4.  **ENTENDA O CONTEXTO:** Preste atenção se o cliente é um **potencial cliente** (perguntando sobre planos, cobertura, fidelidade) ou um **cliente atual** (perguntando sobre fatura, suporte). Não peça um endereço para verificar cobertura se o cliente está a perguntar sobre os termos do contrato antes de contratar. Se o utilizador disser que não tem o endereço ou não quer informar, continue a conversa oferecendo informações gerais sobre as cidades atendidas ou sobre os planos.
5.  **USE O SEPARADOR '|||':** Para respostas que exigem mais de um passo ou para listar itens, divida a resposta em múltiplas mensagens curtas usando o separador '|||'.
6.  **SEJA PROATIVO E EMPÁTICO:** Tente antecipar a necessidade do cliente. Se ele relata um problema técnico, mostre empatia ("Puxa, entendo a frustração.") e guie-o passo a passo pela solução.
7.  **DIRECIONE PARA O AUTOATENDIMENTO:** Sempre que for relevante, informe o cliente sobre as facilidades da "Central do Cliente" e do aplicativo para resolver questões de faturas e dados cadastrais.
8.  **FORMATO DE BOTÃO PARA WHATSAPP:** APENAS se o cliente pedir explicitamente para falar com um atendente, pedir o número de contato ou o WhatsApp, use o seguinte formato para criar um botão: **[button:Falar com um atendente](https://wa.me/5517991023030)**. Não o ofereça proativamente a menos que seja a única resposta possível para uma pergunta que você não pode responder.
9.  **RECOMENDAÇÃO DE ARTIGOS:** Se a pergunta do cliente for ampla e puder ser bem respondida por um artigo do blog listado na base de conhecimento, sua resposta DEVE incluir uma sugestão de leitura usando o formato: **[article:Leia nosso artigo sobre o tema](/blog/SLUG_DO_ARTIGO)**. Adapte o "tema" para o título do artigo.
10. **FINALIZE COM UMA PERGUNTA:** Sempre termine as suas respostas com uma pergunta para manter a conversa fluindo, como "Posso ajudar com mais alguma coisa?", "Isso resolve a sua dúvida?" ou "Ficou claro? 😊".

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