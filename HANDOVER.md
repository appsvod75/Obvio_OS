# HANDOVER — Obvio OS v4.0

## Descripción General
Sistema POS para barbería/salón con gestión de ventas, tickets (cola), agenda de citas, clientes, inventario, promociones, corte de caja, reportes, pantalla TV y configuración multi-sucursal.

## Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express + Socket.IO + SQLite (better-sqlite3)
- **Notificaciones**: Toast integrado + Telegram bot
- **Impresión**: RawBT (Android) + window.print (PC)
- **Tiempo real**: Socket.IO para todos los CRUD (clientes, catálogo, usuarios, sucursales, promociones, citas, inventario, ventas, tickets, caja, config)

## Estructura del Proyecto
```
obvio_OS/
├── App.tsx                    # HashRouter > BarberProvider > AppRoutes
├── index.tsx                  # Entry point con StrictMode
├── index.css                  # Tailwind + variables rose-palo + animaciones
├── types.ts                   # Todos los tipos: User, Sale, Ticket, Appointment, etc.
├── types/permissions.ts       # Sistema de permisos por rol
├── tailwind.config.js
├── vite.config.ts             # Proxy: /api y /socket.io → :3001
├── components.json            # shadcn/ui config
├── context/
│   ├── BarberContext.tsx       # ~822 líneas — Auth, socket, coordinación (reducido)
│   ├── ClientsContext.tsx      # Clientes
│   ├── CatalogContext.tsx      # Catálogo + categorías
│   ├── PromotionsContext.tsx   # Promociones
│   ├── AgendaContext.tsx       # Citas/Agenda
│   ├── StaffContext.tsx        # Usuarios/empleados
│   ├── BranchContext.tsx       # Sucursales + planes mensuales
│   ├── ConfigContext.tsx       # Config general + Telegram token
│   ├── InventoryContext.tsx    # Inventario, stocks, movimientos
│   ├── TicketsContext.tsx      # Tickets de cola
│   └── SalesContext.tsx        # Ventas
├── components/
│   ├── Login.tsx               # Login con PIN, auto-login, bloqueo 3 intentos/60s
│   ├── POS.tsx                 # Terminal POS (tickets + directo)
│   ├── AppointmentReminder.tsx # Alerta 30min antes de cita con voz y Telegram
│   ├── CartSidebar.tsx         # Carrito lateral con métodos de pago
│   ├── ReceiptModal.tsx        # Modal de ticket post-venta (con clamp/vmin)
│   ├── TicketContent.tsx       # Contenido del ticket de venta
│   ├── TurnTicketContent.tsx   # Contenido del ticket de turno (recepción)
│   ├── SalesHistory.tsx        # Historial de ventas con filtros
│   ├── SettingsManager.tsx     # Configuración General + TV + Paneles + Zona Danger
│   ├── Reception.tsx           # Recepción: categorías dinámicas, multi-select
│   ├── Agenda.tsx              # Agenda con calendario mensual + lista de citas
│   ├── ClientManager.tsx       # CRUD de clientes
│   ├── CatalogManager.tsx      # CRUD de catálogo con categorías
│   ├── InventoryManager.tsx    # Gestión de inventario
│   ├── StaffManager.tsx        # CRUD de usuarios/empleados
│   ├── BranchManager.tsx       # CRUD de sucursales
│   ├── PromotionManager.tsx    # CRUD de promociones
│   ├── CashReport.tsx          # Corte de caja
│   ├── ReportingDashboard.tsx  # Reportes gráficos (recharts)
│   ├── Dashboard.tsx           # Panel admin con iconos visibles según hiddenPanels
│   ├── layout/
│   │   ├── MainLayout.tsx      # Sidebar + header + Outlet, responsive, sticky logo
│   │   └── AppRoutes.tsx       # Router tree
│   └── pos/
│       ├── POSModals.tsx       # Modales: AddClient, Combo, OpenSession
│       ├── ProductGrid.tsx     # Grid de productos con drag-scroll
│       └── CardSidebar.tsx     # Carrito responsive con overlay
├── hooks/
│   ├── usePOSStore.ts          # Store del POS (carrito, pagos, checkout)
│   ├── useAuthStore.ts         # Wrapper de autenticación
│   ├── useConfigStore.ts       # Wrapper de config
│   ├── usePermissions.ts       # Permisos por rol
│   ├── useBranchStore.ts       # Sucursales
│   ├── useDragScroll.ts        # Drag-to-scroll con soporte touch
│   └── ... (otros stores wrapper)
├── server/
│   ├── server.js               # Express + Socket.IO (~832 líneas)
│   └── db.js                   # SQLite schema + seed
├── services/
│   └── printService.ts         # Impresión RawBT / window.print
├── lib/
│   ├── socket.ts               # Singleton Socket.IO client
│   └── utils.ts                # cn() con tailwind-merge
└── utils/
    └── dates.ts                # Fechas en timezone El Salvador
```

