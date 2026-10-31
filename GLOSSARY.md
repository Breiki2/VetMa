# Gestión veterinaria

Este contexto modela la gestión de clientes, pacientes, atenciones clínicas y recordatorios de vacunación para veterinarios independientes.

## Lenguaje

**Atención**:
Visita profesional registrada para un paciente, con sus observaciones clínicas y los tipos de servicio realizados.
_Evitar_: Consulta, turno (un turno es una cita futura, fuera del alcance actual).

**Aplicación de vacuna**:
Registro de una vacuna específica administrada a un paciente durante una atención.
_Evitar_: Vacunación (puede referirse al proceso general o al conjunto de vacunas).

**Cliente**:
Persona responsable del paciente y contacto para las comunicaciones del veterinario.
_Evitar_: Usuario (es el veterinario que accede al sistema).

**Paciente**:
Perro o gato que recibe atención veterinaria y pertenece a un cliente.
_Evitar_: Mascota (término coloquial que no distingue el concepto del sistema).

**Veterinario**:
Profesional que usa el sistema y administra sus propios clientes, pacientes y atenciones.
_Evitar_: Cliente, usuario final.

**Monto cobrado**:
Importe que el veterinario registra manualmente como cobrado por una atención.
_Evitar_: Precio de catálogo (el sistema no define precios por servicio o vacuna).

**Monto adeudado**:
Importe que el veterinario registra manualmente como pendiente de pago por una atención.
_Evitar_: Saldo calculado (no se deriva de un historial de pagos).

**Recordatorio de vacunación**:
Email previsto para informar al cliente que corresponde volver a aplicar una vacuna.
_Evitar_: Notificación (demasiado general para este concepto).

**Baja de recordatorios**:
Preferencia del cliente de no recibir emails de recordatorio de vacunación.
_Evitar_: Baja de email (puede confundirse con dar de baja una dirección de correo).
