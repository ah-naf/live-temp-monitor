FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json vite.config.js ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json vite.config.js ./
RUN npm ci
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["npm", "run", "preview"]
