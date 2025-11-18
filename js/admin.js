/**
 * admin.js — versão unificada e corrigida
 * Combina o melhor do antigo e do novo, corrige listeners e torna imagens opcionais.
 */

import {
    initializeStorage,
    getCurrentSession,
    clearSession,
    // Products
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    // Clients
    getAllClients,
    getClientById,
    addClient,
    updateClient,
    deleteClient,
    addPointsToClient,
    // Promotions
    getAllPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    // Redeems
    getAllRedeems,
    addRedeem,
    updateRedeem,
    deleteRedeem,
    // Settings
    getSettings,
    updateSettings,
    // Transactions
    getAllTransactions,
    // Utils
    exportAllData,
    importAllData,
    clearAllData
} from './storage.js';

import {
    formatCurrency,
    formatDate,
    formatPhone,
    sanitizePhone,
    showNotification,
    showConfirmDialog,
    downloadJSON,
    readJSONFile
} from './utils.js';

// Default placeholders
const DEFAULT_PRODUCT_IMG = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
const DEFAULT_THUMB = 'https://via.placeholder.com/50?text=Sem+Imagem';
const DEFAULT_PROMO_IMG = 'https://via.placeholder.com/100x60?text=Sem+Imagem';

// Helper: safe query
function $id(id) { return document.getElementById(id); }

// Read file to dataURL (used for images)
async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();

    const session = getCurrentSession();
    if (!session || session.userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const adminUserEl = $id('adminUsername');
    if (adminUserEl) adminUserEl.textContent = 'Admin';

    setupNavigation();
    setupLogout();

    // Load sections
    loadDashboard();
    setupProductsSection();
    setupClientsSection();
    setupPromotionsSection();
    setupRedeemSection();
    setupSettings();
});

// ================================
// Navigation
// ================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav__item');
    if (!navItems || navItems.length === 0) return;

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            if (!section) return;

            navItems.forEach(i => i.classList.remove('admin-nav__item--active'));
            item.classList.add('admin-nav__item--active');

            document.querySelectorAll('.admin-section').forEach(sec => {
                sec.classList.remove('admin-section--active');
            });
            const target = $id(section);
            if (target) target.classList.add('admin-section--active');
        });
    });
}

// ================================
// Logout
// ================================
function setupLogout() {
    const logoutBtn = $id('adminLogoutBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
    });
}

