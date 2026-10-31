# Veterinaria – gestión de clientes e historiales

App web multiusuario para veterinarios independientes. Fuente de verdad de
requisitos: docs/SRS.md (consultar el RF/RNF antes de cambiar una regla).

## Stack
- Backend: Symfony (LTS) + Doctrine, API REST, en /backend
- Frontend: React + Vite + TypeScript, en /frontend
- BD: MySQL/PostgreSQL. Zona horaria: America/Argentina/Buenos_Aires
- Idioma de UI y emails: español (Argentina)

## Comandos
- Backend: composer install · php bin/console doctrine:migrations:migrate · php bin/phpunit
- Frontend: npm install · npm run dev · npm test · npm run lint
- Recordatorios: php bin/console app:send-reminders

## Reglas que no se negocian
1. Aislamiento de datos: toda entidad de negocio (Cliente, Paciente, Atención,
   Adjunto, Recordatorio) pertenece a un Usuario. Ninguna consulta ni endpoint
   puede devolver datos de otro usuario. Cada entidad nueva lleva test de aislamiento.
2. No hay registro público. Solo el administrador crea usuarios y gestiona el
   catálogo global de vacunas.
3. Recordatorio = fecha de aplicación + 1 año, solo por email, nunca se envía dos veces.
4. Borrado lógico en clientes y pacientes; vacunas usadas solo se desactivan.
5. Adjuntos fuera del directorio público, validados por MIME real, máx. 10 MB.

## Convenciones
- Controladores finos; lógica en servicios. Validación con constraints de Symfony.
- Montos con tipo decimal, nunca float.
- Migraciones siempre versionadas; no editar migraciones ya aplicadas.
- Todo cambio de regla de negocio actualiza docs/SRS.md.

## Qué no hacer
- No agregar WhatsApp, facturación ni otras especies (fuera de alcance v1).
