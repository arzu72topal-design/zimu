import { openDB } from 'idb';

const DB_NAME = 'zimu';
const DB_VERSION = 1;
const STORE = 'app-data';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

const DEFAULT_DATA = {
  tasks: [],
  events: [],
  sports: [],
  projects: [],
  notes: [],
  settings: {
    notifications: false,
    reminderMinutes: 15,
  },
};

export async function loadData() {
  try {
    const db = await getDB();
    const data = await db.get(STORE, 'main');
    if (!data) return { ...DEFAULT_DATA };
    return { ...DEFAULT_DATA, ...data };
  } catch (err) {
    console.error('DB load error:', err);
    // Fallback to localStorage
    try {
      const ls = localStorage.getItem('zimu-backup');
      if (ls) return { ...DEFAULT_DATA, ...JSON.parse(ls) };
    } catch {}
    return { ...DEFAULT_DATA };
  }
}

export async function saveData(data) {
  try {
    const db = await getDB();
    await db.put(STORE, data, 'main');
    // Also save to localStorage as backup
    try { localStorage.setItem('zimu-backup', JSON.stringify(data)); } catch {}
  } catch (err) {
    console.error('DB save error:', err);
    // Fallback to localStorage
    try { localStorage.setItem('zimu-backup', JSON.stringify(data)); } catch {}
  }
}

export async function exportData() {
  const data = await loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zimu-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // Validate structure
        const valid = imported.tasks && imported.events && imported.sports && imported.projects && imported.notes;
        if (!valid) throw new Error('Geçersiz dosya formatı');
        const merged = { ...DEFAULT_DATA, ...imported };
        await saveData(merged);
        resolve(merged);
      } catch (err) {
        reject(new Error('Dosya okunamadı: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsText(file);
  });
}
