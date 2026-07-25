# WALKTHROUGH — Obvio OS v4.0

Guía paso a paso para entender el flujo completo del sistema.

---

## 1. Login

Pantalla de inicio con:
- **Logo** circular con anillo giratorio (blanco + rosa intenso)
- **Nombre del salón** (desde configuración)
- **Input PIN** de 4-6 dígitos, auto-login a los 200ms
- **3 intentos** → bloqueo de 60 segundos
- Footer: "LuckyApps by Omar Duarte"

**PIN por defecto del admin**: `020518`

---

## 2. Menú Principal (Admin Panel)

Grid de iconos para acceder a todos los módulos.
Los iconos visibles se controlan desde **Configuración → Paneles**.

---

## 3. POS / Caja

### Flujo de Venta (Ticket)
1. Seleccionar "Tickets" en el toggle superior
2. Elegir un ticket activo de la cola
3. Se carga el item correspondiente al ticket
4. Seleccionar **Estilista** (obligatorio)
5. Agregar método de pago (Efectivo/Tarjeta/Transferencia/Bitcoin)
6. Presionar **COBRAR**
7. Aparece el **modal del ticket** con opciones: Imprimir, Enviar Email, Finalizar

### Flujo de Venta (Directa)
1. Cambiar a modo "Directa"
2. Buscar o crear cliente
3. Agregar productos/servicios del catálogo
4. Seleccionar estilista
5. Pagar y cobrar

### Características del POS
- **Catálogo** con búsqueda y filtro por categorías (drag-scroll)
- **Carrito responsive**: overlay en móvil, sidebar fijo en desktop
- **Pagos divididos**: podés mezclar métodos de pago
- **Promociones activas** se aplican automáticamente
- **Puntos de lealtad**: canjeables si el cliente tiene suficientes
- **Modal de ticket responsive**: usa `clamp()` con `vmin` para adaptarse

---

## 4. Recepción

### Nuevo Turno
1. Buscar cliente existente o crear nuevo
2. Seleccionar **servicios** (toque múltiple: ej: CE + PE)
3. Presionar **Generar Turno**
4. Se imprime/muestra el ticket de turno

### Gestionar Cola
1. Ir a pestaña "Gestionar"
2. Ver tickets en espera
3. Asignar estilista y silla
4. Presionar flecha → el ticket pasa a "serving"

### Notas
- Los códigos de servicio usan las primeras **2 letras** de la categoría
- Se pueden seleccionar **múltiples servicios** (código combinado: CE+PE)
- El placeholder "Estilista..." está oculto (disabled hidden)

---

## 5. Agenda

### Layout
- **Desktop** (≥1024px): Calendario a la izquierda, lista de citas a la derecha
- **Móvil** (<1024px): Calendario arriba, lista abajo

### Flujo
1. Navegar entre meses con flechas \< \>
2. Seleccionar un día → se muestran las citas
3. Presionar **Agendar** → modal con formulario
4. Para **atender** una cita: presionar "Llegó" → genera ticket automático
5. Citas completadas se marcan en verde
6. Las citas pendientes muestran punto en el calendario

### Modal de Cita
- Cliente: búsqueda con sugerencias
- Servicio: chips con las mismas categorías del catálogo (dinámicos)
- Estilista: selector
- Fecha, hora, teléfono, notas

---

## 5b. Recordatorio Automático de Citas

Aparece un **modal persistente** 30 minutos antes de cada cita con:
- Nombre del cliente, hora y servicio
- Botón **"Recordar en 5 min"** → silencia y reaparece a los 5 minutos
- Botón **"Confirmado"** → no vuelve a salir (persiste en el dispositivo)
- **Voz** (SpeechSynthesis) dice: "Cliente X, servicio Y, a las Z"
- **Telegram**: si configuraste Token del Bot y los empleados tienen Telegram ID, envía notificación automática al estilista asignado

---

## 6. Plan Mensual & Proyección (ReportingDashboard)

### Concepto
Cada sucursal puede tener un **plan mensual** con:
- **Meta de venta bruta** ($)
- **Días laborales** declarados (ej: 26)
- **Porcentaje de retail** (ej: 10%)

### Cómo se guarda
Desde **Sucursales → Plan Mensual**, seleccionás sucursal + mes + año y completás los datos. Si ya existe un plan para esa combinación, se precarga automáticamente.

### Cómo se calcula la proyección
El `ReportingDashboard` calcula:
```
días_con_ventas = días únicos con al menos una venta en el mes
proyección = (ventas_reales / días_con_ventas) × días_laborales_totales
```

