FROM node:18-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run copy
EXPOSE 3000
CMD ["node", "server/index.js"]
