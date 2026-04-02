# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build args for environment variables
ARG VITE_API_URL
ARG VITE_PUSHER_KEY
ARG VITE_PUSHER_CLUSTER
ARG VITE_MAPTILER_KEY
ARG VITE_ORS_API_KEY
ARG VITE_ORS_API_KEY_2

# Create .env file with build args
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_PUSHER_KEY=${VITE_PUSHER_KEY}" >> .env && \
    echo "VITE_PUSHER_CLUSTER=${VITE_PUSHER_CLUSTER}" >> .env && \
    echo "VITE_MAPTILER_KEY=${VITE_MAPTILER_KEY}" >> .env && \
    echo "VITE_ORS_API_KEY=${VITE_ORS_API_KEY}" >> .env && \
    echo "VITE_ORS_API_KEY_2=${VITE_ORS_API_KEY_2}" >> .env

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
