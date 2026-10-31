# SRS – Sistema de gestión de clientes e historiales para veterinaria

Especificación de requisitos de software · Versión 0.1 (borrador) · 30 de octubre de 2026

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de una aplicación web para que veterinarios independientes gestionen sus clientes, los pacientes de cada cliente y el historial de atenciones, incluyendo cobros y recordatorios automáticos de vacunación por email.

### 1.2 Alcance

El sistema permite:

- Registrar clientes y, para cada uno, sus pacientes (perros y gatos).
- Registrar atenciones de tipo vacuna, ecografía y atención clínica, combinables en una misma atención.
- Seleccionar las vacunas aplicadas desde un catálogo global.
- Adjuntar imágenes y PDF a las atenciones (por ejemplo, ecografías y estudios).
- Registrar el monto cobrado y el monto adeudado de cada atención, y ver la deuda total de cada cliente.
- Enviar automáticamente un email de recordatorio al cliente un año después de cada vacuna aplicada.

El sistema es multiusuario: cada veterinario trabaja únicamente con sus propios clientes e historiales, sin acceso a los de otros usuarios.

### 1.3 Definiciones

- **Administrador:** persona que crea y gestiona usuarios y el catálogo de vacunas.
- **Veterinario (usuario):** profesional que usa el sistema para sus propios clientes.
- **Cliente:** dueño del animal.
- **Paciente:** perro o gato asociado a un cliente.
- **Atención:** visita registrada de un paciente, con uno o más tipos (vacuna, ecografía, atención).
- **Recordatorio:** email programado a un año de la aplicación de una vacuna.

## 2. Descripción general

### 2.1 Roles

- **Administrador:** crea, edita y desactiva usuarios; administra el catálogo global de vacunas. No existe registro público. El administrador también puede trabajar como veterinario con sus propios datos, pero no puede ver los datos clínicos de otros usuarios.
- **Veterinario:** gestiona clientes, pacientes, atenciones, cobros y recordatorios propios.

### 2.2 Restricciones tecnológicas

- Backend en PHP con Symfony (versión LTS vigente), con API REST y persistencia mediante Doctrine ORM.
- Frontend en React como aplicación de una sola página, consumiendo la API.
- Base de datos relacional (MySQL/MariaDB o PostgreSQL).
- Envío de email mediante Symfony Mailer y una tarea programada diaria.

### 2.3 Supuestos y dependencias

- Los clientes tienen email para recibir recordatorios; si no lo tienen, el recordatorio no se programa.
- El plazo del recordatorio es fijo: un año desde la fecha de aplicación de la vacuna.
- Se requiere un servicio de envío de email confiable y un dominio propio (ver sección 7).
- El idioma de la interfaz y de los emails es español (Argentina) y la zona horaria es America/Argentina/Buenos\_Aires.

## 3. Requisitos funcionales

### 3.1 Autenticación y usuarios

- **RF-01:** El sistema debe requerir inicio de sesión con email y contraseña para acceder a cualquier función.
- **RF-02:** El administrador debe poder crear, editar, desactivar y restablecer la contraseña de usuarios. No hay registro público.
- **RF-03:** Cada usuario debe poder cambiar su propia contraseña.
- **RF-04:** Todo dato de negocio (clientes, pacientes, atenciones, adjuntos, recordatorios) pertenece a un usuario y solo es accesible por él. Este control debe aplicarse en el backend en todas las consultas y operaciones.

### 3.2 Clientes

- **RF-05:** El usuario debe poder crear, ver, editar y eliminar clientes.
- **RF-06:** Datos del cliente: nombre, apellido, teléfono, email, dirección (opcional) y notas (opcional). Nombre, apellido y teléfono son obligatorios; el email es obligatorio para recibir recordatorios, y el sistema debe advertir si falta.
- **RF-07:** El usuario debe poder buscar clientes por nombre, apellido, teléfono o email, con listado paginado.
- **RF-08:** La ficha del cliente debe mostrar sus pacientes, su historial de atenciones y su deuda total.
- **RF-09:** No se podrá eliminar definitivamente un cliente con pacientes o atenciones; se aplicará borrado lógico (archivado).

### 3.3 Pacientes

- **RF-10:** El usuario debe poder crear, ver, editar y archivar pacientes asociados a un cliente. Un cliente puede tener varios pacientes.
- **RF-11:** Datos del paciente: nombre, especie (perro o gato), raza, sexo, fecha de nacimiento (o edad aproximada) y castrado/a (sí/no).
- **RF-12:** La ficha del paciente debe mostrar su historial cronológico de atenciones y las vacunas aplicadas.

### 3.4 Atenciones

