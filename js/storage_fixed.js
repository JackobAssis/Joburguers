// ===============================================
// STORAGE.JS - Sistema de Armazenamento Melhorado
// ===============================================

import { firebaseGet, firebaseAdd, firebaseUpdate, firebaseDelete, firebaseSet, cache, isOnline } from './firebase.js';
import { COLLECTIONS } from './firebase.js';

// Performance monitoring
const performanceLog = {
    operations: [],
    log(operation, duration, success) {
        this.operations.push({
            operation,
            duration,
            success,
            timestamp: new Date().toISOString()
        });
        // Keep only last 100 operations
        if (this.operations.length > 100) {
            this.operations = this.operations.slice(-100);
        }
    },
    getStats() {
        const total = this.operations.length;
        const successful = this.operations.filter(op => op.success).length;
        const avgDuration = this.operations.reduce((sum, op) => sum + op.duration, 0) / total;
        return {
            totalOperations: total,
            successRate: (successful / total * 100).toFixed(2) + '%',
            averageDuration: avgDuration.toFixed(2) + 'ms'
        };
    }
};

// Enhanced error handling wrapper
async function withPerformanceLog(operation, operationName) {
    const startTime = performance.now();
    try {
        const result = await operation();
        const duration = performance.now() - startTime;
        performanceLog.log(operationName, duration, true);
        
        if (duration > 3000) {
            console.warn(`[Storage] Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
    } catch (error) {
        const duration = performance.now() - startTime;
        performanceLog.log(operationName, duration, false);
        console.error(`[Storage] Operation failed: ${operationName}`, error);
        throw error;
    }
}

// Constants
const KEY_PRODUCTS = 'joburguers_products_v1';
const KEY_CLIENTS = 'joburguers_clients_v1';
const KEY_PROMOTIONS = 'joburguers_promotions_v1';
const KEY_REDEEMS = 'joburguers_redeems_v1';
const KEY_SETTINGS = 'joburguers_settings_v1';
const KEY_SESSION = 'joburguers_session_v1';
const KEY_ADMIN = 'joburguers_admin_v1';

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
}

// Local storage functions
async function read(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (err) {
        console.error('storage.read error', err);
        return null;
    }
}

async function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error('storage.write error', err);
        return false;
    }
}

async function readLocal(key) {
    return await read(key);
}

async function writeLocal(key, value) {
    return await write(key, value);
}

// Main initialization function
export async function initializeStorage() {
    return withPerformanceLog(async () => {
        try {
            console.info('[Storage] Initializing storage system...');
            
            if (!isOnline) {
                console.warn('[Storage] Starting in offline mode');
            }
            
            // Initialize default settings
            const settings = await firebaseGet(COLLECTIONS.SETTINGS, 'main');
            if (!settings) {
                console.info('[Storage] Creating default settings...');
                await firebaseSet(COLLECTIONS.SETTINGS, 'main', {
                    pointsPerReal: 0.1,
                    bonusRegistration: 50,
                    referralBonus: 50,
                    levels: { bronze: 0, silver: 100, gold: 300, platinum: 500 },
                    storeName: 'Joburguers',
                    storeAddress: 'Rua Pasárgada, Três Marias - Carpina, PE',
                    storePhone: '(81) 98933-4497',
                    storeHours: 'Seg-Dom: 6:30h às 22h'
                });
            }

            // Initialize admin
            const admin = await firebaseGet(COLLECTIONS.ADMIN, 'main');
            if (!admin) {
                console.info('[Storage] Creating default admin...');
                await firebaseSet(COLLECTIONS.ADMIN, 'main', {
                    id: 'admin_1',
                    name: 'Administrador',
                    phone: '11999999999',
                    password: 'admin123',
                    createdAt: new Date().toISOString()
                });
            }

            if ((await readLocal(KEY_SESSION)) === null) {
                await writeLocal(KEY_SESSION, null);
            }
            
            console.info('[Storage] Storage system initialized successfully');
            return true;
            
        } catch (err) {
            console.error('initializeStorage error, falling back to localStorage', err);
            
            // Fallback initialization
            if ((await readLocal(KEY_PRODUCTS)) === null) await writeLocal(KEY_PRODUCTS, []);
            if ((await readLocal(KEY_CLIENTS)) === null) await writeLocal(KEY_CLIENTS, []);
            if ((await readLocal(KEY_PROMOTIONS)) === null) {
                const examplePromotions = [
                    {
                        id: generateId('promotion'),
                        name: 'Combo Mega Burguer',
                        description: 'Hambúrguer artesanal de 200g com queijo, alface, tomate, cebola roxa e molho especial + Batata frita + Refrigerante 350ml. Uma refeição completa para matar a fome!',
                        price: 18.90,
                        photo: null,
                        instagramLink: null,
                        active: true,
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        terms: 'Válido apenas para delivery. Não cumulativo com outras promoções.',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: generateId('promotion'),
                        name: 'Terça do X-Tudo',
                        description: 'Toda terça-feira: X-Tudo completo com hamburger, ovo, bacon, queijo, presunto, alface, tomate e molho especial por um preço especial!',
                        price: 15.50,
                        photo: null,
                        instagramLink: null,
                        active: true,
                        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                        terms: 'Promoção válida apenas às terças-feiras. Disponível para balcão e delivery.',
                        createdAt: new Date().toISOString()
                    }
                ];
                await writeLocal(KEY_PROMOTIONS, examplePromotions);
            }
            if ((await readLocal(KEY_REDEEMS)) === null) await writeLocal(KEY_REDEEMS, []);
            if ((await readLocal(KEY_SETTINGS)) === null) {
                await writeLocal(KEY_SETTINGS, {
                    pointsPerReal: 0.1,
                    bonusRegistration: 50,
                    referralBonus: 50,
                    levels: { bronze: 0, silver: 100, gold: 300, platinum: 500 },
                    storeName: 'Joburguers',
                    storeAddress: 'Rua Pasárgada, Três Marias - Carpina, PE',
                    storePhone: '(81) 98933-4497',
                    storeHours: 'Seg-Dom: 6:30h às 22h'
                });
            }
            
            console.warn('[Storage] Initialized in offline mode with localStorage fallback');
            return true;
        }
    }, 'initializeStorage');
}

// ------------------- Performance and Diagnostics -------------------
export function getStorageStats() {
    return {
        performance: performanceLog.getStats(),
        cache: {
            entries: cache.data.size,
            memoryUsage: JSON.stringify([...cache.data.entries()]).length + ' bytes'
        },
        network: {
            isOnline,
            lastCheck: new Date().toISOString()
        }
    };
}

export function clearStorageCache() {
    cache.clear();
    console.info('[Storage] Cache cleared');
}

export async function validateDataIntegrity() {
    const issues = [];
    
    try {
        const products = await getAllProducts();
        const invalidProducts = products.filter(p => !p.name || p.price === undefined);
        if (invalidProducts.length > 0) {
            issues.push(`${invalidProducts.length} products with missing name/price`);
        }
        
        const clients = await getAllClients();
        const invalidClients = clients.filter(c => !c.phone);
        if (invalidClients.length > 0) {
            issues.push(`${invalidClients.length} clients with missing phone`);
        }
        
        return {
            valid: issues.length === 0,
            issues,
            summary: {
                products: products.length,
                clients: clients.length,
                checkedAt: new Date().toISOString()
            }
        };
        
    } catch (error) {
        return {
            valid: false,
            issues: [`Validation error: ${error.message}`],
            summary: null
        };
    }
}

// ------------------- Session -------------------
export async function getCurrentSession() {
    return await read(KEY_SESSION);
}

export async function setCurrentSession(sessionObj) {
    await write(KEY_SESSION, sessionObj);
    return sessionObj;
}

export async function clearSession() {
    await write(KEY_SESSION, null);
    return true;
}

// Export performance log
export { performanceLog };