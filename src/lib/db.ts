const DB_NAME = 'hush-ai-db'
const DB_VERSION = 1
const STORE_NAME = 'settings'

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? (result.value as T) : null)
    }
  })
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ key, value })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 设置 key 常量
export const DB_KEYS = {
  API_KEY_CHAT: 'apiKey.deepseek.chat',
  API_KEY_REASONER: 'apiKey.deepseek.reasoner',
  API_BASE_CHAT: 'apiBase.deepseek.chat',
  API_BASE_REASONER: 'apiBase.deepseek.reasoner',
  API_KEY_QWEN: 'apiKey.qwen',
  API_BASE_QWEN: 'apiBase.qwen',
  API_KEY_QWEN_IMAGE: 'apiKey.qwen.image',
  API_BASE_QWEN_IMAGE: 'apiBase.qwen.image',
  API_KEY_GLM: 'apiKey.glm',
  API_BASE_GLM: 'apiBase.glm',
  MODEL: 'model',
  CHATS: 'chats',
} as const