## Flujo de Trabajo (Desarrollo → Producción)

```
[Local]                               [VPS — root@64.23.176.98]
────────────────────────────────────────────────────────────────
1. Trabajar en local
2. git add . && git commit -m "mensaje"
3. git push origin main               ← Sincronizar GitHub ANTES de cerrar sesión
4. npm run build
   → genera dist/
5. rsync -avz dist/ root@[vps]:/var/www/thealanis/dist/
6. rsync -avz server/server.js root@[vps]:/var/www/thealanis/server/
7. ssh root@[vps] "pm2 restart thealanis-os"
8. Verificar en https://thealanis.luckyapps.online
```

## Funcionalidades Clave

### Login
- PIN numérico, auto-login al escribir (200ms debounce)
- 3 intentos fallidos → bloqueo 60s
- Logo con anillo giratorio (blanco + rosa intenso)
- Footer: "LuckyApps by Omar Duarte"

### POS / Caja
- Modos: Tickets (turnos) y Directo (walk-in)
- Catálogo con búsqueda, categorías, drag-scroll
- Carrito responsive: overlay en móvil, sidebar estático en desktop
- Pagos divididos: efectivo, tarjeta, transferencia, bitcoin
- Descuentos por promoción y puntos de lealtad
- Botón "Limpiar" y eliminar pago individual
- Modal de ticket post-venta responsive (clamp + vmin)

### Recepción
- Crear tickets con selección de cliente existente o nuevo
- Categorías dinámicas desde el catálogo (2 primeras letras como código)
- Multi-select de servicios (ej: CE+PE)
- Gestor de cola con asignación de estilista y silla
- Placeholder "Estilista..." oculto (disabled hidden)

### Agenda
- Calendario mensual con dots indicadores de citas
- Layout responsive: horizontal (lg+) y vertical (móvil)
- Crear/editar/atender citas → genera ticket automático
- Servicios desde categorías del catálogo
- Notificaciones toast

### Configuración
- General: nombre, logo, ticket, webhook
- TV: playlist, ticker
- Paneles: ocultar/mostrar módulos (sidebar + menú admin)
- Zona Danger: backup DB, limpieza por período
- hiddenPanels se persiste en DB

### Sidebar
- Sticky logo arriba, sticky usuario abajo
- Scroll solo en items del menú
- Overflow-anchor para evitar scroll anchoring
- Items filtrados por rol, permiso y hiddenPanels

## Responsive Design Pattern
Se usa `clamp(min, vmin, max)` para escalar proporcional:
- Textos: `clamp(8px, 2vmin, 14px)`
- Padding: `clamp(4px, 1vmin, 16px)`
- Iconos: `style={{ width: 'clamp(14px, 3vmin, 20px)', height: '...' }}`
- Modal del ticket usa `vmin` para mantener proporción en vertical y horizontal

## API Endpoints
- `POST /api/login` — Autenticación por PIN
- `GET /api/sync` — Sincronización completa
- `GET/POST/PUT/DELETE /api/tickets` — Tickets (cola)
- `POST /api/sales` — Procesar venta
- `POST/PUT /api/clients` — Clientes
- `POST/PUT/DELETE /api/catalog` — Catálogo
- `POST/DELETE /api/categories` — Categorías
- `POST/PUT /api/branches` — Sucursales
- `POST/PUT/DELETE /api/users` — Usuarios
- `POST/PUT/DELETE /api/promotions` — Promociones
- `POST/PUT/DELETE /api/appointments` — Citas
- `PUT /api/config` — Configuración general + hiddenPanels
- `GET/POST/PUT /api/cash-session` — Sesión de caja
- `GET /api/backup` — Descargar backup DB
- `POST /api/cleanup` — Limpiar datos por período
- `GET /api/health` — Health check
- `POST /api/send-telegram-reminder` — Enviar notificación Telegram al estilista
- `POST /api/attendance` — Marcación de entrada/salida

## Socket.IO Events
- `tickets_update` — Actualización de cola en tiempo real (sala por sucursal)
- `sync_needed` — Forzar sincronización completa (se emite tras cada CRUD con debounce 500ms)
- `config_init`, `config_update` — Config en tiempo real
- `attendance_update` — Marcación de entrada/salida
- `force_logout` — Deslogueo forzado (3:00 AM)

