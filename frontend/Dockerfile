# ── Build Stage ────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://127.0.0.1:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Production Stage ──────────────────────────────────
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
