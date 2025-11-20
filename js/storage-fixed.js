/**
 * STORAGE.JS - Gerenciamento de dados com localStorage
 * Versão simplificada e corrigida (sem Firebase)
 */

// ========================================
// CHAVES DE ARMAZENAMENTO
// ========================================
const STORAGE_KEYS = {
    ADMIN: 'joburguers_admin',
    CLIENTS: 'joburguers_clients',
    PRODUCTS: 'joburguers_products',
    PROMOTIONS: 'joburguers_promotions',
    REDEEMS: 'joburguers_redeems',
    SETTINGS: 'joburguers_settings',
    TRANSACTIONS: 'joburguers_transactions',
    CURRENT_USER: 'joburguers_session'
};

// ========================================
// DADOS PADRÃO
// ========================================
const DEFAULT_ADMIN = {
    phone: '81992974918',
    password: 'jodono',
    name: 'dono'
};

const DEFAULT_SETTINGS = {
    storeName: 'JóBurguers',
    storeAddress: 'Rua Pasárgada, Bairro: Três Marias - Carpina, PE',
    storePhone: '+55 (81) 98933-4497',
    storeWhatsApp: '5581989334497',
    storeHours: 'Seg-Sex-Sab-Dom 6:30h às 22h',
    pointsPerReal: 0.1,
    bonusRegistration: 50,
    referralBonus: 50,
    levels: {
        bronze: 0,
        silver: 100,
        gold: 300,
        platinum: 500
    }
};

// ========================================
// INICIALIZAÇÃO
// ========================================

export function initializeStorage() {
    // Admin
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(DEFAULT_ADMIN));
    }

    // Clientes
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    }

    // Produtos
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const defaultProducts = [
            {
                id: 1,
                name: 'Hambúrguer Clássico',
                category: 'hamburguer',
                price: 25.00,
                image: 'https://via.placeholder.com/400x300?text=Hamburger+Classico',
                description: 'Nosso hambúrguer clássico com carne suculenta.',
                ingredients: ['Pão', 'Carne', 'Alface', 'Tomate'],
                available: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Refrigerante 2L',
                category: 'bebida',
                price: 8.00,
                image: 'https://via.placeholder.com/400x300?text=Refrigerante',
                description: 'Refrigerante gelado.',
                available: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    }

    // Promoções
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify([]));
    }

    // Resgates
    if (!localStorage.getItem(STORAGE_KEYS.REDEEMS)) {
        const defaultRedeems = [
            {
                id: 1,
                name: 'Desconto 10%',
                points: 50,
                value: 10,
                type: 'percentage',
                active: true
            },
            {
                id: 2,
                name: 'Desconto 20%',
                points: 150,
                value: 20,
                type: 'percentage',
                active: true
            }
        ];
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(defaultRedeems));
    }

    // Configurações
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Transações
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }

    // Sessão
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(null));
    }

    return true;
}

// ========================================
// ADMIN
// ========================================

export function getAdmin() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN) || '{}');
}

export function updateAdmin(adminData) {
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(adminData));
    return adminData;
}

export function validateAdminLogin(phone, password) {
    const admin = getAdmin();
    return admin.phone === phone && admin.password === password;
}

// ========================================
// CLIENTES
// ========================================

export function getAllClients() {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
}

export function getClientById(id) {
    const clients = getAllClients();
    return clients.find(c => c.id === id);
}

export function getClientByPhone(phone) {
    if (!phone) return null;
    const clients = getAllClients();
    const normalizedPhone = phone.replace(/\D/g, '');
    return clients.find(c => c.phone && c.phone.replace(/\D/g, '') === normalizedPhone);
}

export function validateClientLogin(phone, password) {
    const client = getClientByPhone(phone);
    if (!client) return null;
    
    if (client.password === password) {
        return client;
    }
    
    return null;
}

export function addClient(clientData) {
    const clients = getAllClients();
    
    let password = clientData.password;
    if (!password && clientData.phone) {
        password = clientData.phone.replace(/\D/g, '').slice(-6);
    }
    
    const newClient = {
        id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
        name: clientData.name || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        password: password || '000000',
        points: clientData.points || 0,
        level: calculateLevel(clientData.points || 0),
        createdAt: new Date().toISOString(),
        active: clientData.active !== false,
        lastUpdatedAt: new Date().toISOString()
    };
    
    clients.push(newClient);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return newClient;
}

export function updateClient(id, clientData) {
    const clients = getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
        const currentClient = clients[index];
        clients[index] = {
            ...currentClient,
            ...clientData,
            level: calculateLevel(clientData.points || currentClient.points),
            lastUpdatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        return clients[index];
    }
    return null;
}

export function deleteClient(id) {
    const clients = getAllClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
}

export function addPointsToClient(clientId, points, reason = 'ajuste') {
    const client = getClientById(clientId);
    if (client) {
        const newPoints = client.points + points;
        const updatedClient = updateClient(clientId, { points: newPoints });
        
        recordTransaction({
            clientId,
            points,
            type: points > 0 ? 'ganho' : 'resgate',
            reason,
            timestamp: new Date().toISOString()
        });
        
        return updatedClient;
    }
    return null;
}

// ========================================
// PRODUTOS
// ========================================

export function getAllProducts() {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
}

export function getProductById(id) {
    const products = getAllProducts();
    return products.find(p => p.id === id);
}

export function getProductsByCategory(category) {
    const products = getAllProducts();
    if (category === 'todos') return products;
    return products.filter(p => p.category === category);
}