Esto es más preciso que una estimación calendario porque:
- Si un lunes fue feriado y no hubo ventas, **no cuenta**
- Si el salón cerró un día, **no afecta el promedio**
- Usa los días laborales que declaraste (26), no los días del calendario

### Visualización
- Barra azul = % real de la meta alcanzado
- Barra púrpura (transparente) = % proyectado al cierre
- Barra ámbar delgada = % de meta de retail
- Se muestra "X/26 días con ventas" en cada sucursal

---

## 7. Configuración

### General
- Nombre comercial, logo (subida o URL), pie de ticket
- Tamaño de papel térmico (58mm / 80mm)
- Webhook GAS para envío de tickets por email
- **Telegram Bot Token**: pega el token de tu bot de @BotFather para activar notificaciones

### Cartelera TV
- Gestión de playlist de videos
- Vista previa y velocidad del ticker

### Paneles
- Toggle para ocultar/mostrar cada módulo
- Se aplica al menú de inicio y a la barra lateral
- Persistente en DB (hidden_panels)

### Zona Danger
- **Backup DB**: descarga el archivo salon.db con checkpoint previo
- **Limpieza por período**: seleccionar tabla (ventas, tickets, citas, etc.) y rango de fechas
- Emite `sync_needed` para refrescar datos automáticamente

### Telegram (Notificaciones)
1. Habla con **@BotFather** en Telegram y crea un bot con `/newbot`
2. Copia el **token** que te da (ej: `123456:ABCdef...`)
3. Pégalo en **Configuración General → Telegram Bot Token**
4. En **Usuarios/Staff**, asigna el **Telegram ID** de cada empleado (su @username o ID numérico)
5. Cuando se active el recordatorio de cita, el estilista recibirá el mensaje automáticamente

---

## 7. Historial de Ventas

- Filtro por fechas y búsqueda por cliente/folio
- Cards de resumen (ventas período + operaciones)
- Tabla responsive con scroll horizontal en móvil
- Modal de detalle con reimpresión y envío de email

---

## 8. Sidebar (Barra Lateral)

- **Oculta por defecto** en todos los tamaños de pantalla
- Se abre al tocar el **menú hamburguesa** (3 líneas en el header)
- Fondo oscuro al abrirse, se cierra al tocar fuera
- **Logo sticky** arriba (no se mueve al scrollear)
- **Items del menú** scrollean independientemente
- **Usuario + Cerrar sesión sticky** abajo
- Header con botón de **Inicio** al lado de **Salir**
- Muestra siempre **icono + texto completo**

---

## 9. Responsive Design

### Estrategia
- Uso intensivo de `clamp(min, vmin, max)` para escalar proporcional
- Breakpoints: `sm: 640px | md: 768px | lg: 1024px | xl: 1280px`
- `vmin` = el menor entre ancho y alto del viewport

### Componentes Responsive
- **Login**: card centrada, logo circular escalable
- **POS**: catálogo con grid responsive (2→3→5→6 cols), carrito overlay
- **Recepción**: chips de servicios en grid de 3 columnas
- **Agenda**: calendario + lista, cambia de layout en lg
- **Ventas**: tabla con scroll horizontal, header fijo, columnas se ocultan
- **Settings**: tabs con chips, grid responsive
- **Sidebar**: overlay móvil, sticky desktop
- **Inventario**: tabla principal + detalle lateral, modales ERP responsivos con clamp
- **Promociones**: grid de promos 1→2→3 cols, sección Lealtad responsive con clamp
- **Sucursales**: panel formulario + network deck, scroll interno en form
- **Catálogo**: DetailPanel compacto con clamp reducido

---

## 10. Base de Datos

### Archivos
- `data/salon.db` — Base de datos SQLite
- `data/salon.db-wal`, `data/salon.db-shm` — Archivos WAL (checkpoint automático en backup)

### Tablas Principales
- `app_config` — Configuración general + hidden_panels
- `branches` — Sucursales
- `users` — Usuarios (rol: superadmin, admin, estilista, reception, cashier, display, ventas_caja)
- `clients` — Clientes
- `catalog` — Catálogo (services, products, combos)
- `categories` — Categorías
- `tickets` — Tickets de cola (type: C, B, D, CE, PE, CE+PE, etc.)
- `sales` — Ventas
- `sale_items` — Items de venta
- `payments` — Pagos
- `appointments` — Citas/Agenda
- `promotions` — Promociones
- `cash_sessions` — Sesiones de caja
- `inventory_movements` — Movimientos de inventario

### Seed por defecto
- Admin PIN: `020518`
- Sucursal: "SUCURSAL CENTRAL" (b_main)
- Categorías: SERVICIOS, PRODUCTOS, COMBOS

