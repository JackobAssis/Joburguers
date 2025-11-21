// ------------------- Pontos até o próximo nível -------------------
export async function getPointsUntilNextLevel(currentPoints) {
    const settings = await getSettings();
    const levels = settings.levels || { bronze: 0, silver: 100, gold: 300, platinum: 500 };
    if (currentPoints < levels.silver) {
        return levels.silver - currentPoints;
    } else if (currentPoints < levels.gold) {
        return levels.gold - currentPoints;
    } else if (currentPoints < levels.platinum) {
        return levels.platinum - currentPoints;
    }
    return 0;
}
// ------------------- Rótulo do Nível -------------------
export function getLevelLabel(level) {
    const labels = {
        bronze: 'Bronze 🥉',
        silver: 'Prata 🥈',
        gold: 'Ouro 🥇',
        platinum: 'Platina 💎'
    };
    return labels[level] || 'Bronze 🥉';
}
// ------------------- Transações do Cliente -------------------
export async function getClientTransactions(clientId) {
    try {
        let transactions = await getAllTransactions();

        // Normalize to array if something returned an object or unexpected shape
        if (!Array.isArray(transactions)) {
            console.warn('[storage] getClientTransactions: transactions is not an array, normalizing...', transactions);
            if (transactions && typeof transactions === 'object') {
                // Convert object map to array
                transactions = Object.keys(transactions).map(k => transactions[k]);
            } else {
                transactions = [];
            }
        }

        const filtered = transactions.filter(t => t && t.clientId === clientId);
        return Array.isArray(filtered) ? filtered.reverse() : [];
    } catch (err) {
        console.error('[storage] getClientTransactions error', err);
        return [];
    }
}
// ------------------- Níveis de Cliente -------------------
export async function calculateLevel(points) {
    const settings = await getSettings();
    const levels = settings.levels || { bronze: 0, silver: 100, gold: 300, platinum: 500 };
    if (points >= levels.platinum) return 'platinum';
    if (points >= levels.gold) return 'gold';
    if (points >= levels.silver) return 'silver';
    return 'bronze';
}
// ------------------- Products by Category -------------------
export async function getProductsByCategory(category) {
    const products = await getAllProducts();
    if (category === 'todos') return products;
    return products.filter(p => p.category === category);
}
// ------------------- Active Promotions -------------------
export async function getActivePromotions() {
    const all = await getAllPromotions();
    return all.filter(p => p.active !== false);
}
// ------------------- Transactions -------------------
export async function recordTransaction(transactionData) {
    // Gera um id único para a transação
    const id = generateId('tx');
    const tx = {
        id,
        ...transactionData,
        timestamp: new Date().toISOString()
    };
    // Salva no Firestore se possível, senão localStorage
    try {
        // Se houver coleção de transações no Firestore
        await firebaseAdd(COLLECTIONS.TRANSACTIONS, tx);
    } catch (err) {
        // Fallback localStorage
        const arr = await readLocal(KEY_TRANSACTIONS) || [];
        arr.push(tx);
        await writeLocal(KEY_TRANSACTIONS, arr);
    }
    return tx;
}
// storage.js
// Backend simples usando localStorage. Todas as funções são async e retornam valores consistentes.
// IDs têm prefixos por tipo: product_, client_, promotion_, redeem_, tx_

import { firebaseGet, firebaseAdd, firebaseUpdate, firebaseDelete, firebaseSet, isOnline, cache } from './firebase.js';
import { sanitizePhone } from './utils.js';