export function addProduct(productData) {
    const products = getAllProducts();
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        ...productData,
        createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
}

export function updateProduct(id, productData) {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...productData };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products[index];
    }
    return null;
}

export function deleteProduct(id) {
    const products = getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
}

// ========================================
// PROMOÇÕES (SIMPLIFICADO)
// ========================================

export function getAllPromotions() {
    const data = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
    return data ? JSON.parse(data) : [];
}

export function getPromotionById(id) {
    const promotions = getAllPromotions();
    return promotions.find(p => p.id === id);
}

export function addPromotion(promotionData) {
    const promotions = getAllPromotions();
    const newPromotion = {
        id: promotions.length > 0 ? Math.max(...promotions.map(p => p.id)) + 1 : 1,
        name: promotionData.name,
        value: promotionData.value,
        description: promotionData.description,
        image: promotionData.image || '',
        instagramLink: promotionData.instagramLink || '',
        active: promotionData.active !== false,
        createdAt: new Date().toISOString()
    };
    promotions.push(newPromotion);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
    return newPromotion;
}

export function updatePromotion(id, promotionData) {
    const promotions = getAllPromotions();
    const index = promotions.findIndex(p => p.id === id);
    if (index !== -1) {
        promotions[index] = { ...promotions[index], ...promotionData };
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
        return promotions[index];
    }
    return null;
}

export function deletePromotion(id) {
    const promotions = getAllPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(filtered));
}

export function getActivePromotions() {
    return getAllPromotions().filter(p => p.active);
}

// ========================================
// RESGATES (SIMPLIFICADO)
// ========================================

export function getAllRedeems() {
    const data = localStorage.getItem(STORAGE_KEYS.REDEEMS);
    return data ? JSON.parse(data) : [];
}

export function getRedeemById(id) {
    const redeems = getAllRedeems();
    return redeems.find(r => r.id === id);
}

export function addRedeem(redeemData) {
    const redeems = getAllRedeems();
    const newRedeem = {
        id: redeems.length > 0 ? Math.max(...redeems.map(r => r.id)) + 1 : 1,
        productId: redeemData.productId,
        name: redeemData.name,
        points: redeemData.points,
        active: redeemData.active !== false,
        createdAt: new Date().toISOString()
    };
    redeems.push(newRedeem);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
    return newRedeem;
}

export function updateRedeem(id, redeemData) {
    const redeems = getAllRedeems();
    const index = redeems.findIndex(r => r.id === id);
    if (index !== -1) {
        redeems[index] = { ...redeems[index], ...redeemData };
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
        return redeems[index];
    }
    return null;
}

export function deleteRedeem(id) {
    const redeems = getAllRedeems();
    const filtered = redeems.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(filtered));
}

// ========================================
// CONFIGURAÇÕES
// ========================================

export function getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function updateSettings(newSettings) {
    const settings = getSettings();
    const updated = { ...settings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

// ========================================
// TRANSAÇÕES
// ========================================

export function getAllTransactions() {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
}

export function getClientTransactions(clientId) {
    const transactions = getAllTransactions();
    return transactions.filter(t => t.clientId === clientId).reverse();
}

export function recordTransaction(transactionData) {
    const transactions = getAllTransactions();
    const newTransaction = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id || 0)) + 1 : 1,
        ...transactionData,
        timestamp: new Date().toISOString()
    };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
}

// ========================================
// SESSÃO
// ========================================

export function setCurrentSession(userType, userId) {
    const session = {
        userType,
        userId,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    return session;
}

export function getCurrentSession() {
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return session ? JSON.parse(session) : null;
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return true;
}

export function isLoggedIn() {
    return getCurrentSession() !== null;
}

// ========================================
// UTILITÁRIOS
// ========================================

export function calculateLevel(points) {
    const settings = getSettings();
    const levels = settings.levels;

    if (points >= levels.platinum) return 'platinum';
    if (points >= levels.gold) return 'gold';
    if (points >= levels.silver) return 'silver';
    return 'bronze';
}

export function getLevelLabel(level) {
    const labels = {
        bronze: 'Bronze 🥉',
        silver: 'Prata 🥈',
        gold: 'Ouro 🥇',
        platinum: 'Platina 💎'
    };
    return labels[level] || 'Bronze 🥉';
}

export function getPointsUntilNextLevel(currentPoints) {
    const settings = getSettings();
    const levels = settings.levels;

    if (currentPoints < levels.silver) {
        return levels.silver - currentPoints;
    } else if (currentPoints < levels.gold) {
        return levels.gold - currentPoints;
    } else if (currentPoints < levels.platinum) {
        return levels.platinum - currentPoints;
    }
    return 0;
}

export function exportAllData() {
    return {
        admin: getAdmin(),
        clients: getAllClients(),
        products: getAllProducts(),
        promotions: getAllPromotions(),
        redeems: getAllRedeems(),
        settings: getSettings(),
        transactions: getAllTransactions(),
        exportDate: new Date().toISOString()
    };
}

export function importAllData(data) {
    if (data.admin) localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data.admin));
    if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
    if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    if (data.promotions) localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(data.promotions));
    if (data.redeems) localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(data.redeems));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    return true;
}

export function clearAllData() {
    if (confirm('⚠️ ATENÇÃO! Isto vai deletar TODOS os dados. Tem certeza?')) {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        initializeStorage();
        return true;
    }
    return false;
}
