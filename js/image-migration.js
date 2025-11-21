/**
 * IMAGE MIGRATION UTILITY
 * Converts existing base64 product images to Firebase Storage
 */

import { getAllProducts, updateProduct } from './storage.js';
import { uploadImage } from './firebase.js';

// Convert Data URL to File
function dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// Check if string is a Data URL
function isDataURL(str) {
    return str && typeof str === 'string' && str.startsWith('data:image/');
}

/**
 * Migrate all products with base64 images to Firebase Storage
 */
export async function migrateProductImages() {
    try {
        console.info('[Migration] Starting product image migration...');
        
        const products = await getAllProducts();
        const productsWithDataURL = products.filter(p => p.image && isDataURL(p.image));
        
        if (productsWithDataURL.length === 0) {
            console.info('[Migration] No products with base64 images found');
            return {
                success: true,
                migrated: 0,
                errors: 0,
                message: 'No products need migration'
            };
        }
        
        console.info(`[Migration] Found ${productsWithDataURL.length} products with base64 images`);
        
        let migratedCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const product of productsWithDataURL) {
            try {
                console.info(`[Migration] Processing product: ${product.name} (${product.id})`);
                
                // Convert Data URL to File
                const filename = `migrated_${product.id}_${Date.now()}.jpg`;
                const file = dataURLtoFile(product.image, filename);
                
                // Upload to Firebase Storage
                const uploadResult = await uploadImage(file, 'products');
                
                // Update product with new image URL and path
                await updateProduct(product.id, {
                    image: uploadResult.url,
                    imagePath: uploadResult.path,
                    migratedAt: new Date().toISOString()
                });
                
                migratedCount++;
                console.info(`[Migration] Successfully migrated: ${product.name}`);
                
            } catch (error) {
                errorCount++;
                const errorMsg = `Failed to migrate ${product.name}: ${error.message}`;
                errors.push(errorMsg);
                console.error(`[Migration] ${errorMsg}`, error);
            }
        }
        
        const result = {
            success: errorCount === 0,
            migrated: migratedCount,
            errors: errorCount,
            errorMessages: errors,
            message: `Migration completed: ${migratedCount} successful, ${errorCount} errors`
        };
        
        console.info(`[Migration] ${result.message}`);
        return result;
        
    } catch (error) {
        console.error('[Migration] Migration process failed:', error);
        return {
            success: false,
            migrated: 0,
            errors: 1,
            errorMessages: [error.message],
            message: `Migration failed: ${error.message}`
        };
    }
}

/**
 * Get migration status - how many products still need migration
 */
export async function getMigrationStatus() {
    try {
        const products = await getAllProducts();
        const totalProducts = products.length;
        const withDataURL = products.filter(p => p.image && isDataURL(p.image)).length;
        const withFirebaseURL = products.filter(p => p.image && p.image.includes('firebase')).length;
        const withoutImage = products.filter(p => !p.image).length;
        
        return {
            total: totalProducts,
            needsMigration: withDataURL,
            alreadyMigrated: withFirebaseURL,
            withoutImage: withoutImage,
            migrationComplete: withDataURL === 0
        };
    } catch (error) {
        console.error('[Migration] Failed to get migration status:', error);
        return null;
    }
}

/**
 * Add migration UI to admin panel
 */
export function addMigrationUI() {
    // Check if already added
    if (document.getElementById('migration-section')) {
        return;
    }
    
    // Find admin dashboard or appropriate location
    const dashboard = document.querySelector('.admin-section') || document.querySelector('#dashboard');
    if (!dashboard) {
        console.warn('[Migration] Could not find location to add migration UI');
        return;
    }
    
    const migrationSection = document.createElement('div');
    migrationSection.id = 'migration-section';
    migrationSection.className = 'migration-section';
    migrationSection.innerHTML = `
        <h3>🔄 Migração de Imagens</h3>
        <div id="migration-status">
            <p>Carregando status da migração...</p>
        </div>
        <div id="migration-actions" style="display: none;">
            <button id="migrate-images-btn" class="btn btn--primary">
                Migrar Imagens para Firebase Storage
            </button>
            <button id="check-migration-btn" class="btn btn--secondary">
                Verificar Status
            </button>
        </div>
        <div id="migration-progress" style="display: none;">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <p class="progress-text">Migrando imagens...</p>
        </div>
    `;
    
    dashboard.insertBefore(migrationSection, dashboard.firstChild);
    
    // Add styles
    if (!document.getElementById('migration-styles')) {
        const styles = document.createElement('style');
        styles.id = 'migration-styles';
        styles.textContent = `
            .migration-section {
                background: rgba(255, 149, 0, 0.1);
                border: 1px solid rgba(255, 149, 0, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 2rem;
            }
            .progress-bar {
                width: 100%;
                height: 20px;
                background: #333;
                border-radius: 10px;
                overflow: hidden;
                margin: 1rem 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff9500, #ff6b00);
                width: 0%;
                transition: width 0.3s ease;
            }
            .progress-text {
                text-align: center;
                color: #ff9500;
                margin: 0.5rem 0;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add event listeners
    document.getElementById('migrate-images-btn').onclick = async () => {
        const button = document.getElementById('migrate-images-btn');
        const progressSection = document.getElementById('migration-progress');
        const actionsSection = document.getElementById('migration-actions');
        
        button.disabled = true;
        progressSection.style.display = 'block';
        actionsSection.style.display = 'none';
        
        const result = await migrateProductImages();
        
        progressSection.style.display = 'none';
        actionsSection.style.display = 'block';
        button.disabled = false;
        
        if (result.success) {
            alert(`✅ ${result.message}`);
        } else {
            alert(`❌ ${result.message}\n\nErros:\n${result.errorMessages.join('\n')}`);
        }
        
        updateMigrationStatus();
    };
    
    document.getElementById('check-migration-btn').onclick = updateMigrationStatus;
    
    // Initial status check
    updateMigrationStatus();
}

async function updateMigrationStatus() {
    const statusDiv = document.getElementById('migration-status');
    const actionsDiv = document.getElementById('migration-actions');
    
    try {
        const status = await getMigrationStatus();
        
        if (status) {
            statusDiv.innerHTML = `
                <p><strong>Status da Migração:</strong></p>
                <ul>
                    <li>Total de produtos: ${status.total}</li>
                    <li>Precisam migração: ${status.needsMigration}</li>
                    <li>Já migrados: ${status.alreadyMigrated}</li>
                    <li>Sem imagem: ${status.withoutImage}</li>
                </ul>
                ${status.migrationComplete ? 
                    '<p style="color: #4CAF50;">✅ Migração completa!</p>' : 
                    `<p style="color: #ff9500;">⚠️ ${status.needsMigration} produtos precisam ser migrados</p>`
                }
            `;
            
            actionsDiv.style.display = status.needsMigration > 0 ? 'block' : 'none';
        }
    } catch (error) {
        statusDiv.innerHTML = `<p style="color: #e74c3c;">Erro ao verificar status: ${error.message}</p>`;
        actionsDiv.style.display = 'none';
    }
}

// Auto-add UI when admin panel loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(addMigrationUI, 1000);
    });
}