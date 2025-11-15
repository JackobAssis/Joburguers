/**
 * STORAGE.JS - Gerenciamento de dados locais com localStorage
 * Centraliza toda a lógica de persistência de dados
 */

// ========================================
// CHAVES DE ARMAZENAMENTO
// ========================================
const STORAGE_KEYS = {
    ADMIN: 'admin_user',
    CLIENTS: 'clients_data',
    PRODUCTS: 'products_data',
    PROMOTIONS: 'promotions_data',
    REDEEMS: 'redeems_data',
    SETTINGS: 'system_settings',
    TRANSACTIONS: 'transactions_data',
    CURRENT_USER: 'current_user_session'
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
    // storePhone must be a string to avoid JS syntax errors
    storePhone: '+55 (81) 98933-4497',
    // Normalized WhatsApp number for direct links (country + area + number)
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
// FUNÇÕES DE INICIALIZAÇÃO
// ========================================

/**
 * Inicializa o localStorage com dados padrão se não existirem
 */
function initializeStorage() {
    // Inicializar admin
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(DEFAULT_ADMIN));
    }

    // Inicializar clientes
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    }

    // Inicializar produtos
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const defaultProducts = [
            {
                id: 1,
                name: 'Hamburger Clássico',
                category: 'hamburguer',
                price: 25.00,
                image: 'https://via.placeholder.com/400x300?text=Hamburger+Classico',
                description: 'Nosso hambúrguer clássico com carne suculenta, alface fresca, tomate e cebola roxa.',
                ingredients: ['Pão', 'Carne', 'Alface', 'Tomate', 'Cebola'],
                available: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Refrigerante 2L',
                category: 'bebida',
                price: 8.00,
                image: 'https://via.placeholder.com/400x300?text=Refrigerante',
                description: 'Refrigerante gelado de 2 litros para acompanhar seu pedido.',
                available: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Batata Frita Premium',
                category: 'acompanhamento',
                price: 12.00,
                image: 'https://via.placeholder.com/400x300?text=Batata+Frita',
                description: 'Batata frita crocante e salgadinha, feita na hora.',
                available: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    }

    // Inicializar promoções
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify([]));
    }

    // Inicializar resgates
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
            },
            {
                id: 3,
                name: 'Hamburger Grátis',
                points: 250,
                value: 25,
                type: 'product',
                active: true
            }
        ];
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(defaultRedeems));
    }

    // Inicializar configurações
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Inicializar transações
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
}

// ========================================
// FUNÇÕES DE ADMIN
// ========================================

function getAdmin() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN));
}

function updateAdmin(adminData) {
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(adminData));
}

function validateAdminLogin(phone, password) {
    const admin = getAdmin();
    return admin.phone === phone && admin.password === password;
}

// ========================================
// FUNÇÕES DE CLIENTES
// ========================================

function getAllClients() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
}

function getClientById(id) {
    const clients = getAllClients();
    return clients.find(c => c.id === id);
}

function getClientByPhone(phone) {
    const clients = getAllClients();
    const normalizedPhone = phone.replace(/\D/g, '');
    return clients.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);
}

function addClient(clientData) {
    const clients = getAllClients();
    const newClient = {
        id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
        ...clientData,
        points: clientData.points || 0,
        level: calculateLevel(clientData.points || 0),
        createdAt: new Date().toISOString(),
        active: true
    };
    clients.push(newClient);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return newClient;
}

function updateClient(id, clientData) {
    const clients = getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
        clients[index] = {
            ...clients[index],
            ...clientData,
            level: calculateLevel(clientData.points || clients[index].points)
        };
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        return clients[index];
    }
    return null;
}

function deleteClient(id) {
    const clients = getAllClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
}

function addPointsToClient(clientId, points, reason = 'ajuste') {
    const client = getClientById(clientId);
    if (client) {
        const newPoints = client.points + points;
        const updatedClient = updateClient(clientId, { points: newPoints });
        
        // Registrar transação
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
// FUNÇÕES DE PRODUTOS
// ========================================

function getAllProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
}

function getProductById(id) {
    const products = getAllProducts();
    return products.find(p => p.id === id);
}

function getProductsByCategory(category) {
    const products = getAllProducts();
    if (category === 'todos') return products;
    return products.filter(p => p.category === category);
}

function addProduct(productData) {
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

function updateProduct(id, productData) {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...productData };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products[index];
    }
    return null;
}

function deleteProduct(id) {
    const products = getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
}

// ========================================
// FUNÇÕES DE PROMOÇÕES
// ========================================

function getAllPromotions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) || [];
}

function getActivePromotions() {
    const promotions = getAllPromotions();
    const now = new Date();
    return promotions.filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return now >= start && now <= end && p.active;
    });
}

