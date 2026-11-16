/** IndexedDB blob write used by workspace hydrate (avoids circular imports). */

const DB_NAME = "docsaas_docs_files";
const BLOB_STORE = "blobs";

function openDocsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function putBlobFromFile(key: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const db = await openDocsDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.objectStore(BLOB_STORE).put(
      {
        name: file.name,
        type: file.type || "application/octet-stream",
        buffer,
      },
      key,
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
  db.close();
}