## Sidebar
- Oculta por defecto, se abre al tocar el menú hamburguesa (3 líneas)
- Muestra iconos + texto completo siempre
- Fondo oscuro semitransparente al abrirse, se cierra al tocar fuera o navegar
- Sticky logo arriba, sticky usuario abajo, scroll solo en items del menú
- Items filtrados por rol, permiso y hiddenPanels
- Vista de Inventario completa con clamp (tablas, modales ERP, recepción, kardex)
- Vista de Promociones completa con clamp (grid promos, lealtad, modal campaña)
- Vista de Sucursales completa con clamp (formulario config + plan, cards network deck)
- Vista de Ventas completa con clamp (filtros, resumen, tabla, modal ticket)
- Catálogo: DetailPanel y ComboSection con clamp reducido

## Proyección de Ventas (Plan Mensual)
- `ReportingDashboard` calcula proyección basada en **días reales con ventas**:
  ```typescript
  const saleDays = new Set(branchSales.map(s => {
    const d = new Date(s.timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })).size;
  const projection = saleDays > 0
    ? (actualAmount / saleDays) * totalWorkingDays
    : 0;
  ```
- Ya no estima días hábiles transcurridos por calendario
- BranchManager precarga plan existente al seleccionar sucursal+mes+año
- Formulario con overflow-y-auto para evitar inputs fuera de vista

## Tablas con scroll
- SalesHistory: header fijo fuera del scroll container, solo tbody scrollea
- BranchManager: panel izquierdo con overflow-y-auto para formularios largos

## Issues Conocidos / Pendientes
- BarberContext reducido de ~1212 a ~822 líneas, pendiente terminar de migrar auth/toast/cash a contextos propios
- No hay migraciones de DB — los cambios de schema se manejan con ALTER TABLE en seedIfEmpty
- La app usa el role `'estilista'` (no `'barber'`)
- Los tickets de recepción con códigos multi-letra (ej: CE+PE) no mapean automáticamente a productos en el POS
- Inventario de insumos + recetas de servicios (bom list) — pendiente de implementar
- El `sync_needed` actual hace sync completo de todos los datos — optimizable a eventos por entidad específica
- Telegram: se necesita crear un bot en @BotFather y pegar el token en Config → Telegram Bot Token

## Cómo Correr (Desarrollo)
```bash
npm install
npm run dev        # Frontend :3000 + Backend :3017
npm run build      # Build producción
npm run server     # Solo backend
```

## Git & GitHub
- **Repositorio**: https://github.com/appsvod75/Obvio_OS
- **Siempre hacer `git push origin main` antes de cerrar sesión**
- Flujo: `git add . && git commit -m "mensaje" && git push origin main`
- Si hay múltiples desarrolladores: `git pull` antes de empezar a trabajar

## Despliegue en VPS (Nginx)

### Requisitos
- Node.js 18+ en el VPS
- Nginx instalado
- Puerto 3017 abierto (o el que se configure)

### Pasos
```bash
# 1. En local: compilar
npm run build
# → se genera la carpeta dist/

# 2. Subir al VPS (ej: con rsync o scp)
rsync -avz dist/ usuario@vps:/var/www/obvio/dist/
rsync -avz server/ usuario@vps:/var/www/obvio/server/
rsync -avz package.json usuario@vps:/var/www/obvio/
rsync -avz node_modules/ usuario@vps:/var/www/obvio/node_modules/

# 3. En el VPS: instalar dependencias y arrancar
cd /var/www/obvio
npm install --production
node server/server.js

# 4. Configurar Nginx (/etc/nginx/sites-available/obvio)
: '
server {
    listen 80;
    server_name tudominio.com;

    # Frontend (archivos estáticos)
    root /var/www/obvio/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
'

# 5. Habilitar sitio y recargar Nginx
ln -s /etc/nginx/sites-available/obvio /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 6. (Opcional) Usar PM2 para mantener el server vivo
npm install -g pm2
pm2 start server/server.js --name obvio
pm2 save
pm2 startup
```

### Notas de Producción
- Vite SOLO se usa en desarrollo. En producción, Nginx sirve los archivos estáticos de `dist/`
- El backend corre como proceso independiente (node, pm2, systemd)
- La DB (SQLite) se crea automáticamente en `data/salon.db`
- Los cambios en el schema de DB requieren migración manual o ALTER TABLE
