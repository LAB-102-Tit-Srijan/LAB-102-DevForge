FROM node:20-slim

# Install system dependencies
# ffmpeg: audio extraction
# python3/pip: for yt-dlp
# curl: health checks
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages -U yt-dlp

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
# Install the missing embedding dependency and the rest
RUN npm install chromadb-default-embed && npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000
CMD ["node", "src/index.js"]
