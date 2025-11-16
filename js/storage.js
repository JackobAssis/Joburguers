/**
 * STORAGE.JS - Gerenciamento de dados com Firebase Firestore + localStorage fallback
 * Versão corrigida: Normaliza IDs como strings, adiciona try/catch completo
 */

import {
    db,
    COLLECTIONS,
    initializeRealtimeListeners,
    cleanupListeners,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp
} from './firebase.js';

// ========================================
// CHAVES DE ARMAZENAMENTO LOCAL (FALLBACK)
// ========================================
const STORAGE_KEYS = {
    ADMIN: 'admin_user',
    CLIENTS: 'clients_data',
    PRODUCTS: 'products_data',
    PROMOTIONS: 'promotions_data',
    REDEEMS: 'redeems_data',
    SETTINGS: 'system_settings',
    TRANSACTIONS: 'transactions_data',
    CURRENT_USER: 'current_user_session',
    USE_FIREBASE: 'use_firebase'
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
// CONFIGURAÇÃO FIREBASE
// ========================================

let useFirebase = false;
let realtimeCallbacks = {};

// Verificar se Firebase está disponível
function checkFirebaseAvailability() {
    try {
        if (typeof db !== 'undefined' && db) {
            useFirebase = true;
            console.log('Firebase disponível - usando sincronização em tempo real');
            return true;
        }
    } catch (error) {
        console.warn('Firebase não disponível - usando localStorage como fallback');
    }
    useFirebase = false;
    return false;
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

// Normalizar ID para string
function normalizeId(id) {
    return String(id);
}

// Verificar se objeto tem ID válido
function hasValidId(obj) {
    return obj && (obj.id || obj.id === 0) && String(obj.id).trim() !== '';
}

// ========================================
// FUNÇÕES DE INICIALIZAÇÃO
// ========================================

/**
 * Inicializa o armazenamento (Firebase + localStorage fallback)
 */
async function initializeStorage() {
    checkFirebaseAvailability();

    if (useFirebase) {
        // Inicializar dados padrão no Firebase se necessário
        await initializeFirebaseDefaults();
    } else {
        // Fallback para localStorage
        initializeLocalStorageDefaults();
    }
}

/**
 * Inicializa dados padrão no localStorage
 */
function initializeLocalStorageDefaults() {
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
                image: `https://via.placeholder.com/400x300?text=${encodeURIComponent('Hamburger Classico')}`,
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
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify([]));
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

/**
 * Inicializa dados padrão no Firebase
 */
async function initializeFirebaseDefaults() {
    try {
        // Verificar se admin existe
        const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMIN, 'main'));
        if (!adminDoc.exists()) {
            await setDoc(doc(db, COLLECTIONS.ADMIN, 'main'), DEFAULT_ADMIN);
        }

        // Verificar se configurações existem
        const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'main'));
        if (!settingsDoc.exists()) {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, 'main'), DEFAULT_SETTINGS);
        }

        // Verificar se produtos padrão existem
        const productsSnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
        if (productsSnapshot.empty) {
            const defaultProducts = [
                {
                    name: 'Hamburger Clássico',
                    category: 'hamburguer',
                    price: 25.00,
                    image: `https://via.placeholder.com/400x300?text=${encodeURIComponent('Hamburger Classico')}`,
                    description: 'Nosso hambúrguer clássico com carne suculenta, alface fresca, tomate e cebola roxa.',
                    ingredients: ['Pão', 'Carne', 'Alface', 'Tomate', 'Cebola'],
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Refrigerante 2L',
                    category: 'bebida',
                    price: 8.00,
                    image: 'https://via.placeholder.com/400x300?text=Refrigerante',
                    description: 'Refrigerante gelado de 2 litros para acompanhar seu pedido.',
                    available: true,
                    createdAt: serverTimestamp()
                },
                {
                    name: 'Batata Frita Premium',
                    category: 'acompanhamento',
                    price: 12.00,
                    image: 'https://via.placeholder.com/400x300?text=Batata+Frita',
                    description: 'Batata frita crocante e salgadinha, feita na hora.',
                    available: true,
                    createdAt: serverTimestamp()
                }
            ];

            for (const product of defaultProducts) {
                await addDoc(collection(db, COLLECTIONS.PRODUCTS), product);
            }
        }
    } catch (error) {
        console.error('Erro ao inicializar Firebase:', error);
        // Fallback para localStorage
        useFirebase = false;
        initializeLocalStorageDefaults();
    }
}

