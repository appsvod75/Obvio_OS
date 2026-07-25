import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import { getDb } from './db.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

let currentConfig = {};

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function db() { return getDb(); }

function broadcastTickets(branchId) {
  try {
    const rows = db().prepare(
      "SELECT * FROM tickets WHERE branch_id = ? AND status IN ('waiting', 'serving') ORDER BY created_at ASC"
    ).all(branchId);
    io.to(`branch_${branchId}`).emit('tickets_update', rows);
  } catch (e) { console.error("Error broadcast:", e); }
}

// =================================================================
// AUTH & SYNC
// =================================================================

app.post('/api/login', (req, res) => {
  const { pin } = req.body;
  try {
    const user = db().prepare("SELECT * FROM users WHERE pin = ? AND active = 1").get(pin);
    if (user) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: "PIN inválido" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sync', (req, res) => {
  const { branchId } = req.query;
  try {
    const branches = db().prepare("SELECT * FROM branches").all();
    const users = db().prepare("SELECT * FROM users").all();
    const clients = db().prepare("SELECT * FROM clients").all();
    const catalog = db().prepare(`
      SELECT c.*, cat.name as category 
      FROM catalog c 
      LEFT JOIN categories cat ON c.category_id = cat.id
    `).all();
    const stocks = db().prepare("SELECT * FROM branch_stock").all();
    const plans = db().prepare("SELECT * FROM monthly_plans").all();
    const playlist = db().prepare("SELECT * FROM video_playlist ORDER BY sort_order").all();
    const configRow = db().prepare("SELECT * FROM app_config LIMIT 1").get();
    const promotions = db().prepare("SELECT * FROM promotions").all();
    const appts = db().prepare("SELECT * FROM appointments WHERE date >= date('now', 'localtime')").all();
    const categories = db().prepare("SELECT id, name FROM categories ORDER BY name").all();
    const movements = db().prepare(`
      SELECT m.*, i.name as item_name 
      FROM inventory_movements m 
      LEFT JOIN catalog i ON m.item_id = i.id 
      ORDER BY m.date DESC LIMIT 200
    `).all();

    const allSessions = db().prepare("SELECT * FROM cash_sessions ORDER BY opened_at DESC LIMIT 500").all();
    const cashSession = allSessions.find(s => s.closed_at === null) || null;
    const cashClosures = allSessions.filter(s => s.closed_at !== null);

    const sales = db().prepare("SELECT * FROM sales ORDER BY timestamp DESC LIMIT 1000").all();
    const saleItems = db().prepare("SELECT * FROM sale_items").all();
    const payments = db().prepare("SELECT * FROM payments").all();

    const salesWithDetail = sales.map(s => ({
      ...s,
      items: saleItems.filter(i => i.sale_id === s.id),
      payments: payments.filter(p => p.sale_id === s.id)
    }));

    res.json({
      branches, users, clients, catalog, stocks,
      monthlyPlans: plans,
      videoPlaylist: playlist,
      categories: categories,
      config: configRow || {},
      promotions,
      appointments: appts,
      inventoryMovements: movements,
      sales: salesWithDetail,
      cashSession,
      cashClosures
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// TICKETS
// =================================================================

app.get('/api/tickets', (req, res) => {
  const { branchId } = req.query;
  try {
    let rows;
    if (branchId) {
      rows = db().prepare(
        "SELECT * FROM tickets WHERE branch_id = ? AND status IN ('waiting', 'serving') ORDER BY created_at ASC"
      ).all(branchId);
    } else {
      rows = db().prepare(
        "SELECT * FROM tickets WHERE status IN ('waiting', 'serving') ORDER BY created_at ASC"
      ).all();
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tickets', (req, res) => {
  const t = req.body;
  try {
    db().prepare(
      "INSERT INTO tickets (id, branch_id, sequence_number, full_code, type, client_name, client_id, status) VALUES (?,?,?,?,?,?,?,?)"
    ).run(t.id, t.branchId, t.sequenceNumber, t.fullCode, t.type, t.clientName, t.clientId, 'waiting');
    broadcastTickets(t.branchId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, barberId, chair } = req.body;
  try {
    const ticket = db().prepare("SELECT branch_id FROM tickets WHERE id = ?").get(id);
    db().prepare(
      "UPDATE tickets SET status = ?, barber_id = ?, chair = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(status, barberId, chair, id);
    if (ticket) broadcastTickets(ticket.branch_id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// SALES
// =================================================================

app.post('/api/sales', (req, res) => {
  const s = req.body;
  try {
    const tx = db().transaction(() => {
      db().prepare(
        "INSERT INTO sales (id, branch_id, ticket_id, client_id, barber_id, subtotal, discount, total, timestamp, points_earned, points_used, applied_promotion_id) VALUES (?,?,?,?,?,?,?,?,datetime('now', 'localtime'),?,?,?)"
      ).run(s.id, s.branchId, s.ticketId, s.clientId, s.barberId, s.subtotal, s.discount, s.total, s.pointsEarned || 0, s.pointsUsed || 0, s.appliedPromotionId);

      for (const item of s.items) {
        db().prepare(
          "INSERT INTO sale_items (sale_id, item_id, name, price, quantity) VALUES (?,?,?,?,?)"
        ).run(s.id, item.itemId, item.name, item.price, item.quantity);

        const catalogItem = db().prepare("SELECT type, combo_definition FROM catalog WHERE id = ?").get(item.itemId);
        if (catalogItem) {
          const deductStock = (itmId, qtyToDeduct) => {
            db().prepare(
              "UPDATE branch_stock SET stock = stock - ? WHERE branch_id = ? AND item_id = ?"
            ).run(qtyToDeduct, s.branchId, itmId);

            const stockRes = db().prepare("SELECT stock FROM branch_stock WHERE branch_id = ? AND item_id = ?").get(s.branchId, itmId);
            const finalStock = stockRes ? stockRes.stock : 0;
            const movId = crypto.randomUUID();

            db().prepare(
              "INSERT INTO inventory_movements (id, branch_id, item_id, type, quantity, reason, date, new_stock, unit_cost) VALUES (?, ?, ?, 'sale', ?, ?, datetime('now', 'localtime'), ?, (SELECT cost FROM catalog WHERE id = ?))"
            ).run(movId, s.branchId, itmId, qtyToDeduct, `Venta Ticket #${s.ticketId || 'POS'}`, finalStock, itmId);
          };

          if (catalogItem.type === 'product') {
            deductStock(item.itemId, item.quantity);
          } else if (catalogItem.type === 'combo') {
            let comboIds = [];
            try {
              const def = catalogItem.combo_definition;
              if (def) comboIds = typeof def === 'string' ? JSON.parse(def) : def;
            } catch (e) { comboIds = []; }

            if (Array.isArray(comboIds)) {
              for (const subItem of comboIds) {
                const subId = typeof subItem === 'object' && subItem.id ? subItem.id : subItem;
                const subInfo = db().prepare("SELECT type, name FROM catalog WHERE id = ?").get(subId);
                if (subInfo && subInfo.type === 'product') {
                  deductStock(subId, item.quantity);
                }
              }
            }
          }
        }
      }

      for (const p of s.payments) {
        db().prepare("INSERT INTO payments (sale_id, method, amount) VALUES (?,?,?)").run(s.id, p.method, p.amount);
      }

      if (s.ticketId) {
        db().prepare("UPDATE tickets SET status = 'completed' WHERE id = ?").run(s.ticketId);
        broadcastTickets(s.branchId);
      }

      if (s.clientId) {
        const pointsChange = (s.pointsEarned || 0) - (s.pointsUsed || 0);
        db().prepare("UPDATE clients SET points = points + ?, visits = visits + 1 WHERE id = ?").run(pointsChange, s.clientId);
      }
    });

    tx();
    io.emit('sync_needed', { reason: 'sales' });
    res.json({ success: true });
  } catch (e) {
    console.error("Critical Sale Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// =================================================================
// BACKUP & DATA CLEANUP (DANGER ZONE)
// =================================================================

app.get('/api/backup', (req, res) => {
  try {
    db().prepare("PRAGMA wal_checkpoint(TRUNCATE)").run();
    const dbPath = process.cwd() + '/data/salon.db';
    const dateStr = new Date().toISOString().split('T')[0];
    res.download(dbPath, `backup-obvio-${dateStr}.db`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cleanup', (req, res) => {
  const { table, from, to } = req.body;
  const allowedTables = ['sales', 'clients', 'catalog', 'tickets', 'appointments', 'inventory_movements', 'cash_sessions', 'promotions'];
  if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });

  const dateColumns = {
    sales: 'timestamp',
    tickets: 'created_at',
    appointments: 'date',
    inventory_movements: 'date',
    cash_sessions: 'opened_at',
  };

  try {
    const params = [];
    let query = `DELETE FROM ${table}`;
    const dateCol = dateColumns[table];
    if (from && to && dateCol) {
      query += ` WHERE date(${dateCol}) >= ? AND date(${dateCol}) <= ?`;
      params.push(from, to);
    }
    const info = db().prepare(query).run(...params);
    io.emit('sync_needed', { reason: 'cleanup', table });
    res.json({ success: true, deleted: info.changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =================================================================
// INVENTORY MOVEMENTS
// =================================================================

app.post('/api/inventory-movements', (req, res) => {
  const m = req.body;
  try {
    const tx = db().transaction(() => {
      const currStock = db().prepare("SELECT stock FROM branch_stock WHERE branch_id = ? AND item_id = ?").get(m.branchId, m.itemId);
      const prev = currStock ? currStock.stock : 0;
      let delta = m.quantity;
      if (['adjustment_out', 'transfer_out', 'sale'].includes(m.type)) delta = -m.quantity;
      const next = prev + delta;

      db().prepare(
        "INSERT INTO inventory_movements (id, branch_id, item_id, type, quantity, unit_cost, previous_stock, new_stock, reason, related_branch_id, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
      ).run(m.id, m.branchId, m.itemId, m.type, m.quantity, m.unitCost, prev, next, m.reason, m.relatedBranchId || null, m.status || 'completed');

      db().prepare(
        "INSERT INTO branch_stock (id, branch_id, item_id, stock, average_cost) VALUES (?, ?, ?, ?, ?) ON CONFLICT(branch_id, item_id) DO UPDATE SET stock = excluded.stock, average_cost = excluded.average_cost"
      ).run(crypto.randomUUID(), m.branchId, m.itemId, next, m.unitCost);
    });

    tx();
    io.emit('sync_needed', { reason: 'inventory' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =================================================================
// CLIENTS
// =================================================================

app.post('/api/clients', (req, res) => {
  const c = req.body;
  try {
    const tx = db().transaction(() => {
      db().prepare(
        "INSERT INTO clients (id, name, phone, email, birth_date, referred_by, notes) VALUES (?,?,?,?,?,?,?)"
      ).run(c.id, c.name, c.phone, c.email, c.birthDate, c.referredBy, c.notes);

      if (c.referredBy) {
        const configRow = db().prepare("SELECT loyalty_referral_bonus, loyalty_enabled FROM app_config LIMIT 1").get();
        if (configRow && configRow.loyalty_enabled && configRow.loyalty_referral_bonus > 0) {
          db().prepare("UPDATE clients SET points = points + ? WHERE id = ?").run(configRow.loyalty_referral_bonus, c.referredBy);
        }
      }
    });

    tx();
    io.emit('sync_needed', { reason: 'clients' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    db().prepare("UPDATE clients SET name=?, phone=?, email=?, birth_date=?, notes=? WHERE id=?").run(c.name, c.phone, c.email, c.birthDate, c.notes, id);
    io.emit('sync_needed', { reason: 'clients' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// USERS / STAFF
// =================================================================

app.post('/api/users', (req, res) => {
  const u = req.body;
  try {
    db().prepare("INSERT INTO users (id, name, username, role, pin, branch_id, can_do_pos, telegram_id, active) VALUES (?,?,?,?,?,?,?,?,?)").run(u.id, u.name, u.username, u.role, u.pin, u.branchId, u.canDoPos ? 1 : 0, u.telegramId || null, 1);
    io.emit('sync_needed', { reason: 'users' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const u = req.body;
  try {
    db().prepare("UPDATE users SET name=?, username=?, role=?, pin=?, branch_id=?, can_do_pos=?, telegram_id=?, active=? WHERE id=?").run(u.name, u.username, u.role, u.pin, u.branchId, u.canDoPos ? 1 : 0, u.telegramId || null, u.active ? 1 : 0, id);
    io.emit('sync_needed', { reason: 'users' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    db().prepare("DELETE FROM users WHERE id = ?").run(id);
    io.emit('sync_needed', { reason: 'users' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// CATALOG
// =================================================================

app.post('/api/catalog', (req, res) => {
  const i = req.body;
  try {
    let catId = i.categoryId;
    if (!catId && i.category) {
      const existing = db().prepare("SELECT id FROM categories WHERE name = ?").get(i.category);
      if (existing) catId = existing.id;
      else {
        const newId = crypto.randomUUID();
        db().prepare("INSERT INTO categories (id, name) VALUES (?, ?)").run(newId, i.category);
        catId = newId;
      }
    }
    db().prepare("INSERT INTO catalog (id, name, type, price, category_id, active, combo_definition) VALUES (?,?,?,?,?,?,?)").run(i.id, i.name, i.type, i.price, catId, 1, JSON.stringify(i.comboDefinition));
    io.emit('sync_needed', { reason: 'catalog' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/catalog/:id', (req, res) => {
  const { id } = req.params;
  const i = req.body;
  try {
    let catId = i.categoryId;
    if (!catId && i.category) {
      const existing = db().prepare("SELECT id FROM categories WHERE name = ?").get(i.category);
      if (existing) catId = existing.id;
      else {
        const newId = crypto.randomUUID();
        db().prepare("INSERT INTO categories (id, name) VALUES (?, ?)").run(newId, i.category);
        catId = newId;
      }
    }
    db().prepare("UPDATE catalog SET name=?, type=?, price=?, category_id=?, active=?, combo_definition=? WHERE id=?").run(i.name, i.type, i.price, catId, i.active ? 1 : 0, JSON.stringify(i.comboDefinition), id);
    io.emit('sync_needed', { reason: 'catalog' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/catalog/:id', (req, res) => {
  const { id } = req.params;
  try {
    db().prepare("DELETE FROM catalog WHERE id = ?").run(id);
    io.emit('sync_needed', { reason: 'catalog' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// CATEGORIES
// =================================================================

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const existing = db().prepare("SELECT id FROM categories WHERE name = ?").get(name);
    if (existing) return res.json({ success: true, id: existing.id });
    const newId = crypto.randomUUID();
    db().prepare("INSERT INTO categories (id, name) VALUES (?, ?)").run(newId, name);
    io.emit('sync_needed', { reason: 'categories' });
    res.json({ success: true, id: newId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/categories/:name', (req, res) => {
  const { name: oldName } = req.params;
  const { name: newName } = req.body;
  if (!newName) return res.status(400).json({ error: 'New name required' });
  try {
    const existing = db().prepare("SELECT id FROM categories WHERE name = ?").get(newName);
    if (existing && oldName !== newName) return res.status(409).json({ error: 'Category already exists' });
    db().prepare("UPDATE categories SET name = ? WHERE name = ?").run(newName, oldName);
    io.emit('sync_needed', { reason: 'categories' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/categories/:name', (req, res) => {
  const { name } = req.params;
  try {
    db().prepare("DELETE FROM categories WHERE name = ?").run(name);
    io.emit('sync_needed', { reason: 'categories' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// BRANCHES
// =================================================================

app.post('/api/branches', (req, res) => {
  const b = req.body;
  try {
    db().prepare("INSERT INTO branches (id, name, address, phone, email, webhook_url, report_email, active, has_reception, default_monthly_goal, default_working_days, default_product_goal_percent, auto_close_time, auto_close_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(b.id, b.name, b.address, b.phone, b.email, b.webhookUrl, b.reportEmail, b.active ? 1 : 0, b.hasReception ? 1 : 0, b.defaultMonthlyGoal, b.defaultWorkingDays, b.defaultProductGoalPercent, b.autoCloseTime || '22:00:00', b.autoCloseEnabled ? 1 : 0);
    io.emit('sync_needed', { reason: 'branches' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    db().prepare("UPDATE branches SET name=?, address=?, phone=?, email=?, webhook_url=?, report_email=?, active=?, has_reception=?, default_monthly_goal=?, default_working_days=?, default_product_goal_percent=?, auto_close_time=?, auto_close_enabled=? WHERE id=?").run(b.name, b.address, b.phone, b.email, b.webhookUrl, b.reportEmail, b.active ? 1 : 0, b.hasReception ? 1 : 0, b.defaultMonthlyGoal, b.defaultWorkingDays, b.defaultProductGoalPercent, b.autoCloseTime || '22:00:00', b.autoCloseEnabled ? 1 : 0, id);
    io.emit('sync_needed', { reason: 'branches' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// MONTHLY PLANS
// =================================================================

app.post('/api/monthly-plans', (req, res) => {
  const p = req.body;
  try {
    db().prepare(
      "INSERT INTO monthly_plans (id, branch_id, month, year, goal, working_days, product_goal_percent) VALUES (?,?,?,?,?,?,?) ON CONFLICT(branch_id, month, year) DO UPDATE SET goal=excluded.goal, working_days=excluded.working_days, product_goal_percent=excluded.product_goal_percent"
    ).run(p.id, p.branchId, p.month, p.year, p.goal, p.workingDays, p.productGoalPercent);
    io.emit('sync_needed', { reason: 'monthly_plans' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// PROMOTIONS
// =================================================================

app.post('/api/promotions', (req, res) => {
  const p = req.body;
  try {
    db().prepare("INSERT INTO promotions (id, name, type, value, trigger_type, days_active, hour_start, hour_end, start_date, end_date, apply_to, specific_item_id, active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(p.id, p.name, p.type, p.value, p.trigger, JSON.stringify(p.daysActive), p.hourStart, p.hourEnd, p.startDate, p.endDate, p.applyTo, p.specificItemId, 1);
    io.emit('sync_needed', { reason: 'promotions' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/promotions/:id', (req, res) => {
  const { id } = req.params;
  const p = req.body;
  try {
    db().prepare("UPDATE promotions SET name=?, type=?, value=?, trigger_type=?, days_active=?, hour_start=?, hour_end=?, start_date=?, end_date=?, apply_to=?, specific_item_id=?, active=? WHERE id=?").run(p.name, p.type, p.value, p.trigger, JSON.stringify(p.daysActive), p.hourStart, p.hourEnd, p.startDate, p.endDate, p.applyTo, p.specificItemId, p.active ? 1 : 0, id);
    io.emit('sync_needed', { reason: 'promotions' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/promotions/:id', (req, res) => {
  const { id } = req.params;
  try {
    db().prepare("DELETE FROM promotions WHERE id = ?").run(id);
    io.emit('sync_needed', { reason: 'promotions' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// APPOINTMENTS
// =================================================================

app.post('/api/appointments', (req, res) => {
  const a = req.body;
  try {
    db().prepare("INSERT INTO appointments (id, branch_id, client_id, client_name, client_phone, date, time, barber_id, service_type, notes) VALUES (?,?,?,?,?,?,?,?,?,?)").run(a.id, a.branchId, a.clientId || null, a.clientName, a.clientPhone, a.date, a.time, a.barberId, a.serviceType, a.notes);
    io.emit('sync_needed', { reason: 'appointments' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const a = req.body;
  try {
    db().prepare("UPDATE appointments SET client_id=?, client_name=?, client_phone=?, date=?, time=?, barber_id=?, service_type=?, notes=? WHERE id=?").run(a.clientId || null, a.clientName, a.clientPhone, a.date, a.time, a.barberId, a.serviceType, a.notes, id);
    io.emit('sync_needed', { reason: 'appointments' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  try {
    db().prepare("DELETE FROM appointments WHERE id = ?").run(id);
    io.emit('sync_needed', { reason: 'appointments' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// CONFIG
// =================================================================

app.put('/api/config', (req, res) => {
  const c = req.body;
  try {
    const tx = db().transaction(() => {
      db().prepare(
        "INSERT INTO app_config (id, salon_name, salon_address, salon_phone, ticket_footer, logo_url, ticker_message, ticker_speed, youtube_video_id, webhook_url, ticket_size, hidden_panels) VALUES (1,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET salon_name=excluded.salon_name, salon_address=excluded.salon_address, salon_phone=excluded.salon_phone, ticket_footer=excluded.ticket_footer, logo_url=excluded.logo_url, ticker_message=excluded.ticker_message, ticker_speed=excluded.ticker_speed, youtube_video_id=excluded.youtube_video_id, webhook_url=excluded.webhook_url, ticket_size=excluded.ticket_size, hidden_panels=excluded.hidden_panels"
      ).run(c.salonName || '', c.salonAddress || '', c.salonPhone || '', c.ticketFooter || '', c.logoUrl || '', c.tickerMessage || '', c.tickerSpeed || 20, c.youtubeVideoId || '', c.webhookUrl || '', c.ticketSize || '80mm', JSON.stringify(c.hiddenPanels || []));

      const playlistToSend = c.videoPlaylist || c.playlist;
      if (playlistToSend !== undefined && Array.isArray(playlistToSend)) {
        db().prepare("DELETE FROM video_playlist").run();
        for (let i = 0; i < playlistToSend.length; i++) {
          const v = playlistToSend[i];
          const type = (v.type === 'youtube' || v.type === 'mp4' || v.type === 'file' || v.type === 'link') ? v.type : 'link';
          db().prepare("INSERT INTO video_playlist (id, name, url, type, sort_order) VALUES (?,?,?,?,?)").run(v.id || crypto.randomUUID(), v.name || 'Sin nombre', v.url || '', type, i);
        }
      }
    });

    tx();

    const newMemoryConfig = { ...currentConfig, ...c, videoPlaylist: c.videoPlaylist || currentConfig.videoPlaylist || [] };
    currentConfig = newMemoryConfig;
    io.emit('config_update', currentConfig);

    res.json({ success: true });
  } catch (e) {
    console.error("Config error:", e);
    res.status(500).json({ error: e.message });
  }
});

// =================================================================
// ATTENDANCE (Marcación)
// =================================================================

app.post('/api/attendance', (req, res) => {
  const { id, userId, userName, type, latitude, longitude, withinGeofence } = req.body;
  try {
    db().prepare(
      "INSERT INTO attendance (id, user_id, user_name, type, timestamp, latitude, longitude, within_geofence) VALUES (?,?,?,?,datetime('now','localtime'),?,?,?)"
    ).run(id, userId, userName, type, latitude || null, longitude || null, withinGeofence ? 1 : 0);
    io.emit('attendance_update', { userId, type, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attendance', (req, res) => {
  const { userId, startDate, endDate } = req.query;
  try {
    let sql = "SELECT * FROM attendance WHERE 1=1";
    const params = [];
    if (userId) { sql += " AND user_id = ?"; params.push(userId); }
    if (startDate) { sql += " AND date(timestamp) >= ?"; params.push(startDate); }
    if (endDate) { sql += " AND date(timestamp) <= ?"; params.push(endDate); }
    sql += " ORDER BY timestamp DESC LIMIT 100";
    const rows = db().prepare(sql).all(...params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// CASH SESSIONS
// =================================================================

app.get('/api/cash-session', (req, res) => {
  const { branchId } = req.query;
  try {
    const session = db().prepare("SELECT * FROM cash_sessions WHERE branch_id = ? AND closed_at IS NULL LIMIT 1").get(branchId);
    res.json(session || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cash-session', (req, res) => {
  const s = req.body;
  try {
    db().prepare("INSERT INTO cash_sessions (id, branch_id, opening_amount, opened_by) VALUES (?,?,?,?)").run(s.id, s.branchId, s.openingAmount, s.openedBy);
    io.emit('sync_needed', { reason: 'cash_session' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/cash-session/:id/close', (req, res) => {
  const { id } = req.params;
  const s = req.body;
  try {
    db().prepare(`
      UPDATE cash_sessions SET 
        closed_at = datetime('now', 'localtime'),
        total_sales = ?, total_cash = ?, total_card = ?, total_transfer = ?, total_bitcoin = ?,
        services_total = ?, products_total = ?, combos_total = ?, operations_count = ?
      WHERE id = ?
    `).run(s.totalSales || 0, s.totalCash || 0, s.totalCard || 0, s.totalTransfer || 0, s.totalBitcoin || 0, s.servicesTotal || 0, s.productsTotal || 0, s.combosTotal || 0, s.operationsCount || 0, id);
    io.emit('sync_needed', { reason: 'cash_session' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// ADMIN RESET
// =================================================================

app.post('/api/admin/reset', (req, res) => {
  const { segments, userId } = req.body;
  if (userId && (userId !== 'u_admin' && userId !== '1')) {
    return res.status(403).json({ error: "No tienes permisos de super-administrador" });
  }

  try {
    const tx = db().transaction(() => {
      if (segments.includes('sales')) {
        db().prepare("DELETE FROM payments").run();
        db().prepare("DELETE FROM sale_items").run();
        db().prepare("DELETE FROM sales").run();
        db().prepare("DELETE FROM cash_sessions").run();
      }
      if (segments.includes('inventory')) {
        db().prepare("DELETE FROM inventory_movements").run();
        db().prepare("UPDATE branch_stock SET stock = 0").run();
      }
      if (segments.includes('clients')) {
        db().prepare("DELETE FROM clients").run();
      }
      if (segments.includes('appointments')) {
        db().prepare("DELETE FROM appointments").run();
      }
      if (segments.includes('full')) {
        db().prepare("PRAGMA foreign_keys = OFF").run();
        const tables = ['payments', 'sale_items', 'sales', 'cash_sessions', 'inventory_movements', 'branch_stock', 'clients', 'appointments', 'tickets', 'monthly_plans', 'video_playlist', 'promotions'];
        for (const t of tables) db().prepare(`DELETE FROM ${t}`).run();
        db().prepare("PRAGMA foreign_keys = ON").run();
      }
    });

    tx();
    io.emit('sync_needed', { reason: 'admin_reset' });
    res.json({ success: true, message: "Reset ejecutado con éxito" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================================================================
// SEND EMAILS (Webhook)
// =================================================================

app.post('/api/send-cash-report', (req, res) => {
  const { branchId, reportData } = req.body;
  try {
    const branch = db().prepare("SELECT webhook_url, report_email, name FROM branches WHERE id = ?").get(branchId);
    if (!branch) return res.status(404).json({ success: false, error: 'Sucursal no encontrada' });

    const configRow = db().prepare("SELECT webhook_url FROM app_config LIMIT 1").get();
    const targetWebhook = branch.webhook_url || (configRow ? configRow.webhook_url : null);

    if (!targetWebhook) return res.status(400).json({ success: false, error: 'No hay webhook configurado' });
    if (!branch.report_email) return res.status(400).json({ success: false, error: 'No hay correo configurado para reportes' });

    fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cashReport', email: branch.report_email, branchName: branch.name, reportData })
    }).then(r => r.ok ? res.json({ success: true }) : res.status(500).json({ success: false }))
      .catch(() => res.status(500).json({ success: false }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/send-ticket', async (req, res) => {
  const { branchId, ticketData, email } = req.body;
  try {
    const branch = db().prepare("SELECT webhook_url, name FROM branches WHERE id = ?").get(branchId);
    const configRow = db().prepare("SELECT webhook_url FROM app_config LIMIT 1").get();
    const targetWebhook = branch?.webhook_url || configRow?.webhook_url;
    if (!targetWebhook) return res.status(400).json({ success: false, error: 'No hay webhook configurado' });

    const webhookRes = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ticket', email, branchName: branch?.name, ticketData })
    });
    res.json({ success: webhookRes.ok });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), database: 'sqlite' });
});

// =================================================================
// SOCKET.IO
// =================================================================

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.emit('config_init', currentConfig);

  socket.on('join_branch', (branchId) => {
    socket.join(`branch_${branchId}`);
  });
});

// =================================================================
// AUTO-CLOSE TASK (every 60s)
// =================================================================

setInterval(() => {
  try {
    const expiredSessions = db().prepare(`
      SELECT s.id, s.branch_id, b.name as branchName 
      FROM cash_sessions s 
      JOIN branches b ON s.branch_id = b.id 
      WHERE s.closed_at IS NULL 
      AND b.auto_close_enabled = 1
      AND time('now', 'localtime') >= b.auto_close_time
      AND s.opened_at < date('now', 'localtime') || ' ' || b.auto_close_time
    `).all();

    for (const session of expiredSessions) {
      const totals = db().prepare(`
        SELECT 
          COUNT(DISTINCT s.id) as operations_count,
          COALESCE(SUM(s.total), 0) as total_sales,
          COALESCE(SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END), 0) as total_cash,
          COALESCE(SUM(CASE WHEN p.method = 'card' THEN p.amount ELSE 0 END), 0) as total_card,
          COALESCE(SUM(CASE WHEN p.method = 'transfer' THEN p.amount ELSE 0 END), 0) as total_transfer,
          COALESCE(SUM(CASE WHEN p.method = 'bitcoin' THEN p.amount ELSE 0 END), 0) as total_bitcoin
        FROM sales s
        LEFT JOIN payments p ON s.id = p.sale_id
        WHERE s.branch_id = ? AND s.timestamp >= (SELECT opened_at FROM cash_sessions WHERE id = ?)
      `).get(session.branch_id, session.id);

      if (totals) {
        db().prepare(`
          UPDATE cash_sessions SET 
        closed_at = datetime('now', 'localtime'),
            total_sales = ?, total_cash = ?, total_card = ?, total_transfer = ?, total_bitcoin = ?,
            operations_count = ?
          WHERE id = ?
        `).run(totals.total_sales, totals.total_cash, totals.total_card, totals.total_transfer, totals.total_bitcoin, totals.operations_count, session.id);

        io.to(`branch_${session.branch_id}`).emit('sync_needed');
      }
    }
  } catch (e) { /* silent */ }
}, 60000);

// =================================================================
// FORCE LOGOUT AT 3:00 AM
// =================================================================

setInterval(() => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  if (`${h}:${m}` === "03:00") {
    io.emit('force_logout', { reason: 'daily_update' });
  }
}, 60000);

// =================================================================
// START
// =================================================================

const PORT = process.env.PORT || 3017;
httpServer.listen(PORT, () => {
  console.log(`
  =========================================
  🚀 OBVIO OS API CORRIENDO
  Puerto: ${PORT}
  Base de datos: SQLite (data/salon.db)
  =========================================
  `);
});
