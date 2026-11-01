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

## Seguridad y privacidad
- No guardar ni versionar secretos, credenciales, claves privadas ni datos personales o clínicos reales. Los archivos `.env` y sus variantes se ignoran en Git, incluidas las plantillas con ese nombre; usar nombres que no comiencen con `.env` para ejemplos sanitizados.
- No incluir secretos ni datos personales o clínicos en logs, mensajes de error, capturas, documentación o respuestas. Redactarlos al inspeccionar configuración.
- Si un secreto se expone o se versiona por accidente, revocarlo o rotarlo de inmediato; quitar el archivo de Git no elimina su historial. No copiar el valor expuesto a commits ni a otros canales.
- Aplicar mínimo privilegio y acceso autenticado a datos y servicios. Mantener el aislamiento por usuario en cada consulta y endpoint.
- Proteger los respaldos y sus credenciales: cifrado, acceso limitado y almacenamiento fuera del directorio público.

## Convenciones
- Controladores finos; lógica en servicios. Validación con constraints de Symfony.
- Montos con tipo decimal, nunca float.
- Migraciones siempre versionadas; no editar migraciones ya aplicadas.
- Todo cambio de regla de negocio actualiza docs/SRS.md.

## Qué no hacer
- No agregar WhatsApp, facturación ni otras especies (fuera de alcance v1).
