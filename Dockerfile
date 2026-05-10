FROM node:20-slim

# Set environment variable to avoid interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies (cached)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libsqlite3-dev \
    curl \
    redis-server \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies (cached)
RUN pip3 install --break-system-packages -U yt-dlp chromadb

WORKDIR /app

# --- Dependency Cache Layers ---
# Copy package files first to cache npm install layers
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# --- Source Code Layer ---
COPY . .

# --- Build Frontend ---
WORKDIR /app/frontend
RUN npm run build
RUN mkdir -p /app/backend/public && cp -r dist/* /app/backend/public/

# Clean up frontend source
WORKDIR /app
RUN rm -rf /app/frontend

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860
ENV REDIS_URL=redis://localhost:6379
ENV CHROMA_URL=http://localhost:8000

# Expose port
EXPOSE 7860

# Command to run supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
