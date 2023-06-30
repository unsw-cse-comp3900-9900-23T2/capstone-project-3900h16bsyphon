FROM node:lts-alpine as builder

# Set the current working directory inside the container
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2.6.2-alpine
COPY --from=builder /app/.next /.next
COPY package.json package-lock.json ./

RUN npm start
