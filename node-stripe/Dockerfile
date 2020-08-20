FROM node:10-alpine
COPY package.json .
RUN npm install --quiet
COPY . .
RUN npm install pm2 -g --no-optional
EXPOSE 4242
CMD ["pm2-runtime", "index.js"]
