# Agenda Belleza · SaaS multi-centro

Next.js 15 (App Router) + Supabase + Tailwind 4, listo para Vercel.

Cada centro tiene su sitio público en `/c/<url>` (servicios, equipo, reservas) y un panel en `/admin`.

> **Estado:** el código está completo pero **no se ha compilado ni ejecutado todavía**: el entorno donde se escribió no podía instalar paquetes de npm. Lo único probado es la lógica de cálculo de horarios (con librerías de fechas sustituidas por un reemplazo simple). Lo primero que debes hacer es `npm install && npm run build` y corregir lo que aparezca.

## Puesta en marcha

1. **Supabase**: crea un proyecto → *SQL Editor* → pega y ejecuta `supabase/schema.sql` y luego, en orden, `supabase/migrations/002_media.sql` (columnas de logo/portada y almacenamiento de imágenes) y `supabase/migrations/003_gallery.sql` (galería de trabajos). Las migraciones son seguras de ejecutar más de una vez.
2. En *Authentication → Providers* deja Email activo. Para probar rápido, desactiva "Confirm email".
3. Copia `.env.example` a `.env.local` y completa las tres claves (*Project Settings → API*).
4. ```bash
   npm install
   npm run build   # primera verificación
   npm run dev
   ```
5. Abre `/login` → crea cuenta → crea tu centro → agrega servicios → agrega un profesional, márcale servicios y revisa su horario → visita `/c/<tu-url>`.

## Despliegue en Vercel

1. Sube el proyecto a GitHub e impórtalo en Vercel (detecta Next.js solo).
2. Agrega las variables de `.env.example` en *Settings → Environment Variables*. `NEXT_PUBLIC_APP_URL` debe ser tu dominio final.
3. En Supabase, *Authentication → URL Configuration*: agrega tu dominio de Vercel como Site URL y Redirect URL.

## Cómo está resuelto lo difícil

| Problema | Solución |
|---|---|
| Datos aislados por centro | `center_id` en todas las tablas + RLS (`owns_center`). Las citas y datos de clientes nunca son públicos. |
| Doble reserva | Restricción `EXCLUDE USING gist` en `appointments`: la propia base rechaza solapes aunque dos personas reserven al mismo tiempo. |
| Disponibilidad pública sin filtrar datos | La función SQL `busy_ranges` devuelve sólo rangos ocupados, sin nombres ni teléfonos. |
| Reservas sin login | Server action con service role que **recalcula** la disponibilidad en el servidor y valida el horario antes de insertar. |
| Gestionar/cancelar sin cuenta | Cada cita tiene un `manage_token` UUID en su enlace (`/c/<url>/cita/<token>`). |
| Zonas horarias | Todo se guarda en UTC; los horarios se interpretan en la zona del centro (`America/Santiago` por defecto). |

## Estructura

```
supabase/schema.sql              tablas, RLS, restricción anti doble reserva
src/lib/availability.ts          cálculo de huecos (computeSlots es pura y testeable)
src/app/actions/booking.ts       crear/cancelar reservas públicas
src/app/actions/admin.ts         CRUD del panel (con RLS)
src/app/api/availability/        endpoint de disponibilidad
src/app/c/[slug]/                landing, reservar, confirmación de cita
src/app/admin/                   panel: citas, servicios, equipo, ajustes
```

## Agente de WhatsApp (siguiente fase)

Diseño pensado para reutilizar lo que ya existe:

1. **Canal**: WhatsApp Cloud API (Meta) o un proveedor como Twilio/360dialog. Iniciar cuanto antes la verificación del negocio: es lo más lento.
2. **Webhook**: `src/app/api/whatsapp/route.ts` recibe mensajes (verificar firma `X-Hub-Signature-256`).
3. **Identificar el centro**: tabla `whatsapp_numbers (phone_number_id, center_id)`.
4. **Memoria**: tablas `conversations` y `messages` para dar contexto al modelo.
5. **Agente**: Claude con *tool use* y estas herramientas, que llaman a funciones que ya existen:
   - `listar_servicios` y `listar_profesionales` → lectura de catálogo
   - `ver_disponibilidad(servicio, fecha, profesional?)` → `getAvailableSlots`
   - `reservar(...)` → misma lógica de `createBooking`, con `source = 'whatsapp'`
   - `cancelar(...)` → por teléfono del cliente
6. **Recordatorios**: Vercel Cron + plantillas de WhatsApp aprobadas (fuera de la ventana de 24 h sólo se pueden enviar plantillas).
7. **Salvaguardas**: el agente nunca escribe en la base directamente; sólo por esas herramientas, que validan disponibilidad igual que la web. Derivar a una persona ante reclamos o dudas.

## Pendiente conocido

- Correos de confirmación y recordatorios (Resend o similar).
- Límite de intentos (rate limit) en reservas públicas; hoy sólo hay un campo trampa anti-bots.
- Reserva manual desde el panel y bloqueo de horarios (la tabla `time_off` existe, falta su pantalla).
- Cobro de suscripción a los centros (Stripe / Flow / Mercado Pago).
- Un usuario administra un solo centro.
- Dominio propio o subdominio por centro (hoy es `/c/<url>`).
