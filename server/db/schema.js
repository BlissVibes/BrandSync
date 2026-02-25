const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'brandsync.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_name TEXT,
      image_url TEXT,
      category TEXT,
      platform TEXT CHECK(platform IN ('Twitch','YouTube','Both')) DEFAULT 'Both',
      org TEXT,
      added_date TEXT NOT NULL DEFAULT (date('now')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      categories TEXT NOT NULL DEFAULT '[]',
      parent_categories TEXT NOT NULL DEFAULT '[]',
      primary_category TEXT,
      added_date TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS client_brand_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      status TEXT CHECK(status IN ('active','ended')) DEFAULT 'active',
      start_date TEXT,
      end_date TEXT,
      end_reason TEXT,
      end_reason_source_url TEXT,
      is_public_end INTEGER DEFAULT 0,
      ended_by TEXT CHECK(ended_by IN ('client','brand','mutual','unknown')) DEFAULT 'unknown'
    );

    CREATE TABLE IF NOT EXISTS seo_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL,
      entity_type TEXT CHECK(entity_type IN ('client','brand')) NOT NULL,
      keyword TEXT NOT NULL,
      search_volume INTEGER DEFAULT 0,
      trend_data TEXT DEFAULT '[]',
      last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS controversies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      summary TEXT,
      source_url TEXT,
      date_found TEXT NOT NULL DEFAULT (date('now')),
      date_occurred TEXT,
      severity TEXT CHECK(severity IN ('low','medium','high','critical')) DEFAULT 'medium',
      category TEXT,
      relevance_to_brands TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS sponsorship_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      brand_category TEXT,
      status TEXT CHECK(status IN ('active','ended','rumored')) DEFAULT 'active',
      start_date TEXT,
      end_date TEXT,
      end_reason TEXT,
      source_url TEXT,
      is_verified INTEGER DEFAULT 1
    );
  `);

  return database;
}

module.exports = { getDb, initSchema };
