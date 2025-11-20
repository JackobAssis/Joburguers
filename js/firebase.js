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


// Funções utilitárias para CRUD genérico
async function firebaseAdd(collectionName, data) {
    const col = collection(db, collectionName);
    const docRef = await addDoc(col, data);
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...snap.data() };
}

async function firebaseGet(collectionName, id = null) {
    const col = collection(db, collectionName);
    if (id) {
        const docRef = doc(col, id);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } else {
        const snap = await getDocs(col);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}

async function firebaseUpdate(collectionName, id, data) {
    const col = collection(db, collectionName);
    const docRef = doc(col, id);
    await updateDoc(docRef, data);
    return true;
}

async function firebaseDelete(collectionName, id) {
    const col = collection(db, collectionName);
    const docRef = doc(col, id);
    await deleteDoc(docRef);
    return true;
}

async function firebaseSet(collectionName, id, data) {
    const col = collection(db, collectionName);
    const docRef = doc(col, id);
    await setDoc(docRef, data);
    return true;
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
    deleteObject,
    firebaseAdd,
    firebaseGet,
    firebaseUpdate,
    firebaseDelete,
    firebaseSet
};
