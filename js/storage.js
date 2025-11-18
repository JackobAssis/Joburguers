// storage.js
// Backend simples usando localStorage. Todas as funções são async e retornam valores consistentes.
// IDs têm prefixos por tipo: product_, client_, promotion_, redeem_, tx_

const KEY_PRODUCTS = 'joburguers_products_v1';
const KEY_CLIENTS = 'joburguers_clients_v1';
const KEY_PROMOTIONS = 'joburguers_promotions_v1';
const KEY_REDEEMS = 'joburguers_redeems_v1';
const KEY_SETTINGS = 'joburguers_settings_v1';
const KEY_TRANSACTIONS = 'joburguers_transactions_v1';
const KEY_SESSION = 'joburguers_session_v1';

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

export async function initializeStorage() {
    // Create defaults if missing
    if ((await read(KEY_PRODUCTS)) === null) await write(KEY_PRODUCTS, []);
    if ((await read(KEY_CLIENTS)) === null) await write(KEY_CLIENTS, []);
    if ((await read(KEY_PROMOTIONS)) === null) await write(KEY_PROMOTIONS, []);
    if ((await read(KEY_REDEEMS)) === null) await write(KEY_REDEEMS, []);
    if ((await read(KEY_SETTINGS)) === null) {
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
    }
    if ((await read(KEY_TRANSACTIONS)) === null) await write(KEY_TRANSACTIONS, []);
    // Keep session null unless already set
    if ((await read(KEY_SESSION)) === null) await write(KEY_SESSION, null);
    return true;
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
    const arr = await read(KEY_PRODUCTS);
    return Array.isArray(arr) ? arr : [];
}

export async function getProductById(id) {
    const all = await getAllProducts();
    return all.find(p => p.id === id) || null;
}

export async function addProduct(product) {
    const all = await getAllProducts();
    const id = generateId('product');
    const created = { id, createdAt: new Date().toISOString(), ...product };
    all.push(created);
    await write(KEY_PRODUCTS, all);
    return created;
}

export async function updateProduct(id, updatedData) {
    const all = await getAllProducts();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
    await write(KEY_PRODUCTS, all);
    return all[idx];
}

export async function deleteProduct(id) {
    let all = await getAllProducts();
    const before = all.length;
    all = all.filter(p => p.id !== id);
    await write(KEY_PRODUCTS, all);
    return all.length !== before;
}

// ------------------- Clients -------------------
export async function getAllClients() {
    const arr = await read(KEY_CLIENTS);
    return Array.isArray(arr) ? arr : [];
}

export async function getClientById(id) {
    const all = await getAllClients();
    return all.find(c => c.id === id) || null;
}

export async function addClient(client) {
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
    await write(KEY_CLIENTS, all);
    return created;
}

export async function updateClient(id, updatedData) {
    const all = await getAllClients();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
    await write(KEY_CLIENTS, all);
    return all[idx];
}

export async function deleteClient(id) {
    let all = await getAllClients();
    const before = all.length;
    all = all.filter(c => c.id !== id);
    await write(KEY_CLIENTS, all);
    return all.length !== before;
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
    const arr = await read(KEY_PROMOTIONS);
    return Array.isArray(arr) ? arr : [];
}

export async function addPromotion(promo) {
    const all = await getAllPromotions();
    const id = generateId('promotion');
    const created = { id, createdAt: new Date().toISOString(), ...promo };
    all.push(created);
    await write(KEY_PROMOTIONS, all);
    return created;
}

export async function updatePromotion(id, updatedData) {
    const all = await getAllPromotions();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
    await write(KEY_PROMOTIONS, all);
    return all[idx];
}

export async function deletePromotion(id) {
    let all = await getAllPromotions();
    const before = all.length;
    all = all.filter(p => p.id !== id);
    await write(KEY_PROMOTIONS, all);
    return all.length !== before;
}

// ------------------- Redeems -------------------
export async function getAllRedeems() {
    const arr = await read(KEY_REDEEMS);
    return Array.isArray(arr) ? arr : [];
}

export async function addRedeem(redeem) {
    const all = await getAllRedeems();
    const id = generateId('redeem');
    const created = { id, createdAt: new Date().toISOString(), ...redeem };
    all.push(created);
    await write(KEY_REDEEMS, all);
    return created;
}

export async function updateRedeem(id, updatedData) {
    const all = await getAllRedeems();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updatedData, updatedAt: new Date().toISOString() };
    await write(KEY_REDEEMS, all);
    return all[idx];
}

export async function deleteRedeem(id) {
    let all = await getAllRedeems();
    const before = all.length;
    all = all.filter(r => r.id !== id);
    await write(KEY_REDEEMS, all);
    return all.length !== before;
}

// ------------------- Settings -------------------
export async function getSettings() {
    const s = await read(KEY_SETTINGS);
    return s || {};
}

export async function updateSettings(updated) {
    const current = await getSettings();
    const merged = { ...current, ...updated };
    await write(KEY_SETTINGS, merged);
    return merged;
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
    return true;
}
