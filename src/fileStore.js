/* ── fileStore.js — IndexedDB file storage for Projelerim ── */

const DB_NAME = "projelerim-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save file blob to IndexedDB
export async function saveFile(projectId, fileId, file) {
  const db = await openDB();
  const arrayBuffer = await file.arrayBuffer();
  const record = {
    id: `${projectId}_${fileId}`,
    projectId,
    fileId,
    name: file.name,
    type: file.type,
    size: file.size,
    data: arrayBuffer,
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

// Get file from IndexedDB
export async function getFile(projectId, fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(`${projectId}_${fileId}`);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Delete file from IndexedDB
export async function deleteFile(projectId, fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(`${projectId}_${fileId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Delete all files for a project
export async function deleteProjectFiles(projectId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (cursor.value.projectId === projectId) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get total storage used by a project (in bytes)
export async function getProjectStorageSize(projectId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    let total = 0;
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (cursor.value.projectId === projectId) total += cursor.value.size || 0;
        cursor.continue();
      } else {
        resolve(total);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Create a blob URL for preview/download
export function createBlobUrl(record) {
  if (!record || !record.data) return null;
  const blob = new Blob([record.data], { type: record.type });
  return URL.createObjectURL(blob);
}

// Download a file
export async function downloadFile(projectId, fileId, fileName) {
  const record = await getFile(projectId, fileId);
  if (!record) return;
  const blob = new Blob([record.data], { type: record.type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || record.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
