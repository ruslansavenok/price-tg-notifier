FROM node:14-alpine

RUN apk add --no-cache --virtual .gyp python3 make g++

WORKDIR /price-tg-notifier-app

COPY package*.json ./
RUN yarn install

COPY . .

CMD ["yarn", "prod"]
