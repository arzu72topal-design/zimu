import { openDB } from 'idb';
import { saveUserData, loadUserData } from './firebase.js';

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

export { DEFAULT_DATA };

// Local Storage
export async function loadLocalData() {
  try {
    const db = await getDB();
    const data = await db.get(STORE, 'main');
    if (!data) return { ...DEFAULT_DATA };
    return { ...DEFAULT_DATA, ...data };
  } catch (err) {
    console.error('DB load error:', err);
    try {
      const ls = localStorage.getItem('zimu-backup');
      if (ls) return { ...DEFAULT_DATA, ...JSON.parse(ls) };
    } catch {}
    return { ...DEFAULT_DATA };
  }
}

export async function saveLocalData(data) {
  try {
    const db = await getDB();
    await db.put(STORE, data, 'main');
    try { localStorage.setItem('zimu-backup', JSON.stringify(data)); } catch {}
  } catch (err) {
    console.error('DB save error:', err);
    try { localStorage.setItem('zimu-backup', JSON.stringify(data)); } catch {}
  }
}

// Combined: Load (local + cloud)
export async function loadData(userId) {
  const localData = await loadLocalData();
  if (!userId) return localData;
  try {
    const cloudData = await loadUserData(userId);
    if (cloudData) {
      const localTime = localData._updatedAt || 0;
      const cloudTime = cloudData.updatedAt || 0;
      if (cloudTime > localTime) {
        const merged = { ...DEFAULT_DATA, ...cloudData };
        delete merged.updatedAt;
        await saveLocalData(merged);
        return merged;
      }
    }
  } catch (err) {
    console.error('Cloud load error:', err);
  }
  return localData;
}

// Combined: Save (local + cloud)
export async function saveData(data, userId) {
  const dataWithTime = { ...data, _updatedAt: Date.now() };
  await saveLocalData(dataWithTime);
  if (userId) {
    try {
      const cloudData = { ...data };
      delete cloudData._updatedAt;
      await saveUserData(userId, cloudData);
    } catch (err) {
      console.error('Cloud save error:', err);
    }
  }
}

// Export / Import
export async function exportData(userId) {
  const data = await loadData(userId);
  const cleanData = { ...data };
  delete cleanData._updatedAt;
  const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
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
        const valid = imported.tasks && imported.events && imported.sports && imported.projects && imported.notes;
        if (!valid) throw new Error('Gecersiz dosya formati');
        const merged = { ...DEFAULT_DATA, ...imported };
        resolve(merged);
      } catch (err) {
        reject(new Error('Dosya okunamadi: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadi'));
    reader.readAsText(file);
  });
}
