// Firebase configuration and initialization
// Updated: Fixed duplicate function declarations + Firebase Authentication
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
    serverTimestamp,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const storage = getStorage(app);
const auth = getAuth(app);

// Authentication state
let isAuthenticated = false;
let authInitialized = false;

// Initialize anonymous authentication
async function initializeAuth() {
    if (authInitialized) return isAuthenticated;
    
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.info('[Firebase Auth] User authenticated:', user.uid);
                isAuthenticated = true;
                authInitialized = true;
                resolve(true);
            } else {
                console.info('[Firebase Auth] No user, signing in anonymously...');
                try {
                    await signInAnonymously(auth);
                    isAuthenticated = true;
                    authInitialized = true;
                    console.info('[Firebase Auth] Anonymous sign-in successful');
                    resolve(true);
                } catch (error) {
                    console.error('[Firebase Auth] Anonymous sign-in failed:', error);
                    isAuthenticated = false;
                    authInitialized = true;
                    resolve(false);
                }
            }
        });
    });
}

// Ensure authentication before operations
async function ensureAuth() {
    if (!authInitialized) {
        await initializeAuth();
    }
    return isAuthenticated;
}

// Firebase Storage functions for images
async function uploadImage(file, path) {
    try {
        if (!file) throw new Error('No file provided');
        
        // Check if running on Vercel (CORS issues)
        const isVercel = window.location.hostname.includes('vercel.app');
        if (isVercel) {
            console.warn('[Firebase] Running on Vercel, Firebase Storage may have CORS issues. Converting to base64 fallback.');
            return await convertToBase64Fallback(file);
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Image size must be less than 5MB');
        }
        
        // Create reference with timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `${path}/${fileName}`);
        
        console.info(`[Firebase] Uploading image: ${fileName}`);
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.info(`[Firebase] Image uploaded successfully: ${downloadURL}`);
        
        return {
            url: downloadURL,
            path: snapshot.ref.fullPath,
            size: file.size,
            type: file.type,
            name: fileName
        };
        
    } catch (error) {
        console.error('[Firebase] Image upload failed:', error);
        throw error;
    }
}

// Fallback function for Vercel/CORS issues - converts to base64
async function convertToBase64Fallback(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            console.info(`[Firebase] Using base64 fallback for image: ${file.name}`);
            resolve({
                url: base64,
                path: `base64/${file.name}`,
                size: file.size,
                type: file.type,
                name: file.name,
                isBase64: true
            });
        };
        reader.onerror = () => reject(new Error('Failed to convert image to base64'));
        reader.readAsDataURL(file);
    });
}

async function deleteImage(imagePath) {
    try {
        if (!imagePath) return true;
        
        // Skip deletion for base64 images
        if (imagePath.startsWith('data:')) {
            console.info('[Firebase] Skipping deletion of base64 image');
            return true;
        }
        
        // Extract path from URL if needed
        let path = imagePath;
        if (path.includes('firebase')) {
            // Extract path from Firebase URL
            const pathMatch = path.match(/\/o\/(.*?)\?/);
            if (pathMatch) {
                path = decodeURIComponent(pathMatch[1]);
            }
        }
        
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        
        console.info(`[Firebase] Image deleted: ${path}`);
        return true;
        
    } catch (error) {
        console.warn('[Firebase] Image deletion failed:', error);
        return false;
    }
}

// Helper function to compress images before upload
async function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate dimensions
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // Draw compressed image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to blob
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Performance and timeout configurations
const OPERATION_TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Simple cache system
const cache = {
    data: new Map(),
    timestamps: new Map(),
    TTL: 5 * 60 * 1000, // 5 minutes
    
    set(key, value) {
        this.data.set(key, value);
        this.timestamps.set(key, Date.now());
    },
    
    get(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp || Date.now() - timestamp > this.TTL) {
            this.data.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        return this.data.get(key);
    },
    
    clear() {
        this.data.clear();
        this.timestamps.clear();
    },
    
    invalidate(pattern) {
        for (const key of this.data.keys()) {
            if (key.includes(pattern)) {
                this.data.delete(key);
                this.timestamps.delete(key);
            }
        }
    }
};

// Network status tracking
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
    isOnline = true;
    console.info('[Firebase] Network back online');
});
window.addEventListener('offline', () => {
    isOnline = false;
    console.warn('[Firebase] Network offline, using cache/localStorage fallback');
});

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

// Cleanup listeners
function cleanupListeners() {
    Object.values(listeners).forEach(unsubscribe => unsubscribe());
    listeners = {};
}


// Utility functions with retry logic and timeout
async function withTimeout(promise, timeoutMs = OPERATION_TIMEOUT) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
        })
    ]);
}

async function withRetry(operation, attempts = RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`[Firebase] Attempt ${i + 1} failed:`, error.message);
            if (i === attempts - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
    }
}

