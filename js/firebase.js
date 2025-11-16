// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNWi28sZ1UfooqOE1XHeoWsMJQ74G-egw",
    authDomain: "joburguers.firebaseapp.com",
    projectId: "joburguers",
    storageBucket: "joburguers.firebasestorage.app",
    messagingSenderId: "784290278058",
    appId: "1:784290278058:web:981ea043b0db484215fed3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const COLLECTIONS = {
    ADMIN: 'admin',
    CLIENTS: 'clients',
    PRODUCTS: 'products',
    PROMOTIONS: 'promotions',
    REDEEMS: 'redeems',
    SETTINGS: 'settings',
    TRANSACTIONS: 'transactions'
};

// Real-time listeners
let listeners = {};

// Initialize real-time listeners
function initializeRealtimeListeners(callbacks = {}) {
    // Clients listener
    listeners.clients = onSnapshot(collection(db, COLLECTIONS.CLIENTS), (snapshot) => {
        const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (callbacks.onClientsUpdate) callbacks.onClientsUpdate(clients);
    });

    // Products listener
    listeners.products = onSnapshot(collection(db, COLLECTIONS.PRODUCTS), (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (callbacks.onProductsUpdate) callbacks.onProductsUpdate(products);
    });

    // Promotions listener
    listeners.promotions = onSnapshot(collection(db, COLLECTIONS.PROMOTIONS), (snapshot) => {
        const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (callbacks.onPromotionsUpdate) callbacks.onPromotionsUpdate(promotions);
    });

    // Redeems listener
    listeners.redeems = onSnapshot(collection(db, COLLECTIONS.REDEEMS), (snapshot) => {
        const redeems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (callbacks.onRedeemsUpdate) callbacks.onRedeemsUpdate(redeems);
    });

    // Transactions listener
    listeners.transactions = onSnapshot(collection(db, COLLECTIONS.TRANSACTIONS), (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (callbacks.onTransactionsUpdate) callbacks.onTransactionsUpdate(transactions);
    });
}

// Cleanup listeners
function cleanupListeners() {
    Object.values(listeners).forEach(unsubscribe => unsubscribe());
    listeners = {};
}

export {
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
    serverTimestamp,
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};
