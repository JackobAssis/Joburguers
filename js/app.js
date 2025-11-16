/**
 * APP.JS - Arquivo Principal da Aplicação
 * Gerencia a página de cardápio, filtros e navegação
 */

import { 
    initializeStorage, 
    getAllProducts, 
    getProductsByCategory,
    getActivePromotions,
    getCurrentSession,
    clearSession,
    getSettings
} from './storage.js';
import { 
    formatCurrency, 
    debounce, 
    truncateText,
    openWhatsApp,
    sanitizePhone
} from './utils.js';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    
    setupMenuToggle();
    setupCardapio();
    setupFilters();
    setupSearch();
    setupPromotions();
    setupScrollToTop();
    checkSession();
    setupWhatsAppLinks();
});

// ========================================
// VERIFICAÇÃO DE SESSÃO
// ========================================

function checkSession() {
    const session = getCurrentSession();
    if (session) {
        const loginLink = document.querySelector('.header__link--login');
        if (loginLink) {
            if (session.userType === 'admin') {
                loginLink.textContent = '👨‍💼 Admin';
                loginLink.href = 'admin.html';
            } else {
                loginLink.textContent = '👤 Perfil';
                loginLink.href = 'cliente.html';
            }
        }
    }
}

// ========================================
// MENU MOBILE
// ========================================

function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

// ========================================
// CARDÁPIO
// ========================================

function setupCardapio() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    renderProducts(getAllProducts());
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!products || products.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" 
                 class="product-card__image" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Imagem+Indisponivel'">
            
            <div class="product-card__content">
                <span class="product-card__category">${getCategoryLabel(product.category)}</span>
                <h3 class="product-card__name">${product.name}</h3>
                <p class="product-card__description">${truncateText(product.description, 80)}</p>
                
                <div class="product-card__footer">
                    <span class="product-card__price">${formatCurrency(product.price)}</span>
                    ${!product.available ? '<span class="product-card__badge">Indisponível</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Adicionar event listeners
    grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `produto.html?id=${productId}`;
        });
    });
}

function getCategoryLabel(category) {
    const labels = {
        hamburguer: '🍔 Hambúrguer',
        bebida: '🥤 Bebida',
        combo: '🎉 Combo',
        acompanhamento: '🍟 Acompanhamento'
    };
    return labels[category] || category;
}

// ========================================
// FILTROS
// ========================================

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
            // Adicionar ao clicado
            btn.classList.add('filter-btn--active');

            // Filtrar produtos
            const category = btn.dataset.category;
            const products = getProductsByCategory(category);
            renderProducts(products);
        });
    });
}

// ========================================
// BUSCA
// ========================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput || !searchBtn) return;

    const performSearch = debounce(() => {
        const query = searchInput.value.toLowerCase().trim();
        const allProducts = getAllProducts();

        if (!query) {
            renderProducts(allProducts);
            return;
        }

        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );

        renderProducts(filtered);
    }, 300);

    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

// ========================================
// PROMOÇÕES
// ========================================

async function setupPromotions() {
    const promotions = await getActivePromotions();

    // Chama renderPromocoes com os objetos de promoção
    if (typeof renderPromocoes === 'function') {
        renderPromocoes(promotions, 'promocoes-grid');
    }
}

// ========================================
// SCROLL TO TOP
// ========================================

function setupScrollToTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// EXPORTAR PARA USO EM OUTROS MÓDULOS
// ========================================

export { renderProducts, getCategoryLabel };

// ========================================
// WHATSAPP LINKS DINÂMICOS
// ========================================
async function setupWhatsAppLinks() {
    try {
        const settings = await getSettings();
        const wa = settings && settings.storeWhatsApp ? settings.storeWhatsApp : null;
        if (!wa) return;

        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            const text = btn.dataset.waText || 'Olá! Quero fazer um pedido';
            const href = `https://wa.me/5581989334497`;
            btn.setAttribute('href', href);
        });
    } catch (e) {
        // não bloquear a aplicação
        console.error('Erro ao configurar links WhatsApp:', e);
    }
}
i