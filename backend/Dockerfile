FROM node:20-alpine

# Install system dependencies for audio processing
# ffmpeg: audio extraction and conversion
# yt-dlp: YouTube audio download (installed via pip)
# python3/pip: required for yt-dlp installation
# curl: health checks
RUN apk add --no-cache ffmpeg python3 py3-pip curl \
    && pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Create directories for uploads and temp files
RUN mkdir -p uploads temp

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000
CMD ["node", "src/index.js"]
