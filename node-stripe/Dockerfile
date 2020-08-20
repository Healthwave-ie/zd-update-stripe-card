FROM node:10-alpine
COPY package.json .
RUN npm i --quiet
COPY . .
RUN npm install pm2 -g
EXPOSE 4242
CMD ["pm2-runtime", "index.js"]
