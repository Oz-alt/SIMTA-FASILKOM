# ============================================================
# Dockerfile Multi-stage untuk Laravel + Inertia.js (React + Vite)
# ============================================================

# --- Stage 1: Build Frontend Assets (Vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# --- Stage 2: PHP & Nginx Runtime ---
FROM php:8.3-fpm-alpine

# Install ekstensi sistem & dependensi PHP
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    postgresql-dev

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql pdo_pgsql mbstring zip bcmath opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy source code project
COPY . .

# Copy compiled frontend assets dari Stage 1
COPY --from=frontend /app/public/build ./public/build

# Install dependensi PHP Composer (Production)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permission direktori storage & bootstrap
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Konfigurasi Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Konfigurasi Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port HTTP
EXPOSE 8080

# Jalankan Nginx & PHP-FPM via Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

