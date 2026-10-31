# Producción y recuperación

## Diseño

El despliegue de referencia usa un único VPS y un volumen Docker persistente para SQLite y adjuntos. Caddy termina TLS, redirige HTTP a HTTPS y renueva el certificado automáticamente. Nginx sirve la SPA y envía `/api` a PHP-FPM. Solo Caddy publica puertos en el host; PHP-FPM y Nginx quedan en la red privada de Docker. El volumen `app_data` contiene `var/data.db` y `var/attachments`.

SQLite permite usar las migraciones versionadas actuales sin una conversión de esquema. El proceso está pensado para una instancia de aplicación; no escales el servicio `app` a varias réplicas.

## Primer despliegue

1. Prepará un VPS con Docker Compose, `rclone`, `sqlite3` y `tar`. Apuntá el registro DNS del dominio a la IP del VPS y permití entrada TCP 80/443 (UDP 443 es opcional para HTTP/3).
2. Copiá `.env.prod.example` a `.env.prod`. Definí un `APP_SECRET` único (`openssl rand -hex 32`), el dominio, una identidad de envío verificada y el DSN del proveedor SMTP. Escapá los caracteres reservados de la contraseña dentro del DSN.
3. Protegé los secretos (`chmod 600 .env.prod`). Configurá un destino `rclone crypt` respaldado por un proveedor fuera del VPS. El remoto debe usar cifrado del lado del cliente y credenciales de escritura limitadas a la carpeta de backups.
4. Construí y levantá los contenedores:

   ```sh
   docker compose --env-file .env.prod -f compose.prod.yaml build
   docker compose --env-file .env.prod -f compose.prod.yaml run --rm app php bin/console doctrine:migrations:migrate --no-interaction
   docker compose --env-file .env.prod -f compose.prod.yaml up -d
   docker compose --env-file .env.prod -f compose.prod.yaml exec app php bin/console app:admin:create
   ```

   Caddy solicitará el certificado cuando el DNS ya resuelva al VPS. Verificá `https://$DOMAIN`, el login y una carga/descarga de archivo antes de usar datos reales.

## Tareas diarias

Configurá `BACKUP_REMOTE` como remoto `rclone crypt` y agregá estas entradas a cron, ajustando la ruta y horarios. El backup crea una copia SQLite consistente, incluye todos los adjuntos, transmite el archivo directamente al destino remoto cifrado y elimina la copia temporal del volumen.

```cron
15 2 * * * cd /opt/vetma && BACKUP_REMOTE='vetma-crypt:backups' ./scripts/backup-production.sh >> /var/log/vetma-backup.log 2>&1
0 8 * * * cd /opt/vetma && docker compose --env-file .env.prod -f compose.prod.yaml exec -T app php bin/console app:send-reminders >> /var/log/vetma-reminders.log 2>&1
```

El proveedor remoto debe conservar versiones suficientes para recuperarse de borrados o corrupción detectados tarde. Alertá cuando falle cron o el espacio del VPS supere el umbral operativo acordado.

## Simulacro de restauración

`scripts/restore-drill.sh` acepta una copia local o una ruta rclone, la extrae en un directorio temporal aislado y verifica integridad SQLite, claves foráneas, tablas principales y disponibilidad de adjuntos. No monta el volumen de producción ni modifica la copia origen.

Ejecutá el simulacro mensualmente y después de cambiar el formato de backup:

```sh
./scripts/restore-drill.sh 'vetma-crypt:backups/vetma-20261031T021500Z.tar.gz'
```

Para recuperar un servidor, descargá una copia verificada en un VPS limpio, extraela en una carpeta privada y detené la aplicación. Con la carpeta extraída en `./restore`, restaurá el volumen nombrado con un contenedor temporal:

```sh
docker compose --env-file .env.prod -f compose.prod.yaml stop app
docker compose --env-file .env.prod -f compose.prod.yaml run --rm --no-deps --user root \
  -v "$PWD/restore:/restore:ro" app sh -euc \
  'cp /restore/database.sqlite /app/var/data.db && rm -rf /app/var/attachments && cp -a /restore/attachments /app/var/attachments && chown -R www-data:www-data /app/var'
docker compose --env-file .env.prod -f compose.prod.yaml up -d app
```

Comprobá login, fichas, historial y descarga de adjuntos. Conservá la copia original sin modificar y registrá la fecha, el identificador del backup y el resultado del chequeo.

Se puede verificar localmente el procedimiento con datos de prueba, sin Docker ni credenciales remotas:

```sh
./scripts/test-backup-restore.sh
```

## Cambios de aplicación

Antes de desplegar cada versión, hacé un backup y ejecutá las migraciones antes de volver a recibir tráfico:

```sh
BACKUP_REMOTE='vetma-crypt:backups' ./scripts/backup-production.sh
docker compose --env-file .env.prod -f compose.prod.yaml run --rm app php bin/console doctrine:migrations:migrate --no-interaction
docker compose --env-file .env.prod -f compose.prod.yaml up -d --build
```

No guardes `.env.prod`, archivos de SQLite, adjuntos ni copias descifradas dentro del repositorio.