// ========================================
// FUNÇÕES DE ADMIN
// ========================================

async function getAdmin() {
    if (useFirebase) {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.ADMIN, 'main'));
            return docSnap.exists() ? docSnap.data() : DEFAULT_ADMIN;
        } catch (error) {
            console.error('Erro ao buscar admin do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN)) || DEFAULT_ADMIN;
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN)) || DEFAULT_ADMIN;
}

async function updateAdmin(adminData) {
    if (useFirebase) {
        try {
            await setDoc(doc(db, COLLECTIONS.ADMIN, 'main'), adminData);
        } catch (error) {
            console.error('Erro ao atualizar admin no Firebase:', error);
        }
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(adminData));
}

async function validateAdminLogin(phone, password) {
    const admin = await getAdmin();
    return admin.phone === phone && admin.password === password;
}

// ========================================
// FUNÇÕES DE CLIENTES
// ========================================

async function getAllClients() {
    if (useFirebase) {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.CLIENTS));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao buscar clientes do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
}

async function getClientById(id) {
    try {
        const normalizedId = normalizeId(id);
        const clients = await getAllClients();
        return clients.find(c => normalizeId(c.id) === normalizedId);
    } catch (error) {
        console.error('Erro ao buscar cliente por ID:', error);
        return null;
    }
}

async function getClientByPhone(phone) {
    if (useFirebase) {
        try {
            const normalizedPhone = phone.replace(/\D/g, '');
            const q = query(collection(db, COLLECTIONS.CLIENTS), where('phone', '==', normalizedPhone));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar cliente por telefone do Firebase:', error);
            const clients = await getAllClients();
            return clients.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);
        }
    }
    const clients = await getAllClients();
    const normalizedPhone = phone.replace(/\D/g, '');
    return clients.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);
}

/**
 * Valida login do cliente (telefone + senha)
 */
async function validateClientLogin(phone, password) {
    const client = await getClientByPhone(phone);
    if (!client) return null; // Cliente não encontrado

    // Comparar senha (pode ser a senha real ou os últimos 6 dígitos do telefone)
    if (client.password === password) {
        return client;
    }

    return null; // Senha incorreta
}

async function addClient(clientData) {
    // Se não tiver senha, gerar uma padrão (últimos 6 dígitos do telefone)
    let password = clientData.password;
    if (!password && clientData.phone) {
        password = clientData.phone.replace(/\D/g, '').slice(-6);
    }

    const newClient = {
        name: clientData.name || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        password: password || '000000', // Senha padrão
        points: clientData.points || 0,
        level: calculateLevel(clientData.points || 0),
        createdAt: serverTimestamp(),
        active: clientData.active !== false,
        lastUpdatedAt: serverTimestamp()
    };

    if (useFirebase) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), newClient);
            newClient.id = docRef.id;
            return newClient;
        } catch (error) {
            console.error('Erro ao adicionar cliente no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const clients = getAllClients();
    newClient.id = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    newClient.createdAt = new Date().toISOString();
    newClient.lastUpdatedAt = new Date().toISOString();
    clients.push(newClient);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return newClient;
}

async function updateClient(id, clientData) {
    const updateData = {
        ...clientData,
        level: calculateLevel(clientData.points || (await getClientById(id))?.points || 0),
        lastUpdatedAt: useFirebase ? serverTimestamp() : new Date().toISOString()
    };

    if (useFirebase) {
        try {
            await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), updateData);
            return { id, ...updateData };
        } catch (error) {
            console.error('Erro ao atualizar cliente no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const clients = getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
        clients[index] = {
            ...clients[index],
            ...clientData,
            level: calculateLevel(clientData.points || clients[index].points),
            lastUpdatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        return clients[index];
    }
    return null;
}

async function deleteClient(id) {
    if (useFirebase) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
            return true;
        } catch (error) {
            console.error('Erro ao deletar cliente do Firebase:', error);
        }
    }

    // Fallback para localStorage
    const clients = getAllClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
    return true;
}

