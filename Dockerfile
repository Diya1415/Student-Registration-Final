# Used for hosting on Render: PHP + Apache image, copy our files in
FROM php:8.2-apache
COPY . /var/www/html/
EXPOSE 80
