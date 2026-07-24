import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'salon.db');

let db;

export function getDb() {
  if (db) return db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema();
  seedIfEmpty();
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      salon_name TEXT DEFAULT 'Mi Salón',
      salon_address TEXT,
      salon_phone TEXT,
      ticket_footer TEXT,
      logo_url TEXT,
      webhook_url TEXT,
      ticker_message TEXT DEFAULT 'Bienvenidos.',
      ticker_speed INTEGER DEFAULT 1,
      video_source TEXT DEFAULT 'youtube',
      youtube_video_id TEXT DEFAULT '5qap5aO4i9A',
      ticket_size TEXT DEFAULT '80mm',
      loyalty_enabled INTEGER DEFAULT 1,
      loyalty_points_per_visit REAL DEFAULT 1.00,
      loyalty_redemption_threshold INTEGER DEFAULT 5,
      loyalty_redemption_value REAL DEFAULT 5.00,
      loyalty_referral_bonus REAL DEFAULT 2.00,
      hidden_panels TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      webhook_url TEXT,
      report_email TEXT,
      active INTEGER DEFAULT 1,
      has_reception INTEGER DEFAULT 1,
      default_monthly_goal REAL DEFAULT 5000.00,
      default_product_goal_percent REAL DEFAULT 10.00,
      default_working_days INTEGER DEFAULT 26,
      auto_close_time TEXT DEFAULT '22:00:00',
      auto_close_enabled INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('superadmin','admin','reception','estilista','display','cashier','ventas_caja')),
      pin TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      branch_id TEXT,
      can_do_pos INTEGER DEFAULT 0,
      permissions_overrides TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_plans (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      goal REAL NOT NULL,
      product_goal_percent REAL DEFAULT 10.00,
      working_days INTEGER DEFAULT 26,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      UNIQUE(branch_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS video_playlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT DEFAULT 'link',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('percentage','fixed_discount')),
      value REAL NOT NULL,
      trigger_type TEXT NOT NULL,
      days_active TEXT,
      hour_start TEXT,
      hour_end TEXT,
      start_date TEXT,
      end_date TEXT,
      apply_to TEXT DEFAULT 'all',
      specific_item_id TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      visits INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      birth_date TEXT,
      referred_by TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      registration_branch_id TEXT,
      FOREIGN KEY (referred_by) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (registration_branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('service','product','combo')),
      price REAL NOT NULL,
      category_id TEXT,
      active INTEGER DEFAULT 1,
      cost REAL DEFAULT 0.00,
      combo_definition TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS branch_stock (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      average_cost REAL DEFAULT 0.00,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES catalog(id) ON DELETE CASCADE,
      UNIQUE(branch_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      full_code TEXT NOT NULL,
      type TEXT NOT NULL,
      client_name TEXT,
      client_id TEXT,
      status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','serving','completed','cancelled')),
      barber_id TEXT,
      chair TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      ticket_id TEXT,
      client_id TEXT,
      barber_id TEXT,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0.00,
      total REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      points_earned INTEGER DEFAULT 0,
      points_used INTEGER DEFAULT 0,
      applied_promotion_id TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (applied_promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id TEXT NOT NULL,
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL,
      previous_stock INTEGER,
      new_stock INTEGER,
      reason TEXT,
      related_branch_id TEXT,
      date TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'completed',
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES catalog(id)
    );

    CREATE TABLE IF NOT EXISTS cash_sessions (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      opening_amount REAL DEFAULT 0.00,
      opened_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT,
      opened_by TEXT,
      total_sales REAL DEFAULT 0,
      total_cash REAL DEFAULT 0,
      total_card REAL DEFAULT 0,
      total_transfer REAL DEFAULT 0,
      total_bitcoin REAL DEFAULT 0,
      services_total REAL DEFAULT 0,
      products_total REAL DEFAULT 0,
      combos_total REAL DEFAULT 0,
      operations_count INTEGER DEFAULT 0,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (opened_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('CHECK_IN','CHECK_OUT')),
      timestamp TEXT DEFAULT (datetime('now','localtime')),
      latitude REAL,
      longitude REAL,
      within_geofence INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      client_id TEXT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      barber_id TEXT,
      service_type TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

function addMissingColumns() {
  const cols = db.prepare("PRAGMA table_info(app_config)").all().map(function(c) { return c.name; });
  if (!cols.includes('hidden_panels')) {
    db.prepare("ALTER TABLE app_config ADD COLUMN hidden_panels TEXT DEFAULT '[]'").run();
  }
  if (!cols.includes('latitude')) {
    db.prepare("ALTER TABLE app_config ADD COLUMN latitude REAL DEFAULT 0").run();
    db.prepare("ALTER TABLE app_config ADD COLUMN longitude REAL DEFAULT 0").run();
    db.prepare("ALTER TABLE app_config ADD COLUMN geofence_radius INTEGER DEFAULT 10").run();
  }
  db.prepare("PRAGMA wal_checkpoint(TRUNCATE)").run();
}

function seedIfEmpty() {
  addMissingColumns();
  const count = db.prepare("SELECT COUNT(*) as c FROM app_config").get();
  if (count.c > 0) return;

  const seed = db.transaction(() => {
    db.prepare("INSERT INTO app_config (id) VALUES (1)").run();
    db.prepare("INSERT INTO categories (id, name) VALUES ('c1', 'SERVICIOS'), ('c2', 'PRODUCTOS'), ('c3', 'COMBOS')").run();
    db.prepare("INSERT INTO branches (id, name, active, has_reception) VALUES ('b_main', 'SUCURSAL CENTRAL', 1, 1)").run();
    db.prepare("INSERT INTO users (id, name, username, role, pin, active, can_do_pos) VALUES ('u_admin', 'SUPER ADMINISTRADOR', 'admin', 'superadmin', '020518', 1, 1)").run();
  });

  seed();
}

export function closeDb() {
  if (db) { db.close(); db = null; }
}
