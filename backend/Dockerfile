FROM composer:2 AS composer

FROM php:8.3-fpm-alpine
RUN apk add --no-cache sqlite sqlite-libs \
    && docker-php-ext-install pdo_sqlite opcache
COPY --from=composer /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .
RUN composer install --no-dev --no-interaction --no-progress --classmap-authoritative
RUN mkdir -p var/attachments \
    && chown -R www-data:www-data var \
    && chmod -R u+rwX,g+rwX var
ENV APP_ENV=prod APP_DEBUG=0
USER www-data
CMD ["php-fpm", "-F"]
