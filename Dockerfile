# Usar a imagem oficial do Node.js 18 como base
FROM node:18-alpine

# Definir o diretório de trabalho dentro do contentor
WORKDIR /app

# Copiar os ficheiros de dependências
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o resto do código da sua aplicação
COPY . .

# Expor a porta que a sua aplicação vai usar (a Render define isto automaticamente, aqui nós especificamos)
EXPOSE 3001

# O comando para iniciar a sua aplicação
CMD [ "node", "index.js" ]