- **RF-13:** El usuario debe poder registrar una atención para un paciente indicando: fecha y hora, uno o más tipos (vacuna, ecografía, atención), motivo, observaciones (diagnóstico y tratamiento en texto libre), monto cobrado y monto adeudado.
- **RF-14:** Una atención debe tener al menos un tipo, y los tipos pueden combinarse (por ejemplo, vacuna + atención).
- **RF-15:** Si la atención incluye el tipo vacuna, debe registrarse al menos una vacuna del catálogo.
- **RF-16:** Si la atención incluye el tipo ecografía, el usuario podrá cargar un informe en texto y adjuntar archivos.
- **RF-17:** El usuario debe poder editar y eliminar atenciones propias. Eliminar una atención debe cancelar los recordatorios pendientes asociados.

### 3.5 Catálogo de vacunas

- **RF-18:** Existe un único catálogo global de vacunas, administrado solo por el administrador y utilizado por todos los usuarios.
- **RF-19:** Cada vacuna tiene nombre, especie aplicable (perro, gato o ambas) y estado (activa/inactiva).
- **RF-20:** Una vacuna usada en alguna atención no puede eliminarse; solo desactivarse. Las vacunas inactivas no aparecen para nuevas atenciones pero se conservan en los historiales.
- **RF-21:** Al registrar una vacuna en una atención se guarda la fecha de aplicación (por defecto, la de la atención) y, opcionalmente, número de lote y observaciones.

### 3.6 Archivos adjuntos

- **RF-22:** El usuario podrá adjuntar a una atención archivos de imagen (JPG, PNG) y PDF.
- **RF-23:** Tamaño máximo por archivo: 10 MB, con un máximo de 10 archivos por atención (valores ajustables).
- **RF-24:** Los archivos solo pueden descargarse o visualizarse por el usuario propietario, con sesión activa.
- **RF-25:** El usuario podrá previsualizar imágenes y PDF, y eliminar adjuntos.

### 3.7 Cobros y deudas

- **RF-26:** En cada atención, el usuario ingresa manualmente el monto cobrado y, si corresponde, el monto adeudado. Ambos montos deben ser no negativos. Los importes pueden variar por atención; el sistema no define ni aplica precios para vacunas, ecografías u otros tipos de atención.
- **RF-27:** El sistema debe mostrar la deuda total de cada cliente como la suma de los montos adeudados de sus atenciones.
- **RF-28:** El usuario debe poder listar los clientes con deuda pendiente, ordenados por monto.
- **RF-29:** Cuando un cliente paga una deuda después de la atención, el usuario actualiza manualmente los montos cobrados y adeudados de esa atención. No se registra un historial separado de pagos.

### 3.8 Recordatorios de vacunación por email

- **RF-30:** Por cada vacuna aplicada, el sistema debe crear un recordatorio con fecha de envío igual a la fecha de aplicación más un año.
- **RF-31:** Una tarea programada diaria debe enviar por email los recordatorios cuya fecha sea hoy o anterior y que estén pendientes.
- **RF-32:** El email debe usar una plantilla común e incluir el nombre del cliente, el nombre del paciente, la vacuna, la fecha de aplicación y los datos de contacto del veterinario. El texto no se personaliza por veterinario.
- **RF-33:** Cada recordatorio tiene estado: pendiente, enviado, error o cancelado. Ante un error de envío se reintentará hasta 3 veces en días consecutivos antes de marcarlo como error.
- **RF-34:** Un recordatorio nunca debe enviarse más de una vez.
- **RF-35:** Si se edita la fecha o la vacuna de una atención, o se elimina la atención, los recordatorios pendientes deben recalcularse o cancelarse.
- **RF-36:** Si el cliente no tiene email, no se crea el recordatorio y la interfaz lo indica. Si se agrega el email después, el usuario podrá generar los recordatorios faltantes.
- **RF-37:** El usuario debe poder ver los recordatorios próximos, enviados y con error, y cancelar un recordatorio pendiente.
- **RF-38:** El usuario debe poder registrar que un cliente no desea recibir recordatorios por email. La preferencia se conserva aunque cambie la dirección de email del cliente.
- **RF-39:** Al registrar la baja de un cliente, el sistema debe cancelar sus recordatorios pendientes y no crear nuevos mientras la baja siga vigente. El usuario podrá retirar la baja si el cliente cambia de decisión.
- **RF-40:** El usuario debe poder marcar un paciente como fallecido. El sistema debe cancelar sus recordatorios pendientes y no crear nuevos mientras el paciente figure como fallecido. Si el estado se corrige, los recordatorios podrán volver a generarse.

### 3.9 Exportación de historiales

- **RF-41:** El usuario debe poder exportar el historial de un paciente en PDF para entregarlo al cliente. El documento incluye un resumen clínico, las vacunas y los informes de las atenciones; no incorpora los archivos adjuntos originales.

## 4. Modelo de datos conceptual

