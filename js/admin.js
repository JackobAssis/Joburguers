/**
 * ADMIN.JS - Painel Administrativo Completo
 * Gerencia produtos, clientes, promoções e configurações
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

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();

    const session = getCurrentSession();
    if (!session || session.userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminUsername').textContent = 'Admin';
    
    setupNavigation();
    setupLogout();
    loadDashboard();
    setupProductsSection();
    setupClientsSection();
    setupPromotionsSection();
    setupRedeemSection();
    setupSettings();
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

function loadDashboard() {
    const products = getAllProducts();
    const clients = getAllClients();
    const transactions = getAllTransactions();
    const settings = getSettings();

    // Stats
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalClientes').textContent = clients.length;
    
    let totalPoints = 0;
    clients.forEach(c => totalPoints += c.points);
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('recentTransactions').textContent = transactions.slice(-10).length;

    // Atividades recentes
    const recentActivities = document.getElementById('recentActivities');
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

// ========================================
// PRODUTOS
// ========================================

function setupProductsSection() {
    const addBtn = document.getElementById('addProductBtn');
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('productCategoryFilter');
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const closeBtn = document.getElementById('closeProductModal');

    if (!addBtn) return;

    // Carregar produtos
    loadProductsTable();

    // Adicionar novo
    addBtn.addEventListener('click', () => {
        document.getElementById('productModalTitle').textContent = 'Novo Produto';
        form.reset();
        form.dataset.productId = '';
        modal.style.display = 'flex';
    });

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Salvar produto
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value,
            ingredients: document.getElementById('productIngredients').value
                .split(',')
                .map(ing => ing.trim())
                .filter(ing => ing),
            available: document.getElementById('productAvailable').checked
        };

        const productId = form.dataset.productId;
        if (productId) {
            updateProduct(parseInt(productId), productData);
            showNotification('✓ Produto atualizado!', 'success');
        } else {
            addProduct(productData);
            showNotification('✓ Produto criado!', 'success');
        }

        modal.style.display = 'none';
        loadProductsTable();
    });

    // Filtros e busca
    searchInput.addEventListener('input', () => filterProducts());
    categoryFilter.addEventListener('change', () => filterProducts());
}

function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    const products = getAllProducts();

    if (products.length === 0) {
        document.getElementById('productsList').style.display = 'none';
        document.getElementById('emptyProducts').style.display = 'block';
        return;
    }

    document.getElementById('productsList').style.display = 'block';
    document.getElementById('emptyProducts').style.display = 'none';

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="table-image" onerror="this.src='https://via.placeholder.com/50'"></td>
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
                    <button class="table-btn table-btn--edit" onclick="editProduct(${product.id})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteProductItem(${product.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const category = document.getElementById('productCategoryFilter').value;
    let products = getAllProducts();

    products = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });

    renderFilteredProducts(products);
}

function renderFilteredProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="table-image"></td>
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
                    <button class="table-btn table-btn--edit" onclick="editProduct(${product.id})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteProductItem(${product.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editProduct = function(productId) {
    const product = getProductById(productId);
    if (!product) return;

    document.getElementById('productModalTitle').textContent = 'Editar Produto';
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productIngredients').value = (product.ingredients || []).join(', ');
    document.getElementById('productAvailable').checked = product.available;
    document.getElementById('productForm').dataset.productId = productId;

    document.getElementById('productModal').style.display = 'flex';
};

window.deleteProductItem = function(productId) {
    showConfirmDialog(
        'Deletar Produto?',
        'Esta ação não pode ser desfeita.',
        () => {
            deleteProduct(productId);
            showNotification('✓ Produto deletado!', 'success');
            loadProductsTable();
        }
    );
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

function setupClientsSection() {
    const addBtn = document.getElementById('addClientBtn');
    const searchInput = document.getElementById('clientSearch');
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const closeBtn = document.getElementById('closeClientModal');

    if (!addBtn) return;

    loadClientsTable();

    addBtn.addEventListener('click', () => {
        document.getElementById('clientModalTitle').textContent = 'Novo Cliente';
        form.reset();
        form.dataset.clientId = '';
        modal.style.display = 'flex';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const clientData = {
            name: document.getElementById('clientName').value,
            phone: formatPhone(document.getElementById('clientPhone').value),
            email: document.getElementById('clientEmail').value,
            points: parseInt(document.getElementById('clientPoints').value) || 0,
            active: document.getElementById('clientActive').checked
        };

        const clientId = form.dataset.clientId;
        if (clientId) {
            updateClient(parseInt(clientId), clientData);
            showNotification('✓ Cliente atualizado!', 'success');
        } else {
            addClient(clientData);
            showNotification('✓ Cliente criado!', 'success');
        }

        modal.style.display = 'none';
        loadClientsTable();
    });

    searchInput.addEventListener('input', filterClients);
}

function loadClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    const clients = getAllClients();

    if (clients.length === 0) {
        document.getElementById('clientsList').style.display = 'none';
        document.getElementById('emptyClients').style.display = 'block';
        return;
    }

    document.getElementById('clientsList').style.display = 'block';
    document.getElementById('emptyClients').style.display = 'none';

    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.points}</td>
            <td>${getLevelLabel(client.level)}</td>
            <td>${formatDateOnly(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--manage" onclick="managePoints(${client.id})">Pontos</button>
                    <button class="table-btn table-btn--edit" onclick="editClient(${client.id})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteClientItem(${client.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterClients() {
    const search = document.getElementById('clientSearch').value.toLowerCase();
    let clients = getAllClients();

    clients = clients.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search)
    );

    renderFilteredClients(clients);
}

function renderFilteredClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.points}</td>
            <td>${getLevelLabel(client.level)}</td>
            <td>${formatDateOnly(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--manage" onclick="managePoints(${client.id})">Pontos</button>
                    <button class="table-btn table-btn--edit" onclick="editClient(${client.id})">Editar</button>
                    <button class="table-btn table-btn--delete" onclick="deleteClientItem(${client.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editClient = function(clientId) {
    const client = getClientById(clientId);
    if (!client) return;

    document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPoints').value = client.points;
    document.getElementById('clientActive').checked = client.active;
    document.getElementById('clientForm').dataset.clientId = clientId;

    document.getElementById('clientModal').style.display = 'flex';
};

window.deleteClientItem = function(clientId) {
    showConfirmDialog(
        'Deletar Cliente?',
        'Esta ação não pode ser desfeita e todos os pontos serão perdidos.',
        () => {
            deleteClient(clientId);
            showNotification('✓ Cliente deletado!', 'success');
            loadClientsTable();
        }
    );
};

window.managePoints = function(clientId) {
    const client = getClientById(clientId);
    if (!client) return;

    const modal = document.getElementById('pointsModal');
    const form = document.getElementById('pointsForm');

    document.getElementById('pointsClientId').value = clientId;
    document.getElementById('pointsClientInfo').textContent = `${client.name} - Saldo atual: ${client.points} pontos`;
    document.getElementById('pointsAmount').value = '';
    document.getElementById('pointsReason').value = '';

    const closeBtn = document.getElementById('closePointsModal');
    if (closeBtn) {
        closeBtn.onclick = () => { modal.style.display = 'none'; };
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const amount = parseInt(document.getElementById('pointsAmount').value);
        addPointsToClient(clientId, amount, document.getElementById('pointsReason').value);
        showNotification('✓ Pontos atualizados!', 'success');
        modal.style.display = 'none';
        loadClientsTable();
    };

    modal.style.display = 'flex';
};

function formatDateOnly(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

// ========================================
// PROMOÇÕES
// ========================================

function setupPromotionsSection() {
    const addBtn = document.getElementById('addPromotionBtn');
    if (!addBtn) return;

    loadPromotionsTable();

    addBtn.addEventListener('click', () => {
        const name = prompt('Nome da promoção:');
        if (!name) return;

        const description = prompt('Descrição:');
        if (!description) return;

        const discount = prompt('Desconto (%):');
        if (!discount) return;

        const startDate = prompt('Data início (YYYY-MM-DD):');
        const endDate = prompt('Data fim (YYYY-MM-DD):');

        const promotion = {
            name,
            description,
            discount: parseInt(discount),
            startDate: startDate || new Date().toISOString(),
            endDate: endDate || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            active: true
        };

        addPromotion(promotion);
        showNotification('✓ Promoção criada!', 'success');
        loadPromotionsTable();
    });
}

function loadPromotionsTable() {
    const tbody = document.getElementById('promotionsTableBody');
    const promotions = getAllPromotions();

    tbody.innerHTML = promotions.map(promo => `
        <tr>
            <td>${promo.name}</td>
            <td>${truncateText(promo.description, 50)}</td>
            <td>${promo.discount}%</td>
            <td>${formatDateOnly(promo.startDate)}</td>
            <td>${formatDateOnly(promo.endDate)}</td>
            <td><span class="status-badge ${promo.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${promo.active ? 'Ativa' : 'Inativa'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--delete" onclick="deletePromoItem(${promo.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.deletePromoItem = function(promoId) {
    deletePromotion(promoId);
    showNotification('✓ Promoção deletada!', 'success');
    loadPromotionsTable();
};

function truncateText(text, max) {
    return text.length > max ? text.substring(0, max) + '...' : text;
}

// ========================================
// RESGATES
// ========================================

function setupRedeemSection() {
    const addBtn = document.getElementById('addRedeemBtn');
    if (!addBtn) return;

    loadRedeemsTable();

    addBtn.addEventListener('click', () => {
        const name = prompt('Nome do resgate:');
        if (!name) return;

        const points = prompt('Pontos necessários:');
        if (!points) return;

        const value = prompt('Valor/Desconto:');
        if (!value) return;

        const redeem = {
            name,
            points: parseInt(points),
            value: parseFloat(value),
            type: 'percentage',
            active: true
        };

        addRedeem(redeem);
        showNotification('✓ Resgate criado!', 'success');
        loadRedeemsTable();
    });
}

function loadRedeemsTable() {
    const tbody = document.getElementById('redeemsTableBody');
    const redeems = getAllRedeems();

    tbody.innerHTML = redeems.map(redeem => `
        <tr>
            <td>${redeem.name}</td>
            <td>${redeem.points}</td>
            <td>${redeem.type === 'percentage' ? redeem.value + '%' : formatCurrency(redeem.value)}</td>
            <td><span class="status-badge ${redeem.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${redeem.active ? 'Ativo' : 'Inativo'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn table-btn--delete" onclick="deleteRedeemItem(${redeem.id})">Deletar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.deleteRedeemItem = function(redeemId) {
    deleteRedeem(redeemId);
    showNotification('✓ Resgate deletado!', 'success');
    loadRedeemsTable();
};

// ========================================
// CONFIGURAÇÕES
// ========================================

function setupSettings() {
    const settings = getSettings();

    // Pontos
    document.getElementById('pointsPerReal').value = settings.pointsPerReal;
    document.getElementById('bonusRegistration').value = settings.bonusRegistration;
    document.getElementById('referralBonus').value = settings.referralBonus;

    document.getElementById('pointsSettingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            pointsPerReal: parseFloat(document.getElementById('pointsPerReal').value),
            bonusRegistration: parseInt(document.getElementById('bonusRegistration').value),
            referralBonus: parseInt(document.getElementById('referralBonus').value)
        });
        showNotification('✓ Configurações de pontos salvas!', 'success');
    });

    // Níveis
    document.getElementById('silverLevel').value = settings.levels.silver;
    document.getElementById('goldLevel').value = settings.levels.gold;
    document.getElementById('platinumLevel').value = settings.levels.platinum;

    document.getElementById('levelsSettingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            levels: {
                bronze: 0,
                silver: parseInt(document.getElementById('silverLevel').value),
                gold: parseInt(document.getElementById('goldLevel').value),
                platinum: parseInt(document.getElementById('platinumLevel').value)
            }
        });
        showNotification('✓ Níveis atualizados!', 'success');
    });

    // Informações da Loja
    document.getElementById('storeName').value = settings.storeName;
    document.getElementById('storeAddress').value = settings.storeAddress;
    document.getElementById('storePhone').value = settings.storePhone;
    document.getElementById('storeHours').value = settings.storeHours;

    document.getElementById('storeInfoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateSettings({
            storeName: document.getElementById('storeName').value,
            storeAddress: document.getElementById('storeAddress').value,
            storePhone: document.getElementById('storePhone').value,
            storeHours: document.getElementById('storeHours').value
        });
        showNotification('✓ Informações salvas!', 'success');
    });

    // Export/Import
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        const data = exportAllData();
        downloadJSON(data, `joburguers-backup-${new Date().toISOString().split('T')[0]}.json`);
        showNotification('✓ Dados exportados!', 'success');
    });

    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', async (e) => {
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

    document.getElementById('resetDataBtn').addEventListener('click', () => {
        clearAllData();
        location.reload();
    });
}
