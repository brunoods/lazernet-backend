// data/planos.js

export const planosData = [
  {
    id: 1,
    slug: 'fibra-basico-100', // Identificador para o URL
    nome: "Lazernet Fibra Básico",
    velocidade: "100 mega",
    upload: "50 mega", // Nova informação
    idealPara: "Navegar, redes sociais e e-mails.", // Nova informação
    equipamento: "Roteador Wi-Fi 4 (em comodato)", // Nova informação
    originalVelocidade: null,
    preco: "R$ 69,90/mês",
    originalPreco: "R$ 79,90",
    popular: false,
    tagText: null,
    descricaoDetalhada: "O plano ideal para quem usa a internet para tarefas do dia a dia, como navegar em sites, usar redes sociais e enviar e-mails. Conexão estável para as suas necessidades essenciais."
  },
  {
    id: 2,
    slug: 'fibra-padrao-350',
    nome: "Lazernet Fibra Padrão",
    velocidade: "350 mega",
    upload: "175 mega",
    idealPara: "Streaming em Full HD, home office e aulas online.",
    equipamento: "Roteador Wi-Fi 5 (em comodato)",
    originalVelocidade: null,
    preco: "R$ 84,90/mês",
    originalPreco: "R$ 89,90",
    popular: false,
    tagText: null,
    descricaoDetalhada: "Perfeito para a família conectada. Assista aos seus filmes e séries favoritos em alta definição, participe em videochamadas sem interrupções e garanta uma conexão de qualidade para o trabalho e os estudos."
  },
  {
    id: 3,
    slug: 'fibra-premium-500',
    nome: "Lazernet Fibra Premium",
    velocidade: "500 mega",
    upload: "250 mega",
    idealPara: "Jogos online, streaming em 4K e múltiplos dispositivos.",
    equipamento: "Roteador Wi-Fi 5 de alto desempenho (em comodato)",
    originalVelocidade: null,
    preco: "R$ 99,90/mês",
    originalPreco: "R$ 109,90",
    popular: true,
    tagText: "MAIS POPULAR",
    descricaoDetalhada: "A experiência definitiva em velocidade. Ideal para gamers que precisam de baixa latência, para quem faz streaming em 4K e para casas com muitos dispositivos conectados ao mesmo tempo. Desfrute do máximo que a fibra óptica pode oferecer."
  },
];