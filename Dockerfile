FROM node:20.5-alpine

RUN apk add --no-cache --virtual .gyp python3 make g++

WORKDIR /price-tg-notifier-app

COPY package*.json ./
RUN yarn install

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=450"

CMD ["yarn", "prod"]
