// storage.js
// Backend simples usando localStorage. Todas as funções são async e retornam valores consistentes.
// IDs têm prefixos por tipo: product_, client_, promotion_, redeem_, tx_

import { firebaseGet, firebaseAdd, firebaseUpdate, firebaseDelete, firebaseSet } from './firebase.js';

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
    try {
        // Initialize default settings if missing
        const settings = await firebaseGet(COLLECTIONS.SETTINGS, 'main');
        if (!settings) {
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
            await firebaseSet(COLLECTIONS.ADMIN, 'main', {
                id: 'admin_1',
                name: 'Administrador',
                phone: '11999999999',
                password: 'admin123',
                createdAt: new Date().toISOString()
            });
        }

        // Keep session in localStorage for client-side state
        if ((await readLocal(KEY_SESSION)) === null) await writeLocal(KEY_SESSION, null);

        return true;
    } catch (err) {
        console.error('initializeStorage error, falling back to localStorage', err);
        // Fallback to localStorage initialization
        if ((await readLocal(KEY_PRODUCTS)) === null) await writeLocal(KEY_PRODUCTS, []);
        if ((await readLocal(KEY_CLIENTS)) === null) await writeLocal(KEY_CLIENTS, []);
        if ((await readLocal(KEY_PROMOTIONS)) === null) await writeLocal(KEY_PROMOTIONS, []);
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
        if ((await readLocal(KEY_TRANSACTIONS)) === null) await writeLocal(KEY_TRANSACTIONS, []);
        if ((await readLocal(KEY_SESSION)) === null) await writeLocal(KEY_SESSION, null);
        if ((await readLocal(KEY_ADMIN)) === null) {
            await writeLocal(KEY_ADMIN, {
                id: 'admin_1',
                name: 'Administrador',
                phone: '11999999999',
                password: 'admin123',
                createdAt: new Date().toISOString()
            });
        }
        return true;
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

// ------------------- Products -------------------
export async function getAllProducts() {
    try {
        return await firebaseGet(COLLECTIONS.PRODUCTS) || [];
    } catch (err) {
        console.error('getAllProducts Firebase error, falling back to localStorage', err);
        const arr = await readLocal(KEY_PRODUCTS);
        return Array.isArray(arr) ? arr : [];
    }
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

// ------------------- Clients -------------------
export async function getAllClients() {
    try {
        return await firebaseGet(COLLECTIONS.CLIENTS) || [];
    } catch (err) {
        console.error('getAllClients Firebase error, falling back to localStorage', err);
        const arr = await readLocal(KEY_CLIENTS);
        return Array.isArray(arr) ? arr : [];
    }
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
        console.error('addClient Firebase error, falling back to localStorage', err);
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
    client.points = (client.points || 0) + (amount || 0);
    // record transaction
    const tx = {
        id: generateId('tx'),
        clientId: id,
        type: amount >= 0 ? 'ganho' : 'gasto',
        points: amount,
        reason,
        timestamp: new Date().toISOString()
    };
    const txs = await getAllTransactions();
    txs.push(tx);
    await write(KEY_TRANSACTIONS, txs);
    await updateClient(id, { points: client.points });
    return { client: await getClientById(id), tx };
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

// ------------------- Redeems -------------------
export async function getAllRedeems() {
    try {
        return await firebaseGet(COLLECTIONS.REDEEMS) || [];
    } catch (err) {
        console.error('getAllRedeems Firebase error, falling back to localStorage', err);
        const arr = await readLocal(KEY_REDEEMS);
        return Array.isArray(arr) ? arr : [];
    }
}

export async function addRedeem(redeem) {
    try {
        const created = { ...redeem, createdAt: new Date().toISOString() };
        const result = await firebaseAdd(COLLECTIONS.REDEEMS, created);
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
    return all.find(c => c.phone === phone) || null;
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
