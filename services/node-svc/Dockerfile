FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
EXPOSE 8082
ENV PORT=8082
CMD ["npm", "run", "start"]