// ================================
// Dashboard
// ================================
function loadDashboard() {
    try {
        const products = getAllProducts() || [];
        const clients = getAllClients() || [];
        const transactions = getAllTransactions() || [];
        const settings = getSettings() || {};

        if ($id('totalProducts')) $id('totalProducts').textContent = products.length;
        if ($id('totalClientes')) $id('totalClientes').textContent = clients.length;

        let totalPoints = 0;
        clients.forEach(c => totalPoints += (c.points || 0));
        if ($id('totalPoints')) $id('totalPoints').textContent = totalPoints;

        if ($id('recentTransactions')) $id('recentTransactions').textContent = (transactions.slice(-10).length);

        const recentActivities = $id('recentActivities');
        if (recentActivities) {
            const recent = transactions.slice(-5).reverse();
            if (recent.length === 0) {
                recentActivities.innerHTML = '<p style="text-align:center; color:#808080;">Nenhuma atividade recente</p>';
            } else {
                recentActivities.innerHTML = recent.map(activity => `
                    <div class="activity-item">
                        <div class="activity-item__time">${formatDate(activity.timestamp)}</div>
                        <div class="activity-item__desc">
                            ${activity.type === 'ganho' ? '✓ Pontos ganhos' : '📊 Resgate'}: 
                            ${activity.points > 0 ? '+' : ''}${activity.points} pontos
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.warn('Erro ao carregar dashboard:', err);
    }
}

// ================================
// PRODUCTS
// ================================
function setupProductsSection() {
    const addBtn = $id('addProductBtn');
    const searchInput = $id('productSearch');
    const categoryFilter = $id('productCategoryFilter');
    const modal = $id('productModal');
    const form = $id('productForm');
    const closeBtn = $id('closeProductModal');
    const emptyAddBtn = $id('emptyAddProductBtn');

    if (!form || !addBtn) return;

    // Open modal
    addBtn.addEventListener('click', () => openModal('productModal', 'Novo Produto', form));
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openModal('productModal', 'Novo Produto', form));

    if (closeBtn) closeBtn.addEventListener('click', () => closeModal('productModal'));

    // Submit product form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = $id('productImageFile');
        let imageValue = ($id('productImage') && $id('productImage').value) ? $id('productImage').value.trim() : '';

        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                const dataUrl = await readFileAsDataURL(fileInput.files[0]);
                imageValue = dataUrl;
            } catch (err) {
                console.warn('Falha ao processar arquivo de imagem:', err);
                showNotification('Erro ao ler imagem, produto será salvo sem imagem.', 'warning');
            }
        }

        // If still empty, keep as empty string (optional image)
        if (!imageValue) imageValue = '';

        const productData = {
            name: ($id('productName') && $id('productName').value) ? $id('productName').value.trim() : '',
            category: ($id('productCategory') && $id('productCategory').value) ? $id('productCategory').value : '',
            price: parseFloat($id('productPrice') ? $id('productPrice').value : 0) || 0,
            image: imageValue,
            description: ($id('productDescription') && $id('productDescription').value) ? $id('productDescription').value.trim() : '',
            ingredients: ($id('productIngredients') && $id('productIngredients').value)
                ? $id('productIngredients').value.split(',').map(i => i.trim()).filter(i => i)
                : [],
            available: !!($id('productAvailable') && $id('productAvailable').checked)
        };

        const productId = form.dataset.productId;
        if (productId) {
            updateProduct(parseInt(productId), productData);
            showNotification('✓ Produto atualizado!', 'success');
        } else {
            addProduct(productData);
            showNotification('✓ Produto criado!', 'success');
        }

        // reset file input to avoid reuse
        if (fileInput) fileInput.value = '';

        closeModal('productModal');
        loadProductsTable();
        loadRedeemProductOptions(); // update product select for redeems
        loadDashboard();
    });

    // Filters
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);

    loadProductsTable();
}

function loadProductsTable() {
    const tbody = $id('productsTableBody');
    if (!tbody) return;
    const products = getAllProducts() || [];

    if (products.length === 0) {
        if ($id('productsList')) $id('productsList').style.display = 'none';
        if ($id('emptyProducts')) $id('emptyProducts').style.display = 'block';
        tbody.innerHTML = '';
        return;
    }

    if ($id('productsList')) $id('productsList').style.display = 'block';
    if ($id('emptyProducts')) $id('emptyProducts').style.display = 'none';

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image || DEFAULT_THUMB}" alt="${escapeHtml(product.name)}" class="table-image" onerror="this.src='${DEFAULT_THUMB}'"></td>
            <td>${escapeHtml(product.name)}</td>
            <td>${getCategoryLabel(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="status-badge status-badge--${product.available ? 'disponivel' : 'indisponivel'}">
                    ${product.available ? 'Disponível' : 'Indisponível'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--edit" data-id="${product.id}" data-action="edit-product">Editar</button>
                    <button class="table-btn table-btn--delete" data-id="${product.id}" data-action="delete-product">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Attach delegated listeners for edit/delete
    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'edit-product') {
            btn.onclick = () => openEditProduct(id);
        } else if (action === 'delete-product') {
            btn.onclick = () => {
                showConfirmDialog('Deletar Produto?', 'Esta ação não pode ser desfeita.', () => {
                    deleteProduct(id);
                    showNotification('✓ Produto deletado!', 'success');
                    loadProductsTable();
                    loadRedeemProductOptions();
                    loadDashboard();
                });
            };
        }
    });
}

function openEditProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;
    const form = $id('productForm');
    if (!form) return;

    $id('productModalTitle').textContent = 'Editar Produto';
    if ($id('productName')) $id('productName').value = product.name || '';
    if ($id('productCategory')) $id('productCategory').value = product.category || '';
    if ($id('productPrice')) $id('productPrice').value = product.price || 0;
    if ($id('productImage')) $id('productImage').value = product.image || '';
    const fileInput = $id('productImageFile');
    if (fileInput) fileInput.value = '';
    if ($id('productDescription')) $id('productDescription').value = product.description || '';
    if ($id('productIngredients')) $id('productIngredients').value = (product.ingredients || []).join(', ');
    if ($id('productAvailable')) $id('productAvailable').checked = !!product.available;

    form.dataset.productId = productId;
    openModal('productModal');
}

function filterProducts() {
    const search = ($id('productSearch') && $id('productSearch').value.toLowerCase()) || '';
    const category = ($id('productCategoryFilter') && $id('productCategoryFilter').value) || '';
    let products = getAllProducts() || [];

    products = products.filter(p => {
        const matchSearch = (p.name || '').toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });

    renderFilteredProducts(products);
}

function renderFilteredProducts(products) {
    const tbody = $id('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image || DEFAULT_THUMB}" alt="${escapeHtml(product.name)}" class="table-image" onerror="this.src='${DEFAULT_THUMB}'"></td>
            <td>${escapeHtml(product.name)}</td>
            <td>${getCategoryLabel(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="status-badge status-badge--${product.available ? 'disponivel' : 'indisponivel'}">
                    ${product.available ? 'Disponível' : 'Indisponível'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--edit" data-id="${product.id}" data-action="edit-product">Editar</button>
                    <button class="table-btn table-btn--delete" data-id="${product.id}" data-action="delete-product">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');

    // re-bind delegated listeners
    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'edit-product') btn.onclick = () => openEditProduct(id);
        if (action === 'delete-product') btn.onclick = () => {
            showConfirmDialog('Deletar Produto?', 'Esta ação não pode ser desfeita.', () => {
                deleteProduct(id);
                showNotification('✓ Produto deletado!', 'success');
                loadProductsTable();
                loadRedeemProductOptions();
                loadDashboard();
            });
        };
    });
}

function getCategoryLabel(category) {
    const labels = {
        hamburguer: 'Hambúrguer',
        bebida: 'Bebida',
        combo: 'Combo',
        acompanhamento: 'Acompanhamento'
    };
    return labels[category] || (category || '—');
}

// ================================
// CLIENTS
// ================================
function setupClientsSection() {
    const addBtn = $id('addClientBtn');
    const searchInput = $id('clientSearch');
    const modal = $id('clientModal');
    const form = $id('clientForm');
    const closeBtn = $id('closeClientModal');

    if (!form || !addBtn) return;

    addBtn.addEventListener('click', () => {
        if (form) {
            form.reset();
            form.dataset.clientId = '';
            $id('passwordHint').textContent = '(Se vazio, será os últimos 6 dígitos do telefone)';
            openModal('clientModal', 'Novo Cliente', form);
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', () => closeModal('clientModal'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const clientData = {
            name: ($id('clientName') && $id('clientName').value) ? $id('clientName').value.trim() : '',
            phone: ($id('clientPhone') && $id('clientPhone').value) ? formatPhone($id('clientPhone').value) : '',
            email: ($id('clientEmail') && $id('clientEmail').value) ? $id('clientEmail').value.trim() : '',
            password: ($id('clientPassword') && $id('clientPassword').value) ? $id('clientPassword').value : null,
            points: parseInt($id('clientPoints') ? $id('clientPoints').value : 0) || 0,
            active: !!($id('clientActive') && $id('clientActive').checked)
        };

        const clientId = form.dataset.clientId;
        if (clientId) {
            if (!clientData.password) delete clientData.password;
            updateClient(parseInt(clientId), clientData);
            showNotification('✓ Cliente atualizado!', 'success');
        } else {
            addClient(clientData);
            showNotification('✓ Cliente criado com sucesso! Pode fazer login agora.', 'success');
        }

        closeModal('clientModal');
        loadClientsTable();
        loadDashboard();
    });

    if (searchInput) searchInput.addEventListener('input', filterClients);

    // Sync between tabs: reload clients table when storage changes related to clients
    window.addEventListener('storage', (ev) => {
        try {
            if (!ev.key) return;
            if (ev.key.includes('clients')) {
                setTimeout(() => {
                    loadClientsTable();
                    showNotification('Lista de clientes atualizada (sincronização entre abas).', 'info');
                }, 100);
            }
            // also update products if needed
            if (ev.key.includes('products')) {
                setTimeout(() => {
                    loadProductsTable();
                    loadRedeemProductOptions();
                }, 100);
            }
        } catch (err) {
            console.warn('Erro ao processar storage event (clients):', err);
        }
    });

    loadClientsTable();
}

function loadClientsTable() {
    const tbody = $id('clientsTableBody');
    if (!tbody) return;
    const clients = getAllClients() || [];

    if (clients.length === 0) {
        if ($id('clientsList')) $id('clientsList').style.display = 'none';
        if ($id('emptyClients')) $id('emptyClients').style.display = 'block';
        tbody.innerHTML = '';
        return;
    }

    if ($id('clientsList')) $id('clientsList').style.display = 'block';
    if ($id('emptyClients')) $id('emptyClients').style.display = 'none';

    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${escapeHtml(client.name)}</td>
            <td>${escapeHtml(client.phone)}</td>
            <td>${client.points || 0}</td>
            <td>${getLevelLabel(client.level)}</td>
            <td>${formatDateOnly(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--manage" data-action="manage-points" data-id="${client.id}">Pontos</button>
                    <button class="table-btn table-btn--edit" data-action="edit-client" data-id="${client.id}">Editar</button>
                    <button class="table-btn table-btn--delete" data-action="delete-client" data-id="${client.id}">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'manage-points') btn.onclick = () => managePoints(id);
        if (action === 'edit-client') btn.onclick = () => editClient(id);
        if (action === 'delete-client') btn.onclick = () => {
            showConfirmDialog('Deletar Cliente?', 'Esta ação não pode ser desfeita e todos os pontos serão perdidos.', () => {
                deleteClient(id);
                showNotification('✓ Cliente deletado!', 'success');
                loadClientsTable();
                loadDashboard();
            });
        };
    });
}

window.editClient = function(clientId) {
    const client = getClientById(clientId);
    if (!client) return;
    const form = $id('clientForm');
    if (!form) return;

    $id('clientModalTitle').textContent = 'Editar Cliente';
    if ($id('clientName')) $id('clientName').value = client.name || '';
    if ($id('clientPhone')) $id('clientPhone').value = client.phone || '';
    if ($id('clientEmail')) $id('clientEmail').value = client.email || '';
    if ($id('clientPassword')) $id('clientPassword').value = client.password || '';
    if ($id('clientPoints')) $id('clientPoints').value = client.points || 0;
    if ($id('clientActive')) $id('clientActive').checked = !!client.active;

    form.dataset.clientId = clientId;
    const hint = $id('passwordHint');
    if (hint) hint.textContent = '(Deixe em branco para manter a senha atual)';
    openModal('clientModal');
};

window.managePoints = function(clientId) {
    const client = getClientById(clientId);
    if (!client) return;
    const modal = $id('pointsModal');
    const form = $id('pointsForm');
    if (!modal || !form) return;

    if ($id('pointsClientId')) $id('pointsClientId').value = clientId;
    if ($id('pointsClientInfo')) $id('pointsClientInfo').textContent = `${client.name} - Saldo atual: ${client.points} pontos`;
    if ($id('pointsAmount')) $id('pointsAmount').value = '';
    if ($id('pointsReason')) $id('pointsReason').value = '';

    const closeBtn = $id('closePointsModal');
    if (closeBtn) closeBtn.onclick = () => closeModal('pointsModal');

    form.onsubmit = (e) => {
        e.preventDefault();
        const amount = parseInt($id('pointsAmount').value) || 0;
        const reason = $id('pointsReason').value || '';
        addPointsToClient(clientId, amount, reason);
        showNotification('✓ Pontos atualizados!', 'success');
        closeModal('pointsModal');
        loadClientsTable();
        loadDashboard();
    };

    openModal('pointsModal');
};

function formatDateOnly(dateString) {
    try {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (err) {
        return '-';
    }
}

function getLevelLabel(level) {
    const labels = {
        bronze: '🥉 Bronze',
        silver: '🥈 Prata',
        gold: '🥇 Ouro',
        platinum: '💎 Platina'
    };
    return labels[level] || 'Bronze';
}

// ================================
// PROMOTIONS
// ================================
function setupPromotionsSection() {
    const addBtn = $id('addPromotionBtn');
    const modal = $id('promotionModal');
    const form = $id('promotionForm');
    const closeBtn = $id('closePromotionModal');

    if (!form || !addBtn) return;

    addBtn.addEventListener('click', () => {
        form.reset();
        form.dataset.promotionId = '';
        if ($id('promotionModalTitle')) $id('promotionModalTitle').textContent = 'Nova Promoção';
        openModal('promotionModal');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => closeModal('promotionModal'));

    // submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = $id('promotionPhoto');
        let photoValue = '';

        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                photoValue = await readFileAsDataURL(fileInput.files[0]);
            } catch (err) {
                console.warn('Falha ao processar arquivo de imagem:', err);
                showNotification('Erro ao ler imagem, promoção será salva sem imagem.', 'warning');
            }
        }

        // image optional: keep '' if none
        if (!photoValue) photoValue = '';

        const promotionData = {
            name: ($id('promotionName') && $id('promotionName').value) ? $id('promotionName').value.trim() : '',
            value: ($id('promotionValue') && $id('promotionValue').value) ? $id('promotionValue').value.trim() : '',
            description: ($id('promotionDescription') && $id('promotionDescription').value) ? $id('promotionDescription').value.trim() : '',
            photo: photoValue,
            instagramLink: ($id('promotionInstagramLink') && $id('promotionInstagramLink').value) ? $id('promotionInstagramLink').value.trim() : '',
            active: !!($id('promotionActive') && $id('promotionActive').checked)
        };

        const promotionId = form.dataset.promotionId;
        if (promotionId) {
            updatePromotion(parseInt(promotionId), promotionData);
            showNotification('✓ Promoção atualizada!', 'success');
        } else {
            addPromotion(promotionData);
            showNotification('✓ Promoção criada!', 'success');
        }

        if (fileInput) fileInput.value = '';
        closeModal('promotionModal');
        loadPromotionsTable();
    });

    loadPromotionsTable();
}

function loadPromotionsTable() {
    const tbody = $id('promotionsTableBody');
    if (!tbody) return;

    const promotions = getAllPromotions() || [];
    tbody.innerHTML = promotions.map(promo => `
        <tr>
            <td>${promo.photo ? `<img src="${promo.photo}" class="table-image-small" onerror="this.src='${DEFAULT_PROMO_IMG}'">` : `<span style="color:#777">Sem imagem</span>`}</td>
            <td>${escapeHtml(promo.name)}</td>
            <td>${escapeHtml(promo.value)}</td>
            <td>${truncateText(promo.description || '', 50)}</td>
            <td><span class="status-badge ${promo.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${promo.active ? 'Ativa' : 'Inativa'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--edit" data-action="edit-promo" data-id="${promo.id}">Editar</button>
                    <button class="table-btn table-btn--delete" data-action="delete-promo" data-id="${promo.id}">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'edit-promo') btn.onclick = () => openEditPromotion(id);
        if (action === 'delete-promo') btn.onclick = () => {
            showConfirmDialog('Deletar Promoção?', 'Esta ação não pode ser desfeita.', () => {
                deletePromotion(id);
                showNotification('✓ Promoção deletada!', 'success');
                loadPromotionsTable();
            });
        };
    });
}

function openEditPromotion(promoId) {
    const promo = getAllPromotions().find(p => p.id === promoId);
    if (!promo) return;
    const form = $id('promotionForm');
    if (!form) return;

    $id('promotionModalTitle').textContent = 'Editar Promoção';
    if ($id('promotionName')) $id('promotionName').value = promo.name || '';
    if ($id('promotionValue')) $id('promotionValue').value = promo.value || '';
    if ($id('promotionDescription')) $id('promotionDescription').value = promo.description || '';
    if ($id('promotionInstagramLink')) $id('promotionInstagramLink').value = promo.instagramLink || '';
    if ($id('promotionActive')) $id('promotionActive').checked = !!promo.active;

    form.dataset.promotionId = promoId;
    openModal('promotionModal');
}

function truncateText(text, max) {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
}

// ================================
// REDEEMS
// ================================
function setupRedeemSection() {
    const addBtn = $id('addRedeemBtn');
    const modal = $id('redeemModal');
    const form = $id('redeemForm');
    const closeBtn = $id('closeRedeemModal');
    const productSelect = $id('redeemProduct');

    if (!form || !addBtn) return;

    loadRedeemsTable();
    loadRedeemProductOptions();

    addBtn.addEventListener('click', () => {
        form.reset();
        form.dataset.redeemId = '';
        openModal('redeemModal');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => closeModal('redeemModal'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedProductId = $id('redeemProduct') ? $id('redeemProduct').value : '';
        if (!selectedProductId) {
            showNotification('Selecione um produto válido.', 'error');
            return;
        }
        const selectedProduct = getProductById(parseInt(selectedProductId));
        if (!selectedProduct) {
            showNotification('Produto selecionado não encontrado.', 'error');
            return;
        }

        const redeemData = {
            productId: parseInt(selectedProductId),
            pointsRequired: parseInt($id('redeemPointsRequired') ? $id('redeemPointsRequired').value : 0) || 0,
            active: !!($id('redeemActive') && $id('redeemActive').checked)
        };

        const redeemId = form.dataset.redeemId;
        if (redeemId) {
            updateRedeem(parseInt(redeemId), redeemData);
            showNotification('✓ Resgate atualizado!', 'success');
        } else {
            addRedeem(redeemData);
            showNotification('✓ Resgate criado!', 'success');
        }

        closeModal('redeemModal');
        loadRedeemsTable();
    });
}

function loadRedeemsTable() {
    const tbody = $id('redeemsTableBody');
    if (!tbody) return;
    const redeems = getAllRedeems() || [];

    tbody.innerHTML = redeems.map(redeem => {
        const product = getProductById(redeem.productId);
        const productName = product ? product.name : 'Produto não encontrado';
        return `
            <tr>
                <td>${escapeHtml(productName)}</td>
                <td>${redeem.pointsRequired}</td>
                <td><span class="status-badge ${redeem.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${redeem.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn table-btn--edit" data-action="edit-redeem" data-id="${redeem.id}">Editar</button>
                        <button class="table-btn table-btn--delete" data-action="delete-redeem" data-id="${redeem.id}">Deletar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'edit-redeem') btn.onclick = () => openEditRedeem(id);
        if (action === 'delete-redeem') btn.onclick = () => {
            showConfirmDialog('Deletar Resgate?', 'Esta ação não pode ser desfeita.', () => {
                deleteRedeem(id);
                showNotification('✓ Resgate deletado!', 'success');
                loadRedeemsTable();
            });
        };
    });
}

function openEditRedeem(redeemId) {
    const redeem = getAllRedeems().find(r => r.id === redeemId);
    if (!redeem) return;
    const form = $id('redeemForm');
    if (!form) return;

    if ($id('redeemProduct')) $id('redeemProduct').value = redeem.productId || '';
    if ($id('redeemPointsRequired')) $id('redeemPointsRequired').value = redeem.pointsRequired || 0;
    if ($id('redeemActive')) $id('redeemActive').checked = !!redeem.active;

    form.dataset.redeemId = redeemId;
    openModal('redeemModal');
}

function loadRedeemProductOptions() {
    const productSelect = $id('redeemProduct');
    if (!productSelect) return;
    const products = getAllProducts() || [];
    productSelect.innerHTML = '<option value="">Selecione um produto</option>' +
        products.map(product => `<option value="${product.id}">${escapeHtml(product.name)}</option>`).join('');
}

// ================================
// SETTINGS
// ================================
function setupSettings() {
    const settings = getSettings() || {};

    if ($id('pointsPerReal')) $id('pointsPerReal').value = settings.pointsPerReal || 0.1;
    if ($id('bonusRegistration')) $id('bonusRegistration').value = settings.bonusRegistration || 50;
    if ($id('referralBonus')) $id('referralBonus').value = settings.referralBonus || 50;

    const pointsForm = $id('pointsSettingsForm');
    if (pointsForm) pointsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            pointsPerReal: parseFloat($id('pointsPerReal').value),
            bonusRegistration: parseInt($id('bonusRegistration').value),
            referralBonus: parseInt($id('referralBonus').value)
        });
        showNotification('✓ Configurações de pontos salvas!', 'success');
    });

    if ($id('silverLevel')) $id('silverLevel').value = settings.levels?.silver || 100;
    if ($id('goldLevel')) $id('goldLevel').value = settings.levels?.gold || 300;
    if ($id('platinumLevel')) $id('platinumLevel').value = settings.levels?.platinum || 500;

    const levelsForm = $id('levelsSettingsForm');
    if (levelsForm) levelsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            levels: {
                bronze: 0,
                silver: parseInt($id('silverLevel').value),
                gold: parseInt($id('goldLevel').value),
                platinum: parseInt($id('platinumLevel').value)
            }
        });
        showNotification('✓ Níveis atualizados!', 'success');
    });

    if ($id('storeName')) $id('storeName').value = settings.storeName || '';
    if ($id('storeAddress')) $id('storeAddress').value = settings.storeAddress || '';
    if ($id('storePhone')) $id('storePhone').value = settings.storePhone || '';
    if ($id('storeHours')) $id('storeHours').value = settings.storeHours || '';

    const storeForm = $id('storeInfoForm');
    if (storeForm) storeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            storeName: $id('storeName').value,
            storeAddress: $id('storeAddress').value,
            storePhone: $id('storePhone').value,
            storeHours: $id('storeHours').value
        });
        showNotification('✓ Informações salvas!', 'success');
    });

    const exportBtn = $id('exportDataBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => {
        const data = exportAllData();
        downloadJSON(data, `joburguers-backup-${new Date().toISOString().split('T')[0]}.json`);
        showNotification('✓ Dados exportados!', 'success');
    });

    const importBtn = $id('importDataBtn');
    if (importBtn) importBtn.addEventListener('click', () => {
        if ($id('importFile')) $id('importFile').click();
    });

    const importFile = $id('importFile');
    if (importFile) {
        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = await readJSONFile(file);
                importAllData(data);
                showNotification('✓ Dados importados com sucesso!', 'success');
                location.reload();
            } catch (error) {
                showNotification('✗ Erro ao importar dados', 'error');
            }
        });
    }

    const resetBtn = $id('resetDataBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        showConfirmDialog('Limpar todos os dados?', 'Isso removerá TODOS os dados. Deseja continuar?', () => {
            clearAllData();
            location.reload();
        });
    });
}

// ================================
// Utilities e helpers
// ================================
function openModal(id, title) {
    const modal = $id(id);
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('data-open', 'true');
    if (title) {
        const titleEl = modal.querySelector('h2');
        if (titleEl) titleEl.textContent = title;
    }
}

function closeModal(id) {
    const modal = $id(id);
    if (!modal) return;
    modal.style.display = 'none';
    modal.removeAttribute('data-open');
    // clear dataset of any forms inside (optional)
    const form = modal.querySelector('form');
    if (form) form.removeAttribute('data-id');
}

function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncateText(text, max) {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
}

// basic sanity: text only
function formatDate(date) {
    try {
        return new Date(date).toLocaleString('pt-BR');
    } catch (err) {
        return '-';
    }
}

// small helper for escaping when injecting into attributes/text
function getProductPlaceholder() {
    return DEFAULT_THUMB;
}

// Ensure redeem product options updated (call after products change)
loadRedeemProductOptions(); // initial attempt (no-op if missing)

// small helper to escape and shorten
function truncateTextInline(s, n = 30) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n) + '...' : s;
}
