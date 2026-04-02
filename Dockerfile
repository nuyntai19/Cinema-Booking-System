FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    pkg-config \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo_mysql curl zip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/ /app/

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
    CMD php -r "exit(@file_get_contents('http://127.0.0.1:8080/api/health') ? 0 : 1);"

# Start PHP built-in server
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app", "/app/router.php"]