- **Usuario:** id, email, contraseña (hash), nombre, rol (administrador/veterinario), activo.
- **Cliente:** id, usuario (propietario), nombre, apellido, teléfono, email, dirección, notas, archivado.
- **Paciente:** id, cliente, nombre, especie, raza, sexo, fecha de nacimiento, castrado, archivado, fallecido.
- **Atención:** id, paciente, fecha y hora, tipos (vacuna, ecografía, atención), motivo, observaciones, informe de ecografía, monto cobrado, monto adeudado.
- **Vacuna (catálogo):** id, nombre, especie aplicable, activa.
- **AplicaciónDeVacuna:** id, atención, vacuna, fecha de aplicación, lote, observaciones.
- **Adjunto:** id, atención, nombre original, ruta de almacenamiento, tipo MIME, tamaño.
- **Recordatorio:** id, aplicación de vacuna, fecha de envío, estado, intentos, fecha de último envío, error.

El cliente conserva una preferencia de baja de recordatorios por email, independiente de su dirección de email actual. La preferencia de baja y el estado de fallecido del paciente impiden tanto la creación como la generación manual de recordatorios faltantes.

Relaciones: Usuario 1–N Cliente 1–N Paciente 1–N Atención 1–N AplicaciónDeVacuna y Adjunto. AplicaciónDeVacuna 1–1 Recordatorio.

## 5. Requisitos no funcionales

### 5.1 Seguridad y privacidad

- **RNF-01:** Todo el tráfico debe ir por HTTPS.
- **RNF-02:** Las contraseñas se almacenan con el hash de contraseñas de Symfony; se aplican protección contra fuerza bruta (límite de intentos) y protección CSRF o equivalente según el mecanismo de sesión elegido.
- **RNF-03:** El aislamiento de datos entre usuarios debe estar cubierto por pruebas automatizadas.
- **RNF-04:** Los adjuntos se guardan fuera del directorio público y se validan por tipo real de archivo (no solo por extensión).
- **RNF-05:** El sistema almacena datos personales de clientes, por lo que debe contemplar la Ley 25.326 de Protección de Datos Personales (Argentina). Se recomienda consultar a un profesional sobre consentimiento y política de privacidad.
- **RNF-06:** Los emails de recordatorio deben incluir una forma de pedir la baja (por ejemplo, responder al email de contacto del veterinario).

### 5.2 Usabilidad

- **RNF-07:** La interfaz debe ser responsiva y usable desde celular y computadora.
- **RNF-08:** Registrar una atención común debe poder hacerse en pocos pasos, sin salir de la ficha del paciente.

### 5.3 Rendimiento y disponibilidad

- **RNF-09:** Los listados deben estar paginados. El backend debe construirse teniendo como referencia búsquedas que respondan en menos de 2 segundos con hasta 1.000 pacientes por veterinario. Esta referencia guía el diseño y no constituye un límite de uso del sistema.
- **RNF-10:** Disponibilidad esperada de mejor esfuerzo; no se requiere alta disponibilidad.

### 5.4 Respaldo y mantenibilidad

- **RNF-11:** Copias de seguridad diarias de la base de datos y de los adjuntos, con una copia fuera del servidor y restauración probada.
- **RNF-12:** Todos los registros guardan fecha de creación y de última modificación.
- **RNF-13:** El código debe incluir pruebas automatizadas para reglas de negocio críticas (recordatorios, cobros, aislamiento de datos).

## 6. Fuera de alcance (versión 1)

- Envío de recordatorios por WhatsApp (se podría incorporar en una versión futura).
- Facturación electrónica y medios de pago.
- Agenda de turnos, stock o inventario.
- Otras especies además de perros y gatos.
- Registro histórico del peso del paciente.
- Portal de acceso para los clientes.
- Recordatorios con plazos distintos a un año.
- Importación inicial de datos desde planillas o fichas en papel.

## 7. Recomendación de hosting

Recomendación no vinculante, a validar al momento de contratar.

- **Servidor:** un VPS pequeño (2 GB de RAM, 1 a 2 vCPU, al menos 40 GB de disco) con Ubuntu LTS, Nginx, PHP-FPM, MySQL/MariaDB o PostgreSQL y certificado gratuito de Let’s Encrypt. Proveedores habituales: Hetzner, DigitalOcean, Vultr; compará precios y ubicación al contratar.
- **Despliegue:** Symfony y la compilación estática de React servidos desde el mismo dominio, lo que evita problemas de CORS y simplifica la autenticación. El cron del servidor ejecuta el comando diario de recordatorios.
- **Email:** usar un servicio transaccional (Brevo, Amazon SES, Mailgun o Postmark) con SPF, DKIM y DMARC configurados en un dominio propio. No conviene enviar desde una cuenta personal de Gmail por límites y riesgo de caer en spam.
- **Respaldos:** volcado diario de la base y copia de los adjuntos en almacenamiento de objetos externo al servidor.
- **Alternativa:** un hosting compartido solo sirve si ofrece PHP 8.2 o superior, Composer, acceso SSH y cron.