function addPromotion(promotionData) {
    const promotions = getAllPromotions();
    const newPromotion = {
        id: promotions.length > 0 ? Math.max(...promotions.map(p => p.id)) + 1 : 1,
        ...promotionData,
        createdAt: new Date().toISOString()
    };
    promotions.push(newPromotion);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
    return newPromotion;
}

function updatePromotion(id, promotionData) {
    const promotions = getAllPromotions();
    const index = promotions.findIndex(p => p.id === id);
    if (index !== -1) {
        promotions[index] = { ...promotions[index], ...promotionData };
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
        return promotions[index];
    }
    return null;
}

function deletePromotion(id) {
    const promotions = getAllPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(filtered));
}

// ========================================
// FUNÇÕES DE RESGATES
// ========================================

function getAllRedeems() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMS)) || [];
}

function getRedeemById(id) {
    const redeems = getAllRedeems();
    return redeems.find(r => r.id === id);
}

function addRedeem(redeemData) {
    const redeems = getAllRedeems();
    const newRedeem = {
        id: redeems.length > 0 ? Math.max(...redeems.map(r => r.id)) + 1 : 1,
        ...redeemData
    };
    redeems.push(newRedeem);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
    return newRedeem;
}

function updateRedeem(id, redeemData) {
    const redeems = getAllRedeems();
    const index = redeems.findIndex(r => r.id === id);
    if (index !== -1) {
        redeems[index] = { ...redeems[index], ...redeemData };
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
        return redeems[index];
    }
    return null;
}

function deleteRedeem(id) {
    const redeems = getAllRedeems();
    const filtered = redeems.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(filtered));
}

// ========================================
// FUNÇÕES DE CONFIGURAÇÕES
// ========================================

function getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
}

function updateSettings(newSettings) {
    const settings = getSettings();
    const updated = { ...settings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

// ========================================
// FUNÇÕES DE TRANSAÇÕES
// ========================================

function getAllTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
}

function getClientTransactions(clientId) {
    const transactions = getAllTransactions();
    return transactions.filter(t => t.clientId === clientId).reverse();
}

function recordTransaction(transactionData) {
    const transactions = getAllTransactions();
    const newTransaction = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id || 0)) + 1 : 1,
        ...transactionData
    };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
}

// ========================================
// FUNÇÕES DE SESSÃO
// ========================================

function setCurrentSession(userType, userId) {
    const session = {
        userType,
        userId,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
}

function getCurrentSession() {
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function isLoggedIn() {
    return getCurrentSession() !== null;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Calcula o nível do cliente baseado em pontos
 */
function calculateLevel(points) {
    const settings = getSettings();
    const levels = settings.levels;

    if (points >= levels.platinum) return 'platinum';
    if (points >= levels.gold) return 'gold';
    if (points >= levels.silver) return 'silver';
    return 'bronze';
}

/**
 * Retorna o nível em português
 */
function getLevelLabel(level) {
    const labels = {
        bronze: 'Bronze 🥉',
        silver: 'Prata 🥈',
        gold: 'Ouro 🥇',
        platinum: 'Platina 💎'
    };
    return labels[level] || 'Bronze 🥉';
}

/**
 * Retorna os próximos pontos necessários
 */
function getPointsUntilNextLevel(currentPoints) {
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

/**
 * Exporta todos os dados em JSON
 */
function exportAllData() {
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

/**
 * Importa dados de um arquivo JSON
 */
function importAllData(data) {
    if (data.admin) localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data.admin));
    if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
    if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    if (data.promotions) localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(data.promotions));
    if (data.redeems) localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(data.redeems));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
}

/**
 * Limpa todos os dados
 */
function clearAllData() {
    if (confirm('⚠️ ATENÇÃO! Isto vai deletar TODOS os dados do sistema. Tem certeza?')) {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        initializeStorage();
        return true;
    }
    return false;
}

export {
    initializeStorage,
    // Admin
    getAdmin,
    updateAdmin,
    validateAdminLogin,
    // Clients
    getAllClients,
    getClientById,
    getClientByPhone,
    addClient,
    updateClient,
    deleteClient,
    addPointsToClient,
    // Products
    getAllProducts,
    getProductById,
    getProductsByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    // Promotions
    getAllPromotions,
    getActivePromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    // Redeems
    getAllRedeems,
    getRedeemById,
    addRedeem,
    updateRedeem,
    deleteRedeem,
    // Settings
    getSettings,
    updateSettings,
    // Transactions
    getAllTransactions,
    getClientTransactions,
    recordTransaction,
    // Session
    setCurrentSession,
    getCurrentSession,
    clearSession,
    isLoggedIn,
    // Utilities
    calculateLevel,
    getLevelLabel,
    getPointsUntilNextLevel,
    exportAllData,
    importAllData,
    clearAllData
};
