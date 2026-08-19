# VideoGrabTool — Docker image with yt-dlp + ffmpeg for Render/Railway
FROM node:20-slim

# Install python3 (for yt-dlp), ffmpeg (audio/video merging), curl
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ffmpeg curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages yt-dlp || pip3 install yt-dlp

# Install pnpm
RUN npm install -g pnpm@10.33.4

WORKDIR /app

# Install dependencies (leveraging layer cache)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source and build
COPY . .
RUN touch .env && pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

# Render/Railway injects $PORT
CMD ["pnpm", "start"]
