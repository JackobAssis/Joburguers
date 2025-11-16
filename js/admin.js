/**
 * ADMIN.JS - Painel Administrativo Completo
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

async function loadDashboard() {
    const products = await getAllProducts();
    const clients = await getAllClients();
    const transactions = getAllTransactions();
    const settings = await getSettings();

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
    loadProductsTable(products);

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
    async function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

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
            imageValue = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
        }

        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            image: imageValue,
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

        // Resetar input de arquivo para evitar reuso não intencional
        if (fileInput) fileInput.value = '';

        modal.style.display = 'none';
        loadProductsTable(await getAllProducts());
    });

    // Filtros e busca
    searchInput.addEventListener('input', () => filterProducts());
    categoryFilter.addEventListener('change', () => filterProducts());
}

function loadProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    const list = products ? Object.values(products) : [];

    if (list.length === 0) {
        document.getElementById('productsList').style.display = 'none';
        document.getElementById('emptyProducts').style.display = 'block';
        return;
    }

    document.getElementById('productsList').style.display = 'block';
    document.getElementById('emptyProducts').style.display = 'none';

    tbody.innerHTML = list.map(product => `
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
    // Limpar possível input de arquivo (não pré-carregamos arquivos por segurança)
    const fileInput = document.getElementById('productImageFile');
    if (fileInput) fileInput.value = '';
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productIngredients').value = (product.ingredients || []).join(', ');
    document.getElementById('productAvailable').checked = product.available;
    document.getElementById('productForm').dataset.productId = productId;

    document.getElementById('productModal').style.display = 'flex';
};

window.deleteProductItem = async function(productId) {
    showConfirmDialog(
        'Deletar Produto?',
        'Esta ação não pode ser desfeita.',
        async () => {
            deleteProduct(productId);
            showNotification('✓ Produto deletado!', 'success');
            loadProductsTable(await getAllProducts());
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
            password: document.getElementById('clientPassword').value || null, // null significa usar padrão
            points: parseInt(document.getElementById('clientPoints').value) || 0,
            active: document.getElementById('clientActive').checked
        };

        const clientId = form.dataset.clientId;
        if (clientId) {
            // Ao editar, não sobrescrever senha se estiver vazia
            if (!clientData.password) {
                delete clientData.password;
            }
            updateClient(parseInt(clientId), clientData);
            showNotification('✓ Cliente atualizado!', 'success');
        } else {
            addClient(clientData);
            showNotification('✓ Cliente criado com sucesso! Pode fazer login agora.', 'success');
        }

        modal.style.display = 'none';
        loadClientsTable();
    });

    searchInput.addEventListener('input', filterClients);

    // Sincronização entre abas: se outra aba/tab alterar os clients (ex.: cliente se registra),
    // o evento 'storage' será disparado e recarregamos a tabela automaticamente.
    // Isso garante que o admin veja novos clientes sem precisar recarregar a página.
    window.addEventListener('storage', (ev) => {
        try {
            if (!ev.key) return; // ignore clear
            if (ev.key === 'clients_data') {
                // Pequeno debounce para evitar múltiplas atualizações quando necessário
                setTimeout(() => {
                    loadClientsTable();
                    showNotification('Lista de clientes atualizada (sincronização entre abas).', 'info');
                }, 100);
            }
        } catch (err) {
            // Não bloqueante
            console.warn('Erro ao processar storage event (clients):', err);
        }
    });
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
    document.getElementById('clientPassword').value = client.password || '';
    document.getElementById('clientPoints').value = client.points;
    document.getElementById('clientActive').checked = client.active;
    document.getElementById('clientForm').dataset.clientId = clientId;
    
    // Mudar texto do hint de senha
    const hint = document.getElementById('passwordHint');
    if (hint) {
        hint.textContent = '(Deixe em branco para manter a senha atual)';
    }

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
    const modal = document.getElementById('promotionModal');
    const form = document.getElementById('promotionForm');
    const closeBtn = document.getElementById('closePromotionModal');

    if (!addBtn) return;

    loadPromotionsTable();

    // Adicionar nova promoção
    addBtn.addEventListener('click', () => {
        document.getElementById('promotionModalTitle').textContent = 'Nova Promoção';
        form.reset();
        form.dataset.promotionId = '';
        modal.style.display = 'flex';
    });

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Salvar promoção
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Verificar se foi feito upload de arquivo
        const fileInput = document.getElementById('promotionPhoto');
        let photoValue = '';

        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                // Usar uploadPromotionPhoto para Firebase Storage
                photoValue = await uploadPromotionPhoto(fileInput.files[0]);
            } catch (err) {
                console.warn('Falha ao fazer upload da foto da promoção:', err);
                showNotification('Erro ao fazer upload da imagem. Tente novamente.', 'error');
                return;
            }
        }

        const promotionData = {
            name: document.getElementById('promotionName').value,
            value: document.getElementById('promotionValue').value,
            description: document.getElementById('promotionDescription').value,
            photo: photoValue,
            instagramLink: document.getElementById('promotionInstagramLink').value,
            active: document.getElementById('promotionActive').checked
        };

        const promotionId = form.dataset.promotionId;
        if (promotionId) {
            updatePromotion(parseInt(promotionId), promotionData);
            showNotification('✓ Promoção atualizada!', 'success');
        } else {
            addPromotion(promotionData);
            showNotification('✓ Promoção criada!', 'success');
        }

        // Resetar input de arquivo
        if (fileInput) fileInput.value = '';

        modal.style.display = 'none';
        loadPromotionsTable();
    });
}

function loadPromotionsTable() {
    const tbody = document.getElementById('promotionsTableBody');
    const promotions = getAllPromotions();

    tbody.innerHTML = promotions.map(promo => `
        <tr>
            <td>${promo.name}</td>
            <td>${promo.value}</td>
            <td>${truncateText(promo.description, 50)}</td>
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
    const modal = document.getElementById('redeemModal');
    const form = document.getElementById('redeemForm');
    const closeBtn = document.getElementById('closeRedeemModal');
    const productSelect = document.getElementById('redeemProduct');

    if (!addBtn) return;

    loadRedeemsTable();

    // Carregar produtos no select
    const products = getAllProducts();
    productSelect.innerHTML = '<option value="">Selecione um produto</option>' +
        products.map(product => `<option value="${product.id}">${product.name}</option>`).join('');

    // Adicionar novo resgate
    addBtn.addEventListener('click', () => {
        document.getElementById('redeemModalTitle').textContent = 'Novo Resgate';
        form.reset();
        form.dataset.redeemId = '';
        modal.style.display = 'flex';
    });

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Salvar resgate
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedProductId = document.getElementById('redeemProduct').value;
        const selectedProduct = getProductById(parseInt(selectedProductId));

        if (!selectedProduct) {
            showNotification('Selecione um produto válido.', 'error');
            return;
        }

        const redeemData = {
            productId: parseInt(selectedProductId),
            pointsRequired: parseInt(document.getElementById('redeemPointsRequired').value),
            active: document.getElementById('redeemActive').checked
        };

        const redeemId = form.dataset.redeemId;
        if (redeemId) {
            updateRedeem(parseInt(redeemId), redeemData);
            showNotification('✓ Resgate atualizado!', 'success');
        } else {
            addRedeem(redeemData);
            showNotification('✓ Resgate criado!', 'success');
        }

        modal.style.display = 'none';
        loadRedeemsTable();
    });
}

function loadRedeemsTable() {
    const tbody = document.getElementById('redeemsTableBody');
    const redeems = getAllRedeems();

    tbody.innerHTML = redeems.map(redeem => {
        const product = getProductById(redeem.productId);
        const productName = product ? product.name : 'Produto não encontrado';

        return `
            <tr>
                <td>${productName}</td>
                <td>${redeem.pointsRequired}</td>
                <td><span class="status-badge ${redeem.active ? 'status-badge--ativo' : 'status-badge--inativo'}">${redeem.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn table-btn--delete" onclick="deleteRedeemItem(${redeem.id})">Deletar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