async function addPointsToClient(clientId, points, reason = 'ajuste') {
    const client = await getClientById(clientId);
    if (client) {
        const newPoints = client.points + points;
        const updatedClient = await updateClient(clientId, { points: newPoints });

        // Registrar transação
        await recordTransaction({
            clientId,
            points,
            type: points > 0 ? 'ganho' : 'resgate',
            reason,
            timestamp: useFirebase ? serverTimestamp() : new Date().toISOString()
        });

        return updatedClient;
    }
    return null;
}

// ========================================
// FUNÇÕES DE PRODUTOS
// ========================================

async function getAllProducts() {
    if (useFirebase) {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao buscar produtos do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
}

async function getProductById(id) {
    try {
        const normalizedId = normalizeId(id);
        const products = await getAllProducts();
        return products.find(p => normalizeId(p.id) === normalizedId);
    } catch (error) {
        console.error('Erro ao buscar produto por ID:', error);
        return null;
    }
}

async function getProductsByCategory(category) {
    const products = await getAllProducts();
    if (category === 'todos') return products;
    return products.filter(p => p.category === category);
}

async function addProduct(productData) {
    const newProduct = {
        ...productData,
        createdAt: useFirebase ? serverTimestamp() : new Date().toISOString()
    };

    if (useFirebase) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), newProduct);
            newProduct.id = docRef.id;
            return newProduct;
        } catch (error) {
            console.error('Erro ao adicionar produto no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const products = getAllProducts();
    newProduct.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    newProduct.createdAt = new Date().toISOString();
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
}

async function updateProduct(id, productData) {
    if (useFirebase) {
        try {
            await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), productData);
            return { id, ...productData };
        } catch (error) {
            console.error('Erro ao atualizar produto no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...productData };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products[index];
    }
    return null;
}

async function deleteProduct(id) {
    if (useFirebase) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
            return true;
        } catch (error) {
            console.error('Erro ao deletar produto do Firebase:', error);
        }
    }

    // Fallback para localStorage
    const products = getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
}

// ========================================
// FUNÇÕES DE PROMOÇÕES
// ========================================

async function getAllPromotions() {
    if (useFirebase) {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.PROMOTIONS));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao buscar promoções do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) || [];
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) || [];
}

async function getActivePromotions() {
    const promotions = await getAllPromotions();
    return promotions.filter(p => p.active === true);
}

// ========================================
// FUNÇÕES DE STORAGE PARA IMAGENS (FIREBASE STORAGE)
// ========================================

