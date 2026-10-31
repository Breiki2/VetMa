# VetMa

Aplicación web para gestionar clientes, pacientes e historiales veterinarios. El backend usa Symfony 7.4 LTS y Doctrine; la interfaz usa React, TypeScript y Vite.

## Desarrollo local

Requisitos: PHP 8.2 o superior con PDO SQLite, Composer, Node.js y npm.

```sh
cd backend
composer install
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console app:admin:create
php -S 127.0.0.1:8000 -t public
```

En otra terminal:

```sh
cd frontend
npm install
npm run dev
```

Abrí la dirección que muestra Vite. El proxy local envía `/api` al backend. No existe una cuenta predeterminada: `app:admin:create` solicita email, nombre y una contraseña de al menos 12 caracteres.

## Verificación

```sh
cd backend && composer test
cd frontend && npm test && npm run build
```

El despliegue de producción, HTTPS, tareas programadas, respaldos cifrados y simulacro de restauración están documentados en [docs/production.md](docs/production.md).

La aplicación guarda cobrado y adeudado manualmente por atención. Esta versión implementa el acceso, las cuentas, los clientes, los pacientes, el catálogo de vacunas y los registros de atención. Los adjuntos, recordatorios por email y exportación PDF permanecen fuera del núcleo implementado.
