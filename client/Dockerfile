FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./
COPY --from=build /app/package*.json ./

RUN npm install --production

EXPOSE 3001

CMD ["node", "server.js"] 