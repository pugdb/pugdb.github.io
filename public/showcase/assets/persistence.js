/**
 * IndexedDB Persistence Layer for PugDB WASM
 * Provides automatic save/load functionality for WASM data
 */

class IndexedDBPersistence {
    constructor(dbName = 'pugdb-showcase', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.storeName = 'keyvalue';
        this.db = null;
        this.ready = false;
    }

    /**
     * Initialize IndexedDB connection
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not available, persistence disabled');
                this.ready = false;
                resolve(false);
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                this.ready = false;
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.ready = true;
                console.log('✅ IndexedDB persistence initialized');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    objectStore.createIndex('key', 'key', { unique: true });
                    console.log('Created IndexedDB object store:', this.storeName);
                }
            };
        });
    }

    /**
     * Save all data from WASM instance to IndexedDB
     */
    async saveAll(wasmInstance) {
        if (!this.ready || !wasmInstance) {
            return false;
        }

        try {
            // Get all keys from WASM
            const keysJson = wasmInstance.scan('');
            const keys = JSON.parse(keysJson);

            // Get all values
            const data = [];
            for (const key of keys) {
                const value = wasmInstance.get(key);
                if (value !== null && value !== undefined) {
                    data.push({ key, value });
                }
            }

            // Save to IndexedDB
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            // Clear existing data
            await new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = () => reject(clearRequest.error);
            });

            // Save all key-value pairs
            for (const item of data) {
                await new Promise((resolve, reject) => {
                    const putRequest = store.put(item);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                });
            }

            console.log(`💾 Saved ${data.length} key-value pair(s) to IndexedDB`);
            
            // Verify the save by checking count
            const verifyCount = await this.count();
            if (verifyCount !== data.length) {
                console.warn(`⚠️ Save verification: Expected ${data.length} items, found ${verifyCount}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            return false;
        }
    }

    /**
     * Load all data from IndexedDB to WASM instance
     */
    async loadAll(wasmInstance) {
        if (!this.ready || !wasmInstance) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const items = request.result;
                    let loadedCount = 0;

                    // Load each item into WASM
                    for (const item of items) {
                        try {
                            wasmInstance.put(item.key, item.value);
                            loadedCount++;
                        } catch (error) {
                            console.warn(`Failed to load key ${item.key}:`, error);
                        }
                    }

                    if (loadedCount > 0) {
                        console.log(`📂 Loaded ${loadedCount} key-value pair(s) from IndexedDB`);
                    }
                    resolve(loadedCount);
                };

                request.onerror = () => {
                    console.error('Error loading from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error loading from IndexedDB:', error);
            return 0;
        }
    }

    /**
     * Save a single key-value pair
     */
    async save(key, value) {
        if (!this.ready) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve, reject) => {
                const putRequest = store.put({ key, value });
                putRequest.onsuccess = () => {
                    resolve(true);
                };
                putRequest.onerror = () => {
                    console.error('Error saving key to IndexedDB:', putRequest.error);
                    reject(putRequest.error);
                };
            });
        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            return false;
        }
    }

    /**
     * Delete a key from IndexedDB
     */
    async delete(key) {
        if (!this.ready) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve, reject) => {
                const deleteRequest = store.delete(key);
                deleteRequest.onsuccess = () => {
                    resolve(true);
                };
                deleteRequest.onerror = () => {
                    console.error('Error deleting key from IndexedDB:', deleteRequest.error);
                    reject(deleteRequest.error);
                };
            });
        } catch (error) {
            console.error('Error deleting from IndexedDB:', error);
            return false;
        }
    }

    /**
     * Clear all persisted data
     */
    async clear() {
        if (!this.ready) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                    console.log('🗑️ Cleared all persisted data from IndexedDB');
                    resolve(true);
                };
                clearRequest.onerror = () => {
                    console.error('Error clearing IndexedDB:', clearRequest.error);
                    reject(clearRequest.error);
                };
            });
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            return false;
        }
    }

    /**
     * Get count of persisted items
     */
    async count() {
        if (!this.ready) {
            return 0;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const countRequest = store.count();

            return new Promise((resolve, reject) => {
                countRequest.onsuccess = () => {
                    resolve(countRequest.result);
                };
                countRequest.onerror = () => {
                    reject(countRequest.error);
                };
            });
        } catch (error) {
            console.error('Error counting IndexedDB items:', error);
            return 0;
        }
    }

    /**
     * Check if persistence is available
     */
    isAvailable() {
        return this.ready && this.db !== null;
    }
}

// Create global instance
const persistenceInstance = new IndexedDBPersistence();

// Initialize persistence (non-blocking)
persistenceInstance.init().catch(err => {
    console.warn('Failed to initialize persistence:', err);
});

/**
 * Get the persistence instance
 */
window.getPersistence = function() {
    return persistenceInstance;
};

/**
 * Save all data from WASM instance to persistence
 * @param {boolean} force - Force immediate save (optional)
 */
window.saveToPersistence = async function(force = false) {
    if (!persistenceInstance.isAvailable()) {
        return false;
    }

    // Get WASM instance
    const wasmInstance = window.getWASMInstance ? window.getWASMInstance() : null;
    if (!wasmInstance) {
        console.warn('WASM instance not available for persistence save');
        return false;
    }

    return await persistenceInstance.saveAll(wasmInstance);
};

/**
 * Clear all persisted data
 */
window.clearPersistence = async function() {
    if (!persistenceInstance.isAvailable()) {
        return false;
    }

    return await persistenceInstance.clear();
};

/**
 * Load all data from persistence to WASM instance
 * This is called automatically when WASM is initialized
 */
window.loadFromPersistence = async function() {
    if (!persistenceInstance.isAvailable()) {
        return 0;
    }

    // Get WASM instance
    const wasmInstance = window.getWASMInstance ? window.getWASMInstance() : null;
    if (!wasmInstance) {
        console.warn('WASM instance not available for persistence load');
        return 0;
    }

    return await persistenceInstance.loadAll(wasmInstance);
};

// Export class for advanced usage
window.IndexedDBPersistence = IndexedDBPersistence;