// Performance logging wrapper
async function withPerformanceLog(operation, operationName = 'Unknown') {
    const startTime = performance.now();
    try {
        const result = await operation();
        const duration = performance.now() - startTime;
        console.info(`[Performance] ${operationName} completed in ${duration.toFixed(2)}ms`);
        return result;
    } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`[Performance] ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
    }
}

const COLLECTIONS = {
    PRODUCTS: 'products',
    CLIENTS: 'clients',
    PROMOTIONS: 'promotions',
    REDEEMS: 'redeems',
    SETTINGS: 'settings',
    ADMIN: 'admin'
};

const KEY_PRODUCTS = 'joburguers_products_v1';
const KEY_CLIENTS = 'joburguers_clients_v1';
const KEY_PROMOTIONS = 'joburguers_promotions_v1';
const KEY_REDEEMS = 'joburguers_redeems_v1';
const KEY_SETTINGS = 'joburguers_settings_v1';
const KEY_TRANSACTIONS = 'joburguers_transactions_v1';
const KEY_SESSION = 'joburguers_session_v1';
const KEY_ADMIN = 'joburguers_admin_v1';

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
}

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

// Aliases for localStorage functions
async function readLocal(key) {
    return await read(key);
}

async function writeLocal(key, value) {
    return await write(key, value);
}

export async function initializeStorage() {
    return withPerformanceLog(async () => {
        try {
            console.info('[Storage] Initializing storage system...');
            
            // Check network connectivity
            if (!isOnline) {
                console.warn('[Storage] Starting in offline mode');
            }
            
            // Initialize default settings if missing
            const settings = await firebaseGet(COLLECTIONS.SETTINGS, 'main');
            if (!settings) {
                console.info('[Storage] Creating default settings...');
                await firebaseSet(COLLECTIONS.SETTINGS, 'main', {
                    pointsPerReal: 0.1,
                    bonusRegistration: 50,
                    referralBonus: 50,
                    levels: { bronze: 0, silver: 100, gold: 300, platinum: 500 },
                    storeName: 'Joburguers',
                    storeAddress: '',
                    storePhone: '',
                    storeHours: ''
                });
            }

            // Initialize admin if missing
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

            // Seed sample clients in Firestore if collection empty
            try {
                const existingClients = await firebaseGet(COLLECTIONS.CLIENTS) || [];
                if (!Array.isArray(existingClients) || existingClients.length === 0) {
                    console.info('[Storage] Seeding sample clients...');
                    const samples = [
                        {
                            name: 'Cliente Teste 1',
                            phone: '81999999001',
                            password: '1234',
                            points: 0,
                            level: 'bronze',
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            name: 'Cliente Teste 2',
                            phone: '81999999002',
                            password: '1234',
                            points: 150,
                            level: 'silver',
                            active: true,
                            createdAt: new Date().toISOString()
                        }
                    ];
                    for (const s of samples) {
                        try { 
                            await firebaseAdd(COLLECTIONS.CLIENTS, s); 
                        } catch(e) { 
                            console.warn('Seed client add failed', e); 
                        }
                    }
                    console.info('[Storage] Sample clients seeded successfully');
                }
            } catch (seedErr) {
                console.warn('Could not seed sample clients (permissions/network?):', seedErr);
            }

            // Keep session in localStorage for client-side state
            if ((await readLocal(KEY_SESSION)) === null) await writeLocal(KEY_SESSION, null);
            
            console.info('[Storage] Storage system initialized successfully');
            return true;
        } catch (err) {
            console.error('initializeStorage error, falling back to localStorage', err);
            // Fallback to localStorage initialization
            if ((await readLocal(KEY_PRODUCTS)) === null) await writeLocal(KEY_PRODUCTS, []);
            if ((await readLocal(KEY_CLIENTS)) === null) await writeLocal(KEY_CLIENTS, []);
            if ((await readLocal(KEY_PROMOTIONS)) === null) {
                // Criar promoções de exemplo
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
                    },
                    {
                        id: generateId('promotion'),
                        name: 'Família Feliz',
                        description: '4 Hamburguers + 1 Porção grande de batata frita + 2 Refrigerantes 600ml. Perfeito para compartilhar!',
                        price: 45.00,
                        photo: null,
                        instagramLink: null,
                        active: true,
                        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                        terms: 'Promoção válida para pedidos acima de R$ 40,00. Disponível para delivery e retirada.',
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
                    storeAddress: '',
                    storePhone: '',
                    storeHours: ''
                });
            }
            
            console.warn('[Storage] Initialized in offline mode with localStorage fallback');
            return true;
        }
    }, 'initializeStorage');
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

// ------------------- Products -------------------
export async function getAllProducts() {
    return withPerformanceLog(async () => {
        try {
            // Check if offline and try cache first
            if (!isOnline) {
                const cached = cache.get(COLLECTIONS.PRODUCTS);
                if (cached) {
                    console.info('[Storage] Using cached products (offline)');
                    return cached;
                }
            }
            
            const products = await firebaseGet(COLLECTIONS.PRODUCTS) || [];
            
            // Validate and clean data
            const validProducts = products.filter(p => 
                p && typeof p === 'object' && p.name && p.price !== undefined
            ).map(p => ({
                ...p,
                price: parseFloat(p.price) || 0,
                active: p.active !== false // default to true
            }));
            
            return validProducts;
        } catch (err) {
            console.error('getAllProducts Firebase error, falling back to localStorage', err);
            const arr = await readLocal(KEY_PRODUCTS);
            return Array.isArray(arr) ? arr : [];
        }
    }, 'getAllProducts');
}

export async function getProductById(id) {
    try {
        return await firebaseGet(COLLECTIONS.PRODUCTS, id);
    } catch (err) {
        console.error('getProductById Firebase error, falling back to localStorage', err);
        const all = await getAllProducts();
        return all.find(p => p.id === id) || null;
    }
}

export async function addProduct(product) {
    try {
        const created = { ...product, createdAt: new Date().toISOString() };
        const result = await firebaseAdd(COLLECTIONS.PRODUCTS, created);
        return result;
    } catch (err) {
        console.error('addProduct Firebase error, falling back to localStorage', err);
        const all = await getAllProducts();
        const id = generateId('product');
        const created = { id, createdAt: new Date().toISOString(), ...product };
        all.push(created);
        await writeLocal(KEY_PRODUCTS, all);
        return created;
    }
}

export async function updateProduct(id, updatedData) {
    try {
        const success = await firebaseUpdate(COLLECTIONS.PRODUCTS, id, updatedData);
        if (success) {
            return await getProductById(id);
        }
        return null;
    } catch (err) {
        console.error('updateProduct Firebase error, falling back to localStorage', err);
        const all = await getAllProducts();
        const idx = all.findIndex(p => p.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
        await writeLocal(KEY_PRODUCTS, all);
        return all[idx];
    }
}

export async function deleteProduct(id) {
    try {
        return await firebaseDelete(COLLECTIONS.PRODUCTS, id);
    } catch (err) {
        console.error('deleteProduct Firebase error, falling back to localStorage', err);
        let all = await getAllProducts();
        const before = all.length;
        all = all.filter(p => p.id !== id);
        await writeLocal(KEY_PRODUCTS, all);
        return all.length !== before;
    }
}



// ------------------- Promotions -------------------
export async function getAllPromotions() {
    try {
        return await firebaseGet(COLLECTIONS.PROMOTIONS) || [];
    } catch (err) {
        console.error('getAllPromotions Firebase error, falling back to localStorage', err);
        const arr = await readLocal(KEY_PROMOTIONS);
        return Array.isArray(arr) ? arr : [];
    }
}

export async function addPromotion(promo) {
    try {
        const created = { ...promo, createdAt: new Date().toISOString() };
        const result = await firebaseAdd(COLLECTIONS.PROMOTIONS, created);
        return result;
    } catch (err) {
        console.error('addPromotion Firebase error, falling back to localStorage', err);
        const all = await getAllPromotions();
        const id = generateId('promotion');
        const created = { id, createdAt: new Date().toISOString(), ...promo };
        all.push(created);
        await writeLocal(KEY_PROMOTIONS, all);
        return created;
    }
}

export async function updatePromotion(id, updatedData) {
    try {
        const success = await firebaseUpdate(COLLECTIONS.PROMOTIONS, id, updatedData);
        if (success) {
            return await firebaseGet(COLLECTIONS.PROMOTIONS, id);
        }
        return null;
    } catch (err) {
        console.error('updatePromotion Firebase error, falling back to localStorage', err);
        const all = await getAllPromotions();
        const idx = all.findIndex(p => p.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
        await writeLocal(KEY_PROMOTIONS, all);
        return all[idx];
    }
}

export async function deletePromotion(id) {
    try {
        return await firebaseDelete(COLLECTIONS.PROMOTIONS, id);
    } catch (err) {
        console.error('deletePromotion Firebase error, falling back to localStorage', err);
        let all = await getAllPromotions();
        const before = all.length;
        all = all.filter(p => p.id !== id);
        await writeLocal(KEY_PROMOTIONS, all);
        return all.length !== before;
    }
}

// ------------------- Clients -------------------
export async function getAllClients() {
    return withPerformanceLog(async () => {
        try {
            // Check offline cache first
            if (!isOnline) {
                const cached = cache.get(COLLECTIONS.CLIENTS);
                if (cached) {
                    console.info('[Storage] Using cached clients (offline)');
                    return cached;
                }
            }
            
            const clients = await firebaseGet(COLLECTIONS.CLIENTS) || [];
            
            // Validate and normalize client data
            const validClients = clients.filter(c => 
                c && typeof c === 'object' && c.phone
            ).map(c => ({
                ...c,
                points: parseInt(c.points) || 0,
                level: c.level || 'bronze',
                active: c.active !== false,
                createdAt: c.createdAt || new Date().toISOString()
            }));
            
            return validClients;
        } catch (err) {
            console.error('getAllClients Firebase error, falling back to localStorage', err);
            const arr = await readLocal(KEY_CLIENTS);
            return Array.isArray(arr) ? arr : [];
        }
    }, 'getAllClients');
}

export async function getClientById(id) {
    try {
        return await firebaseGet(COLLECTIONS.CLIENTS, id);
    } catch (err) {
        console.error('getClientById Firebase error, falling back to localStorage', err);
        const all = await getAllClients();
        return all.find(c => c.id === id) || null;
    }
}

export async function addClient(client) {
    try {
        const created = {
            name: client.name || '',
            phone: client.phone || '',
            email: client.email || '',
            password: client.password || null,
            points: client.points || 0,
            level: client.level || 'bronze',
            active: client.active !== undefined ? client.active : true,
            createdAt: new Date().toISOString()
        };
        const result = await firebaseAdd(COLLECTIONS.CLIENTS, created);
        return result;
    } catch (err) {
        console.warn('addClient Firebase error, falling back to localStorage', err);
        const all = await getAllClients();
        const id = generateId('client');
        const created = {
            id,
            name: client.name || '',
            phone: client.phone || '',
            email: client.email || '',
            password: client.password || null,
            points: client.points || 0,
            level: client.level || 'bronze',
            active: client.active !== undefined ? client.active : true,
            createdAt: new Date().toISOString()
        };
        all.push(created);
        await writeLocal(KEY_CLIENTS, all);
        return created;
    }
}

export async function updateClient(id, updatedData) {
    try {
        const success = await firebaseUpdate(COLLECTIONS.CLIENTS, id, updatedData);
        if (success) {
            return await getClientById(id);
        }
        return null;
    } catch (err) {
        console.error('updateClient Firebase error, falling back to localStorage', err);
        const all = await getAllClients();
        const idx = all.findIndex(c => c.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
        await writeLocal(KEY_CLIENTS, all);
        return all[idx];
    }
}

export async function deleteClient(id) {
    try {
        return await firebaseDelete(COLLECTIONS.CLIENTS, id);
    } catch (err) {
        console.error('deleteClient Firebase error, falling back to localStorage', err);
        let all = await getAllClients();
        const before = all.length;
        all = all.filter(c => c.id !== id);
        await writeLocal(KEY_CLIENTS, all);
        return all.length !== before;
    }
}

export async function addPointsToClient(id, amount, reason = '') {
    const client = await getClientById(id);
    if (!client) return null;
    
    const newPoints = (client.points || 0) + (amount || 0);
    client.points = Math.max(0, newPoints); // Não permitir pontos negativos
    
    // Create transaction record
    const transaction = {
        id: generateId('tx'),
        clientId: id,
        type: amount >= 0 ? 'ganho' : 'gasto',
        points: amount,
        reason: reason,
        timestamp: new Date().toISOString()
    };
    
    // Record transaction
    await recordTransaction(transaction);
    
    // Update client points
    await updateClient(id, { points: client.points });
    
    return { client: await getClientById(id), transaction };
}

export async function addRedeem(redeem) {
    try {
        const created = { ...redeem, createdAt: new Date().toISOString() };
        const result = await firebaseAdd(COLLECTIONS.REDEEMS, created);
        // persist a local copy so other tabs/pages receive a storage event
        try {
            const all = await firebaseGet(COLLECTIONS.REDEEMS) || [];
            await writeLocal(KEY_REDEEMS, all);
        } catch (e) { console.warn('[storage] addRedeem: could not persist local copy after firebaseAdd', e); }
        return result;
    } catch (err) {
        console.error('addRedeem Firebase error, falling back to localStorage', err);
        const all = await getAllRedeems();
        const id = generateId('redeem');
        const created = { id, createdAt: new Date().toISOString(), ...redeem };
        all.push(created);
        await writeLocal(KEY_REDEEMS, all);
        return created;
    }
}

export async function updateRedeem(id, updatedData) {
    try {
        const success = await firebaseUpdate(COLLECTIONS.REDEEMS, id, updatedData);
        if (success) {
            // update local copy for cross-tab sync
            try {
                const all = await firebaseGet(COLLECTIONS.REDEEMS) || [];
                await writeLocal(KEY_REDEEMS, all);
            } catch (e) { console.warn('[storage] updateRedeem: could not persist local copy after firebaseUpdate', e); }
            return await firebaseGet(COLLECTIONS.REDEEMS, id);
        }
        return null;
    } catch (err) {
        console.error('updateRedeem Firebase error, falling back to localStorage', err);
        const all = await getAllRedeems();
        const idx = all.findIndex(r => r.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
        await writeLocal(KEY_REDEEMS, all);
        return all[idx];
    }
}

export async function deleteRedeem(id) {
    try {
        return await firebaseDelete(COLLECTIONS.REDEEMS, id);
    } catch (err) {
        console.error('deleteRedeem Firebase error, falling back to localStorage', err);
        let all = await getAllRedeems();
        const before = all.length;
        all = all.filter(r => r.id !== id);
        await writeLocal(KEY_REDEEMS, all);
        return all.length !== before;
    }
}

// ------------------- Settings -------------------
export async function getSettings() {
    try {
        return await firebaseGet(COLLECTIONS.SETTINGS, 'main') || {};
    } catch (err) {
        console.error('getSettings Firebase error, falling back to localStorage', err);
        const s = await readLocal(KEY_SETTINGS);
        return s || {};
    }
}

export async function updateSettings(updated) {
    try {
        const current = await firebaseGet(COLLECTIONS.SETTINGS, 'main') || {};
        const merged = { ...current, ...updated };
        const success = await firebaseSet(COLLECTIONS.SETTINGS, 'main', merged);
        if (success) {
            // also persist to localStorage so other tabs/pages receive the update via "storage" event
            try { await writeLocal(KEY_SETTINGS, merged); } catch (e) { console.warn('[storage] updateSettings: could not write local copy', e); }
            return merged;
        }
        return null;
    } catch (err) {
        console.error('updateSettings Firebase error, falling back to localStorage', err);
        const current = await getSettings();
        const merged = { ...current, ...updated };
        await writeLocal(KEY_SETTINGS, merged);
        return merged;
    }
}

// ------------------- Transactions -------------------
export async function getAllTransactions() {
    const arr = await read(KEY_TRANSACTIONS);
    return Array.isArray(arr) ? arr : [];
}

// ------------------- Export / Import / Clear -------------------
export async function exportAllData() {
    return {
        products: await getAllProducts(),
        clients: await getAllClients(),
        promotions: await getAllPromotions(),
        redeems: await getAllRedeems(),
        settings: await getSettings(),
        transactions: await getAllTransactions()
    };
}

export async function importAllData(data) {
    if (!data || typeof data !== 'object') throw new Error('Import data inválido');
    if (Array.isArray(data.products)) await write(KEY_PRODUCTS, data.products);
    if (Array.isArray(data.clients)) await write(KEY_CLIENTS, data.clients);
    if (Array.isArray(data.promotions)) await write(KEY_PROMOTIONS, data.promotions);
    if (Array.isArray(data.redeems)) await write(KEY_REDEEMS, data.redeems);
    if (data.settings) await write(KEY_SETTINGS, data.settings);
    if (Array.isArray(data.transactions)) await write(KEY_TRANSACTIONS, data.transactions);
    return true;
}

export async function clearAllData() {
    await write(KEY_PRODUCTS, []);
    await write(KEY_CLIENTS, []);
    await write(KEY_PROMOTIONS, []);
    await write(KEY_REDEEMS, []);
    await write(KEY_TRANSACTIONS, []);
    await write(KEY_SETTINGS, {
        pointsPerReal: 0.1,
        bonusRegistration: 50,
        referralBonus: 50,
        levels: { bronze: 0, silver: 100, gold: 300, platinum: 500 },
        storeName: 'Joburguers',
        storeAddress: '',
        storePhone: '',
        storeHours: ''
    });
    await write(KEY_ADMIN, {
        id: 'admin_1',
        name: 'Administrador',
        phone: '11999999999',
        password: 'admin123',
        createdAt: new Date().toISOString()
    });
    return true;
}

// ------------------- Admin -------------------
export async function getAdmin() {
    try {
        return await firebaseGet(COLLECTIONS.ADMIN, 'main');
    } catch (err) {
        console.error('getAdmin Firebase error, falling back to localStorage', err);
        return await readLocal(KEY_ADMIN);
    }
}

export async function updateAdmin(updatedData) {
    try {
        const current = await firebaseGet(COLLECTIONS.ADMIN, 'main') || {};
        const merged = { ...current, ...updatedData };
        const success = await firebaseSet(COLLECTIONS.ADMIN, 'main', merged);
        if (success) {
            return merged;
        }
        return null;
    } catch (err) {
        console.error('updateAdmin Firebase error, falling back to localStorage', err);
        const current = await getAdmin();
        if (!current) return null;
        const merged = { ...current, ...updatedData };
        await writeLocal(KEY_ADMIN, merged);
        return merged;
    }
}

// ------------------- Client Login Helpers -------------------
export async function getClientByPhone(phone) {
    const all = await getAllClients();
    if (!phone) return null;
    const target = sanitizePhone(String(phone));
    const found = all.find(c => {
        if (!c || !c.phone) return false;
        return sanitizePhone(String(c.phone)) === target;
    }) || null;
    console.info('[storage] getClientByPhone: lookup', phone, '->', found ? `found id=${found.id}` : 'not found');
    return found;
}

export async function validateClientLogin(phone, password) {
    const client = await getClientByPhone(phone);
    if (!client || !client.password) return null;
    return client.password === password ? client : null;
}

export async function validateAdminLogin(phone, password) {
    const admin = await getAdmin();
    if (!admin) return null;
    return (admin.phone === phone && admin.password === password) ? admin : null;
}