async function uploadPromotionPhoto(file) {
    if (!useFirebase) {
        // Fallback: converter para data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    try {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('./firebase.js');
        const storage = getStorage();
        const storageRef = ref(storage, `promotions/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload da foto da promoção:', error);
        // Fallback para data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }
}

async function uploadProductPhoto(file) {
    if (!useFirebase) {
        // Fallback: converter para data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    try {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('./firebase.js');
        const storage = getStorage();
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload da foto do produto:', error);
        // Fallback para data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }
}

async function addPromotion(promotionData) {
    const newPromotion = {
        name: promotionData.name || '',
        value: promotionData.value || '',
        description: promotionData.description || '',
        photo: promotionData.photo || '',
        instagramLink: promotionData.instagramLink || '',
        active: promotionData.active !== false,
        createdAt: useFirebase ? serverTimestamp() : new Date().toISOString()
    };

    if (useFirebase) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.PROMOTIONS), newPromotion);
            newPromotion.id = docRef.id;
            return newPromotion;
        } catch (error) {
            console.error('Erro ao adicionar promoção no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const promotions = getAllPromotions();
    newPromotion.id = promotions.length > 0 ? Math.max(...promotions.map(p => p.id)) + 1 : 1;
    newPromotion.createdAt = new Date().toISOString();
    promotions.push(newPromotion);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
    return newPromotion;
}

async function updatePromotion(id, promotionData) {
    if (useFirebase) {
        try {
            await updateDoc(doc(db, COLLECTIONS.PROMOTIONS, id), promotionData);
            return { id, ...promotionData };
        } catch (error) {
            console.error('Erro ao atualizar promoção no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const promotions = getAllPromotions();
    const index = promotions.findIndex(p => p.id === id);
    if (index !== -1) {
        promotions[index] = { ...promotions[index], ...promotionData };
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
        return promotions[index];
    }
    return null;
}

async function deletePromotion(id) {
    if (useFirebase) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.PROMOTIONS, id));
            return true;
        } catch (error) {
            console.error('Erro ao deletar promoção do Firebase:', error);
        }
    }

    // Fallback para localStorage
    const promotions = getAllPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(filtered));
    return true;
}

// ========================================
// FUNÇÕES DE RESGATES
// ========================================

async function getAllRedeems() {
    if (useFirebase) {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.REDEEMS));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao buscar resgates do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMS)) || [];
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMS)) || [];
}

async function getRedeemById(id) {
    try {
        const normalizedId = normalizeId(id);
        const redeems = await getAllRedeems();
        return redeems.find(r => normalizeId(r.id) === normalizedId);
    } catch (error) {
        console.error('Erro ao buscar resgate por ID:', error);
        return null;
    }
}

async function addRedeem(redeemData) {
    const newRedeem = {
        productId: redeemData.productId || 0,
        pointsRequired: redeemData.pointsRequired || 0,
        active: redeemData.active !== false,
        createdAt: useFirebase ? serverTimestamp() : new Date().toISOString()
    };

    if (useFirebase) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.REDEEMS), newRedeem);
            newRedeem.id = docRef.id;
            return newRedeem;
        } catch (error) {
            console.error('Erro ao adicionar resgate no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const redeems = getAllRedeems();
    newRedeem.id = redeems.length > 0 ? Math.max(...redeems.map(r => r.id)) + 1 : 1;
    newRedeem.createdAt = new Date().toISOString();
    redeems.push(newRedeem);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
    return newRedeem;
}

async function updateRedeem(id, redeemData) {
    if (useFirebase) {
        try {
            await updateDoc(doc(db, COLLECTIONS.REDEEMS, id), redeemData);
            return { id, ...redeemData };
        } catch (error) {
            console.error('Erro ao atualizar resgate no Firebase:', error);
        }
    }

    // Fallback para localStorage
    const redeems = getAllRedeems();
    const index = redeems.findIndex(r => r.id === id);
    if (index !== -1) {
        redeems[index] = { ...redeems[index], ...redeemData };
        localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(redeems));
        return redeems[index];
    }
    return null;
}

async function deleteRedeem(id) {
    if (useFirebase) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.REDEEMS, id));
            return true;
        } catch (error) {
            console.error('Erro ao deletar resgate do Firebase:', error);
        }
    }

    // Fallback para localStorage
    const redeems = getAllRedeems();
    const filtered = redeems.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REDEEMS, JSON.stringify(filtered));
    return true;
}

// ========================================
// FUNÇÕES DE CONFIGURAÇÕES
// ========================================

async function getSettings() {
    if (useFirebase) {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'main'));
            return docSnap.exists() ? docSnap.data() : DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Erro ao buscar configurações do Firebase:', error);
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
}

async function updateSettings(newSettings) {
    if (useFirebase) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, 'main'), newSettings);
        } catch (error) {
            console.error('Erro ao atualizar configurações no Firebase:', error);
        }
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    return newSettings;
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
async function calculateLevel(points) {
    const settings = await getSettings();
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
    validateClientLogin,
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
    uploadPromotionPhoto,
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