// Enhanced CRUD operations with performance improvements
async function firebaseAdd(collectionName, data) {
    await ensureAuth(); // Ensure authenticated
    
    if (!isOnline) {
        throw new Error('Offline - cannot perform write operations');
    }
    
    const operation = async () => {
        const col = collection(db, collectionName);
        const docRef = await addDoc(col, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        const snap = await getDoc(docRef);
        const result = { id: docRef.id, ...snap.data() };
        
        // Invalidate related cache
        cache.invalidate(collectionName);
        
        return result;
    };
    
    return withTimeout(withRetry(operation));
}

async function firebaseGet(collectionName, id = null) {
    await ensureAuth(); // Ensure authenticated
    
    const cacheKey = id ? `${collectionName}:${id}` : collectionName;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isOnline) {
        return cached;
    }
    
    const operation = async () => {
        const col = collection(db, collectionName);
        if (id) {
            const docRef = doc(col, id);
            const snap = await getDoc(docRef);
            const result = snap.exists() ? { id: snap.id, ...snap.data() } : null;
            
            if (result) {
                cache.set(cacheKey, result);
            }
            
            return result;
        } else {
            const snap = await getDocs(col);
            const result = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Cache individual items and collection
            result.forEach(item => cache.set(`${collectionName}:${item.id}`, item));
            cache.set(cacheKey, result);
            
            return result;
        }
    };
    
    try {
        return await withTimeout(withRetry(operation));
    } catch (error) {
        console.warn(`[Firebase] Get operation failed for ${cacheKey}, returning cached data:`, error.message);
        return cached || (id ? null : []);
    }
}

async function firebaseUpdate(collectionName, id, data) {
    await ensureAuth(); // Ensure authenticated
    
    if (!isOnline) {
        throw new Error('Offline - cannot perform write operations');
    }
    
    const operation = async () => {
        const col = collection(db, collectionName);
        const docRef = doc(col, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        // Invalidate cache for this item and collection
        cache.invalidate(collectionName);
        
        return true;
    };
    
    return withTimeout(withRetry(operation));
}

async function firebaseDelete(collectionName, id) {
    await ensureAuth(); // Ensure authenticated
    
    if (!isOnline) {
        throw new Error('Offline - cannot perform write operations');
    }
    
    const operation = async () => {
        const col = collection(db, collectionName);
        const docRef = doc(col, id);
        await deleteDoc(docRef);
        
        // Invalidate cache
        cache.invalidate(collectionName);
        
        return true;
    };
    
    return withTimeout(withRetry(operation));
}

async function firebaseSet(collectionName, id, data) {
    await ensureAuth(); // Ensure authenticated
    
    if (!isOnline) {
        throw new Error('Offline - cannot perform write operations');
    }
    
    const operation = async () => {
        const col = collection(db, collectionName);
        const docRef = doc(col, id);
        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        // Invalidate cache
        cache.invalidate(collectionName);
        
        return true;
    };
    
    return withTimeout(withRetry(operation));
}

// Enhanced real-time listeners with error handling
function initializeRealtimeListeners(callbacks = {}) {
    try {
        // Clients listener
        listeners.clients = onSnapshot(
            collection(db, COLLECTIONS.CLIENTS),
            (snapshot) => {
                const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                cache.set(COLLECTIONS.CLIENTS, clients);
                if (callbacks.onClientsUpdate) callbacks.onClientsUpdate(clients);
            },
            (error) => {
                console.error('[Firebase] Clients listener error:', error);
                if (callbacks.onClientsUpdate) {
                    const cached = cache.get(COLLECTIONS.CLIENTS);
                    if (cached) callbacks.onClientsUpdate(cached);
                }
            }
        );

        // Products listener
        listeners.products = onSnapshot(
            collection(db, COLLECTIONS.PRODUCTS),
            (snapshot) => {
                const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                cache.set(COLLECTIONS.PRODUCTS, products);
                if (callbacks.onProductsUpdate) callbacks.onProductsUpdate(products);
            },
            (error) => {
                console.error('[Firebase] Products listener error:', error);
                if (callbacks.onProductsUpdate) {
                    const cached = cache.get(COLLECTIONS.PRODUCTS);
                    if (cached) callbacks.onProductsUpdate(cached);
                }
            }
        );

        // Add other listeners with same pattern...
        console.info('[Firebase] Real-time listeners initialized');
        
    } catch (error) {
        console.error('[Firebase] Failed to initialize listeners:', error);
    }
}

export {
    db,
    storage,
    auth,
    COLLECTIONS,
    cache,
    isOnline,
    initializeAuth,
    ensureAuth,
    initializeRealtimeListeners,
    cleanupListeners,
    withTimeout,
    withRetry,
    uploadImage,
    deleteImage,
    compressImage,
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
