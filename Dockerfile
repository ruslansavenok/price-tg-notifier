FROM node:16.17-alpine

RUN apk add --no-cache --virtual .gyp python3 make g++

WORKDIR /price-tg-notifier-app

COPY package*.json ./
RUN yarn install

COPY . .

ENV NODE_OPTIONS="--max_old_space_size=300"

CMD ["yarn", "prod"]