---

## 11. GitHub & Control de Versiones

- **Repositorio**: https://github.com/appsvod75/Obvio_OS
- **Workflow**: trabajar en local → commit → push → build → rsync → pm2 restart
- **Siempre hacer `git push origin main` ANTES de cerrar sesión**, para mantener el historial sincronizado
- Si alguien más trabaja en el proyecto, hacer `git pull` antes de empezar

## 12. Atajos y Tips

- **F5** → Recargar página (para ver cambios)
- **F12** → Consola del navegador para debug
- **Config → Zona Danger** → Backup antes de limpiar datos
- **Config → Paneles** → Ocultar módulos que no se usan
- La carpeta `data/` está ignorada por Vite para evitar recargas al escribir en DB

---

## 13. Despliegue en VPS (Nginx) — thealanis.luckyapps.online

### Flujo de Trabajo (Actual)
```
[Local]                               [VPS — root@64.23.176.98]
────────────────────────────────────────────────────────────────
1. Trabajar en local
2. git add . && git commit -m "mensaje"   ← Commit a GitHub
3. git push origin main                    ← Sincronizar siempre ANTES de cerrar sesión
4. npm run build                           ← Genera dist/
5. rsync -avz dist/ root@[vps]:/var/www/thealanis/dist/
6. rsync -avz server/server.js root@[vps]:/var/www/thealanis/server/
7. ssh root@[vps] "pm2 restart thealanis-os"
8. Verificar en https://thealanis.luckyapps.online
```

### Flujo de Trabajo (Completo — primera vez/backends múltiples)
```
1. Trabajar en local
2. npm run build
3. rsync -avz dist/ root@[vps]:/var/www/thealanis/dist/
4. rsync -avz server/ root@[vps]:/var/www/thealanis/server/
5. rsync -avz package.json root@[vps]:/var/www/thealanis/
6. ssh root@[vps] "cd /var/www/thealanis && npm install --production"
7. ssh root@[vps] "pm2 restart thealanis-os"
```

### Nginx Config (con SSL)
```nginx
server {
    listen 80;
    server_name thealanis.luckyapps.online;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl;
    server_name thealanis.luckyapps.online;
    ssl_certificate /etc/letsencrypt/live/thealanis.luckyapps.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thealanis.luckyapps.online/privkey.pem;
    root /var/www/thealanis/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://127.0.0.1:3017; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
    location /socket.io/ { proxy_pass http://127.0.0.1:3017; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
}
```

### Datos del VPS
- **IP**: 64.23.176.98
- **Dominio**: thealanis.luckyapps.online (HTTPS)
- **Puerto backend**: 3017
- **Gestor de procesos**: PM2 (nombre: `thealanis-os`)
- **Ruta app**: `/var/www/thealanis`
- **DB**: SQLite en `data/salon.db`

### Subir cambios rápidos (frontend solo)
```bash
npm run build && rsync -avz dist/ root@64.23.176.98:/var/www/thealanis/dist/
```

### Subir cambios backend (server.js)
```bash
rsync -avz server/server.js root@64.23.176.98:/var/www/thealanis/server/
ssh root@64.23.176.98 "pm2 restart thealanis-os"
```

### Subir ambos (full deploy)
```bash
npm run build && rsync -avz dist/ root@64.23.176.98:/var/www/thealanis/dist/ && rsync -avz server/server.js root@64.23.176.98:/var/www/thealanis/server/ && ssh root@64.23.176.98 "pm2 restart thealanis-os"
```

### Si el puerto se desincroniza
- Local: `server/server.js` línea `const PORT = process.env.PORT || 3017;`
- VPS: verificar con `pm2 logs thealanis-os` que el puerto sea 3017
- Si hay conflicto `EADDRINUSE`: `fuser -k 3017/tcp` y reiniciar PM2

### Recomendaciones
- Usar **PM2** para mantener el backend vivo
- Vite es solo para desarrollo. En producción Nginx sirve los archivos de `dist/`
- La base de datos SQLite se crea sola en `data/salon.db`
- Para cambios en backend, subir server/ y reiniciar PM2

---

## 14. Próximos Pasos Sugeridos

1. Terminar de extraer auth, toast y cash de BarberContext a contextos propios
2. Mapeo automático de códigos multi-letra a productos en POS
3. Migraciones de DB automatizadas
4. Filtrar proyección por rango de fechas en ReportingDashboard
5. Editar/borrar planes mensuales existentes desde la UI
6. Optimizar `sync_needed` a eventos por entidad (evitar sync completo)
