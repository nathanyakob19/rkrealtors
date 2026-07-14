import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Memory cache of database tables
let dbInstance = null;
let writeQueue = Promise.resolve();

class JsonDatabase {
  constructor() {
    this.data = {
      users: [],
      properties: [],
      visits: [],
      bookings: [],
      documents: [],
      favorites: []
    };
  }

  async init() {
    try {
      const exists = await fs.access(DB_FILE).then(() => true).catch(() => false);
      if (exists) {
        const fileContent = await fs.readFile(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        await this.save();
      }
    } catch (error) {
      console.error('Failed to initialize JSON database:', error);
    }
  }

  async save() {
    // Queue writes sequentially to prevent file corruption
    writeQueue = writeQueue.then(async () => {
      try {
        await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
        await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error writing to JSON database:', error);
      }
    });
    return writeQueue;
  }

  // --- CRUD API ---
  get(table) {
    return this.data[table] || [];
  }

  find(table, predicate) {
    return this.get(table).find(predicate);
  }

  filter(table, predicate) {
    return this.get(table).filter(predicate);
  }

  async insert(table, record) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    const tableData = this.data[table];
    const newRecord = {
      id: tableData.length > 0 ? Math.max(...tableData.map(r => typeof r.id === 'number' ? r.id : 0)) + 1 : 1,
      createdAt: new Date().toISOString(),
      ...record
    };
    tableData.push(newRecord);
    await this.save();
    return newRecord;
  }

  async update(table, id, updates) {
    const tableData = this.data[table] || [];
    const index = tableData.findIndex(r => r.id === Number(id) || r.id === id);
    if (index === -1) return null;

    tableData[index] = {
      ...tableData[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return tableData[index];
  }

  async delete(table, id) {
    const tableData = this.data[table] || [];
    const index = tableData.findIndex(r => r.id === Number(id) || r.id === id);
    if (index === -1) return false;

    tableData.splice(index, 1);
    await this.save();
    return true;
  }
}

export async function getDb() {
  if (!dbInstance) {
    dbInstance = new JsonDatabase();
    await dbInstance.init();
  }
  return dbInstance;
}
