/**
 * ADMIN.JS - Painel Administrativo Completo (corrigido)
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
    uploadPromotionPhoto,
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
    readJSONFile,
    truncateText
} from './utils.js';
import renderPromocoes from './promocoes.js';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeStorage();

    const session = getCurrentSession();
    if (!session || session.userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const adminUsernameEl = document.getElementById('adminUsername');
    if (adminUsernameEl) adminUsernameEl.textContent = 'Admin';

    setupNavigation();
    setupLogout();
    await loadDashboard();
    await setupProductsSection();
    await setupClientsSection();
    await setupPromotionsSection();
    await setupRedeemSection();
    await setupSettings();
});

// ========================================
// NAVEGAÇÃO
// ========================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav__item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;

            navItems.forEach(i => i.classList.remove('admin-nav__item--active'));
            item.classList.add('admin-nav__item--active');

            document.querySelectorAll('.admin-section').forEach(sec => {
                sec.classList.remove('admin-section--active');
            });

            const sectionEl = document.getElementById(section);
            if (sectionEl) {
                sectionEl.classList.add('admin-section--active');
            }
        });
    });
}

// ========================================
// LOGOUT
// ========================================

function setupLogout() {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.href = 'index.html';
        });
    }
}

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {
    const products = Array.isArray(await getAllProducts()) ? await getAllProducts() : [];
    const clientsObj = await getAllClients();
    const clients = Array.isArray(clientsObj) ? clientsObj : (clientsObj ? Object.values(clientsObj) : []);
    const transactions = getAllTransactions() || [];
    const settings = await getSettings();

    // Stats
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) totalProductsEl.textContent = products.length;

    const totalClientesEl = document.getElementById('totalClientes');
    if (totalClientesEl) totalClientesEl.textContent = clients.length;

    let totalPoints = 0;
    clients.forEach(c => totalPoints += Number(c.points || 0));
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = totalPoints;

    const recentTransactionsEl = document.getElementById('recentTransactions');
    if (recentTransactionsEl) recentTransactionsEl.textContent = (transactions.slice(-10) || []).length;

    // Atividades recentes
    const recentActivities = document.getElementById('recentActivities');
    const recent = (transactions.slice(-5) || []).reverse();

    if (!recentActivities) return;

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

// ========================================
// PRODUTOS
// ========================================

async function setupProductsSection() {
    const addBtn = document.getElementById('addProductBtn');
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('productCategoryFilter');
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const closeBtn = document.getElementById('closeProductModal');

    if (!addBtn) return;

    // Carregar produtos
    const products = await getAllProducts();
    loadProductsTable(Array.isArray(products) ? products : []);

    // Adicionar novo
    addBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('productModalTitle');
        if (titleEl) titleEl.textContent = 'Novo Produto';
        if (form) form.reset();
        if (form) form.dataset.productId = '';
        if (modal) modal.style.display = 'flex';
    });

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    // Função para ler arquivo como DataURL
    async function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    // Salvar produto
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Verificar se foi feito upload de arquivo
            const fileInput = document.getElementById('productImageFile');
            let imageValue = document.getElementById('productImage').value || '';

            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    const dataUrl = await readFileAsDataURL(fileInput.files[0]);
                    imageValue = dataUrl; // sobrescreve com data URL
                } catch (err) {
                    console.warn('Falha ao processar arquivo de imagem:', err);
                    showNotification('Erro ao ler imagem enviada. Tente novamente.', 'error');
                    return;
                }
            }

            // Se ainda não tiver imagem, usar placeholder
            if (!imageValue) {
                imageValue = `https://via.placeholder.com/400x300?text=${encodeURIComponent('Sem Imagem')}`;
            }

            const productData = {
                name: (document.getElementById('productName') && document.getElementById('productName').value) || '',
                category: (document.getElementById('productCategory') && document.getElementById('productCategory').value) || '',
                price: parseFloat((document.getElementById('productPrice') && document.getElementById('productPrice').value) || 0),
                image: imageValue,
                description: (document.getElementById('productDescription') && document.getElementById('productDescription').value) || '',
                ingredients: ((document.getElementById('productIngredients') && document.getElementById('productIngredients').value) || '')
                    .split(',')
                    .map(ing => ing.trim())
                    .filter(ing => ing),
                available: !!(document.getElementById('productAvailable') && document.getElementById('productAvailable').checked)
            };

            const productId = form.dataset.productId;
            if (productId) {
                await updateProduct(String(productId), productData);
                showNotification('✓ Produto atualizado!', 'success');
            } else {
                await addProduct(productData);
                showNotification('✓ Produto criado!', 'success');
            }

            // Resetar input de arquivo para evitar reuso não intencional
            if (fileInput) fileInput.value = '';

            if (modal) modal.style.display = 'none';
            loadProductsTable(await getAllProducts());
        });
    }

    // Filtros e busca (chamadas async)
    if (searchInput) searchInput.addEventListener('input', async () => await filterProducts());
    if (categoryFilter) categoryFilter.addEventListener('change', async () => await filterProducts());
}

function buildProductRowHtml(product) {
    // usaremos JSON.stringify para garantir que a string de ID seja colocada corretamente nos handlers inline
    const safeId = JSON.stringify(String(product.id));
    const imgSrc = product.image ? String(product.image) : `https://via.placeholder.com/400x300?text=${encodeURIComponent('Sem Imagem')}`;
    // fallback onerror altera para thumbnail
    return `
        <tr>
            <td><img src="${imgSrc}" alt="${product.name}" class="table-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/50'"></td>
            <td>${product.name}</td>
            <td>${getCategoryLabel(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="status-badge status-badge--${product.available ? 'disponivel' : 'indisponivel'}">
                    ${product.available ? 'Disponível' : 'Indisponível'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--edit" onclick="editProduct(${safeId})">Editar</button>
                    <button class="table-btn table-btn--duplicate" onclick="duplicateProduct(${safeId})">Duplicar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteProductItem(${safeId})">Deletar</button>
                </div>
            </td>
        </tr>
    `;
}

function loadProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    const list = Array.isArray(products) ? products : [];

    const productsListEl = document.getElementById('productsList');
    const emptyProductsEl = document.getElementById('emptyProducts');

    if (!tbody) return;

    if (list.length === 0) {
        if (productsListEl) productsListEl.style.display = 'none';
        if (emptyProductsEl) emptyProductsEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }

    if (productsListEl) productsListEl.style.display = 'block';
    if (emptyProductsEl) emptyProductsEl.style.display = 'none';

    tbody.innerHTML = list.map(product => buildProductRowHtml(product)).join('');
}

async function filterProducts() {
    const searchEl = document.getElementById('productSearch');
    const categoryEl = document.getElementById('productCategoryFilter');
    const search = (searchEl && searchEl.value.toLowerCase()) || '';
    const category = (categoryEl && categoryEl.value) || '';

    let products = await getAllProducts();
    products = Array.isArray(products) ? products : [];

    products = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const matchSearch = name.includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });

    renderFilteredProducts(products);
}

function renderFilteredProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    const list = Array.isArray(products) ? products : [];
    tbody.innerHTML = list.map(product => buildProductRowHtml(product)).join('');
}

window.editProduct = async function(productId) {
    // Não converter para número (IDs do Firestore são strings)
    const pid = String(productId);
    const product = await getProductById(pid);
    if (!product) return;

    const titleEl = document.getElementById('productModalTitle');
    if (titleEl) titleEl.textContent = 'Editar Produto';

    const setIf = (selector, value) => {
        const el = document.getElementById(selector);
        if (!el) return;
        if ('value' in el) el.value = value;
        else el.textContent = value;
    };

    setIf('productName', product.name || '');
    setIf('productCategory', product.category || '');
    setIf('productPrice', product.price || 0);
    setIf('productImage', product.image || '');
    const fileInput = document.getElementById('productImageFile');
    if (fileInput) fileInput.value = '';
    setIf('productDescription', product.description || '');
    setIf('productIngredients', (product.ingredients || []).join(', '));
    const availableEl = document.getElementById('productAvailable');
    if (availableEl) availableEl.checked = !!product.available;
    const form = document.getElementById('productForm');
    if (form) form.dataset.productId = pid;

    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'flex';
};

window.deleteProductItem = async function(productId) {
    const pid = String(productId);
    showConfirmDialog(
        'Deletar Produto?',
        'Esta ação não pode ser desfeita.',
        async () => {
            await deleteProduct(pid);
            showNotification('✓ Produto deletado!', 'success');
            loadProductsTable(await getAllProducts());
        }
    );
};

window.duplicateProduct = async function(productId) {
    const pid = String(productId);
    const product = await getProductById(pid);
    if (!product) return;

    const duplicatedProduct = {
        ...product,
        name: `${product.name} (Cópia)`
    };

    // Remove id so addProduct creates a new one
    delete duplicatedProduct.id;

    await addProduct(duplicatedProduct);
    showNotification('✓ Produto duplicado!', 'success');
    loadProductsTable(await getAllProducts());
};

function getCategoryLabel(category) {
    const labels = {
        hamburguer: 'Hambúrguer',
        bebida: 'Bebida',
        combo: 'Combo',
        acompanhamento: 'Acompanhamento'
    };
    return labels[category] || category;
}

// ========================================
// CLIENTES
// ========================================

async function setupClientsSection() {
    const addBtn = document.getElementById('addClientBtn');
    const searchInput = document.getElementById('clientSearch');
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const closeBtn = document.getElementById('closeClientModal');

    if (!addBtn) return;

    await loadClientsTable();

    addBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('clientModalTitle');
        if (titleEl) titleEl.textContent = 'Novo Cliente';
        if (form) form.reset();
        if (form) form.dataset.clientId = '';
        if (modal) modal.style.display = 'flex';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const clientData = {
                name: (document.getElementById('clientName') && document.getElementById('clientName').value) || '',
                phone: formatPhone((document.getElementById('clientPhone') && document.getElementById('clientPhone').value) || ''),
                email: (document.getElementById('clientEmail') && document.getElementById('clientEmail').value) || '',
                password: (document.getElementById('clientPassword') && document.getElementById('clientPassword').value) || null,
                points: parseInt((document.getElementById('clientPoints') && document.getElementById('clientPoints').value) || 0) || 0,
                active: !!(document.getElementById('clientActive') && document.getElementById('clientActive').checked)
            };

            const clientId = form.dataset.clientId;
            if (clientId) {
                // Ao editar, não sobrescrever senha se estiver vazia
                if (!clientData.password) {
                    delete clientData.password;
                }
                await updateClient(String(clientId), clientData);
                showNotification('✓ Cliente atualizado!', 'success');
            } else {
                await addClient(clientData);
                showNotification('✓ Cliente criado com sucesso! Pode fazer login agora.', 'success');
            }

            if (modal) modal.style.display = 'none';
            await loadClientsTable();
        });
    }

    if (searchInput) searchInput.addEventListener('input', async () => await filterClients());

    window.addEventListener('storage', (ev) => {
        try {
            if (!ev.key) return;
            if (ev.key === 'clients_data') {
                setTimeout(async () => {
                    await loadClientsTable();
                    showNotification('Lista de clientes atualizada (sincronização entre abas).', 'info');
                }, 100);
            }
        } catch (err) {
            console.warn('Erro ao processar storage event (clients):', err);
        }
    });
}

async function loadClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    let clients = await getAllClients();
    clients = Array.isArray(clients) ? clients : [];

    const clientsListEl = document.getElementById('clientsList');
    const emptyClientsEl = document.getElementById('emptyClients');

    if (!tbody) return;

    if (clients.length === 0) {
        if (clientsListEl) clientsListEl.style.display = 'none';
        if (emptyClientsEl) emptyClientsEl.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }

    if (clientsListEl) clientsListEl.style.display = 'block';
    if (emptyClientsEl) emptyClientsEl.style.display = 'none';

    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.points}</td>
            <td>${getLevelLabel(client.level)}</td>
            <td>${formatDateOnly(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--manage" onclick="managePoints(${JSON.stringify(String(client.id))})">Pontos</button>
                    <button class="table-btn table-btn--edit" onclick="editClient(${JSON.stringify(String(client.id))})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteClientItem(${JSON.stringify(String(client.id))})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function filterClients() {
    const search = (document.getElementById('clientSearch') && document.getElementById('clientSearch').value.toLowerCase()) || '';
    let clients = await getAllClients();
    clients = Array.isArray(clients) ? clients : [];

    clients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(search) ||
        (c.phone || '').includes(search)
    );

    renderFilteredClients(clients);
}

function renderFilteredClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    const list = Array.isArray(clients) ? clients : [];
    tbody.innerHTML = list.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.points}</td>
            <td>${getLevelLabel(client.level)}</td>
            <td>${formatDateOnly(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--manage" onclick="managePoints(${JSON.stringify(String(client.id))})">Pontos</button>
                    <button class="table-btn table-btn--edit" onclick="editClient(${JSON.stringify(String(client.id))})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteClientItem(${JSON.stringify(String(client.id))})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editClient = async function(clientId) {
    const cid = String(clientId);
    const client = await getClientById(cid);
    if (!client) return;

    const setIf = (selector, value) => {
        const el = document.getElementById(selector);
        if (!el) return;
        if ('value' in el) el.value = value;
        else el.textContent = value;
    };

    setIf('clientName', client.name || '');
    setIf('clientPhone', client.phone || '');
    setIf('clientEmail', client.email || '');
    setIf('clientPassword', client.password || '');
    setIf('clientPoints', client.points || 0);
    const activeEl = document.getElementById('clientActive');
    if (activeEl) activeEl.checked = !!client.active;
    const form = document.getElementById('clientForm');
    if (form) form.dataset.clientId = cid;

    const hint = document.getElementById('passwordHint');
    if (hint) hint.textContent = '(Deixe em branco para manter a senha atual)';

    const modal = document.getElementById('clientModal');
    if (modal) modal.style.display = 'flex';
};

window.deleteClientItem = async function(clientId) {
    const cid = String(clientId);
    showConfirmDialog(
        'Deletar Cliente?',
        'Esta ação não pode ser desfeita e todos os pontos serão perdidos.',
        async () => {
            await deleteClient(cid);
            showNotification('✓ Cliente deletado!', 'success');
            await loadClientsTable();
        }
    );
};

window.managePoints = async function(clientId) {
    const cid = String(clientId);
    const client = await getClientById(cid);
    if (!client) return;

    const modal = document.getElementById('pointsModal');
    const form = document.getElementById('pointsForm');

    const clientIdInput = document.getElementById('pointsClientId');
    if (clientIdInput) clientIdInput.value = cid;
    const pointsInfo = document.getElementById('pointsClientInfo');
    if (pointsInfo) pointsInfo.textContent = `${client.name} - Saldo atual: ${client.points} pontos`;
    if (document.getElementById('pointsAmount')) document.getElementById('pointsAmount').value = '';
    if (document.getElementById('pointsReason')) document.getElementById('pointsReason').value = '';

    const closeBtn = document.getElementById('closePointsModal');
    if (closeBtn) {
        closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const amount = parseInt((document.getElementById('pointsAmount') && document.getElementById('pointsAmount').value) || 0) || 0;
            await addPointsToClient(cid, amount, (document.getElementById('pointsReason') && document.getElementById('pointsReason').value) || '');
            showNotification('✓ Pontos atualizados!', 'success');
            if (modal) modal.style.display = 'none';
            await loadClientsTable();
        };
    }

    if (modal) modal.style.display = 'flex';
};

function formatDateOnly(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (err) {
        return '';
    }
}

// ========================================
// PROMOÇÕES
// ========================================

async function setupPromotionsSection() {
    const addBtn = document.getElementById('addPromotionBtn');
    const modal = document.getElementById('promotionModal');
    const form = document.getElementById('promotionForm');
    const closeBtn = document.getElementById('closePromotionModal');

    if (!addBtn) return;

    await loadPromotionsTable();

    addBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('promotionModalTitle');
        if (titleEl) titleEl.textContent = 'Nova Promoção';
        if (form) form.reset();
        if (form) form.dataset.promotionId = '';
        if (modal) modal.style.display = 'flex';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fileInput = document.getElementById('promotionPhoto');
            let photoValue = '';

            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    photoValue = await uploadPromotionPhoto(fileInput.files[0]);
                } catch (err) {
                    console.warn('Falha no upload da promoção:', err);
                    showNotification('Erro ao fazer upload da imagem. Tente novamente.', 'error');
                    return;
                }
            }

            const promotionData = {
                name: (document.getElementById('promotionName') && document.getElementById('promotionName').value) || '',
                value: (document.getElementById('promotionValue') && document.getElementById('promotionValue').value) || '',
                description: (document.getElementById('promotionDescription') && document.getElementById('promotionDescription').value) || '',
                photo: photoValue,
                instagramLink: (document.getElementById('promotionInstagramLink') && document.getElementById('promotionInstagramLink').value) || '',
                active: !!(document.getElementById('promotionActive') && document.getElementById('promotionActive').checked)
            };

            const promotionId = form.dataset.promotionId;
            if (promotionId) {
                await updatePromotion(String(promotionId), promotionData);
                showNotification('✓ Promoção atualizada!', 'success');
            } else {
                await addPromotion(promotionData);
                showNotification('✓ Promoção criada!', 'success');
            }

            if (fileInput) fileInput.value = '';

            if (modal) modal.style.display = 'none';
            await loadPromotionsTable();
        });
    }
}

async function loadPromotionsTable() {
    const tbody = document.getElementById('promotionsTableBody');
    let data = await getAllPromotions();
    data = Array.isArray(data) ? data : [];

    if (!tbody) return;

    tbody.innerHTML = data.map(promo => `
        <tr>
            <td>${promo.name}</td>
            <td>${promo.value}</td>
            <td>${truncateText(promo.description || '', 50)}</td>
            <td><span class="status-badge ${promo.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${promo.active ? 'Ativa' : 'Inativa'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--delete" onclick="deletePromoItem(${JSON.stringify(String(promo.id))})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.deletePromoItem = async function(promoId) {
    const pid = String(promoId);
    await deletePromotion(pid);
    showNotification('✓ Promoção deletada!', 'success');
    await loadPromotionsTable();
};

// ========================================
// RESGATES
// ========================================

async function setupRedeemSection() {
    const addBtn = document.getElementById('addRedeemBtn');
    const modal = document.getElementById('redeemModal');
    const form = document.getElementById('redeemForm');
    const closeBtn = document.getElementById('closeRedeemModal');
    const productSelect = document.getElementById('redeemProduct');

    if (!addBtn) return;

    await loadRedeemsTable();

    // Carregar produtos no select
    let products = await getAllProducts();
    products = Array.isArray(products) ? products : [];
    if (productSelect) {
        productSelect.innerHTML = '<option value="">Selecione um produto</option>' +
            products.map(product => `<option value=${JSON.stringify(String(product.id))}>${product.name}</option>`).join('');
    }

    // Adicionar novo resgate
    addBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('redeemModalTitle');
        if (titleEl) titleEl.textContent = 'Novo Resgate';
        if (form) form.reset();
        if (form) form.dataset.redeemId = '';
        if (modal) modal.style.display = 'flex';
    });

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    // Salvar resgate
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectedProductId = (document.getElementById('redeemProduct') && document.getElementById('redeemProduct').value) || '';
            if (!selectedProductId) {
                showNotification('Selecione um produto válido.', 'error');
                return;
            }

            const selectedProduct = await getProductById(String(selectedProductId));
            if (!selectedProduct) {
                showNotification('Selecione um produto válido.', 'error');
                return;
            }

            const redeemData = {
                productId: String(selectedProductId),
                pointsRequired: parseInt((document.getElementById('redeemPointsRequired') && document.getElementById('redeemPointsRequired').value) || 0) || 0,
                active: !!(document.getElementById('redeemActive') && document.getElementById('redeemActive').checked)
            };

            const redeemId = form.dataset.redeemId;
            if (redeemId) {
                await updateRedeem(String(redeemId), redeemData);
                showNotification('✓ Resgate atualizado!', 'success');
            } else {
                await addRedeem(redeemData);
                showNotification('✓ Resgate criado!', 'success');
            }

            if (modal) modal.style.display = 'none';
            await loadRedeemsTable();
        });
    }
}

async function loadRedeemsTable() {
    const tbody = document.getElementById('redeemsTableBody');
    let redeems = await getAllRedeems();
    redeems = Array.isArray(redeems) ? redeems : [];

    if (!tbody) return;

    if (redeems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#808080;">Nenhum resgate cadastrado</td></tr>';
        return;
    }

    const rows = await Promise.all(redeems.map(async redeem => {
        const product = await getProductById(redeem.productId);
        const productName = product ? product.name : 'Produto não encontrado';

        return `
            <tr>
                <td>${productName}</td>
                <td>${redeem.pointsRequired}</td>
                <td><span class="status-badge ${redeem.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${redeem.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn table-btn--delete" onclick="deleteRedeemItem(${JSON.stringify(String(redeem.id))})">Deletar</button>
                    </div>
                </td>
            </tr>
        `;
    }));

    tbody.innerHTML = rows.join('');
}

window.deleteRedeemItem = async function(redeemId) {
    const rid = String(redeemId);
    await deleteRedeem(rid);
    showNotification('✓ Resgate deletado!', 'success');
    await loadRedeemsTable();
};

// ========================================
// CONFIGURAÇÕES
// ========================================

function setupSettings() {
    // getSettings is async - but we will fetch when necessary
    (async () => {
        const settings = await getSettings();

        // Pontos
        if (document.getElementById('pointsPerReal')) document.getElementById('pointsPerReal').value = settings.pointsPerReal;
        if (document.getElementById('bonusRegistration')) document.getElementById('bonusRegistration').value = settings.bonusRegistration;
        if (document.getElementById('referralBonus')) document.getElementById('referralBonus').value = settings.referralBonus;

        const pointsForm = document.getElementById('pointsSettingsForm');
        if (pointsForm) {
            pointsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateSettings({
                    pointsPerReal: parseFloat(document.getElementById('pointsPerReal').value),
                    bonusRegistration: parseInt(document.getElementById('bonusRegistration').value),
                    referralBonus: parseInt(document.getElementById('referralBonus').value)
                });
                showNotification('✓ Configurações de pontos salvas!', 'success');
            });
        }

        // Níveis
        if (document.getElementById('silverLevel')) document.getElementById('silverLevel').value = settings.levels.silver;
        if (document.getElementById('goldLevel')) document.getElementById('goldLevel').value = settings.levels.gold;
        if (document.getElementById('platinumLevel')) document.getElementById('platinumLevel').value = settings.levels.platinum;

        const levelsForm = document.getElementById('levelsSettingsForm');
        if (levelsForm) {
            levelsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateSettings({
                    levels: {
                        bronze: 0,
                        silver: parseInt(document.getElementById('silverLevel').value),
                        gold: parseInt(document.getElementById('goldLevel').value),
                        platinum: parseInt(document.getElementById('platinumLevel').value)
                    }
                });
                showNotification('✓ Níveis atualizados!', 'success');
            });
        }

        // Informações da Loja
        if (document.getElementById('storeName')) document.getElementById('storeName').value = settings.storeName;
        if (document.getElementById('storeAddress')) document.getElementById('storeAddress').value = settings.storeAddress;
        if (document.getElementById('storePhone')) document.getElementById('storePhone').value = settings.storePhone;
        if (document.getElementById('storeHours')) document.getElementById('storeHours').value = settings.storeHours;

        const storeInfoForm = document.getElementById('storeInfoForm');
        if (storeInfoForm) {
            storeInfoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateSettings({
                    storeName: document.getElementById('storeName').value,
                    storeAddress: document.getElementById('storeAddress').value,
                    storePhone: document.getElementById('storePhone').value,
                    storeHours: document.getElementById('storeHours').value
                });
                showNotification('✓ Informações salvas!', 'success');
            });
        }

        // Export/Import
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                const data = await exportAllData();
                downloadJSON(data, `joburguers-backup-${new Date().toISOString().split('T')[0]}.json`);
                showNotification('✓ Dados exportados!', 'success');
            });
        }

        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const importFile = document.getElementById('importFile');
                if (importFile) importFile.click();
            });
        }

        const importFileEl = document.getElementById('importFile');
        if (importFileEl) {
            importFileEl.addEventListener('change', async (e) => {
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

        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                clearAllData();
                location.reload();
            });
        }
    })();
}

// ========================================
// HELPERS
// ========================================

function truncateTextLocal(text, max) {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
}
