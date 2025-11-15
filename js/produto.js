/**
 * PRODUTO.JS - Página Individual de Detalhes do Produto
 */

import {
    initializeStorage,
    getProductById,
    getAllProducts,
    getCurrentSession
} from './storage.js';
import {
    formatCurrency,
    openWhatsApp,
    sanitizePhone
} from './utils.js';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    loadProductDetails();
    setupRecommendations();
});

// ========================================
// CARREGAR DETALHES DO PRODUTO
// ========================================

function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    const product = getProductById(productId);
    if (!product) {
        window.location.href = 'index.html';
        return;
    }

    // Preencher informações básicas
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productNameBreadcrumb').textContent = product.name;
    document.getElementById('productImage').src = product.image;
    document.getElementById('productImage').onerror = function() {
        this.src = 'https://via.placeholder.com/400x300?text=Imagem+Indisponivel';
    };

    document.getElementById('productPrice').textContent = formatCurrency(product.price);
    document.getElementById('productDescription').textContent = product.description;

    // Categoria
    document.getElementById('categoryBadge').textContent = getCategoryLabel(product.category);

    // Disponibilidade
    const availStatus = document.getElementById('availabilityStatus');
    if (product.available) {
        availStatus.textContent = '✓ Disponível';
        availStatus.classList.add('availability--available');
    } else {
        availStatus.textContent = '✗ Indisponível';
        availStatus.classList.remove('availability--available');
        availStatus.classList.add('availability--unavailable');
    }

    // WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.addEventListener('click', () => {
        const phone = '5585999999999'; // Alterar com número real
        const message = `Olá! Quero fazer um pedido do produto: ${product.name} (${formatCurrency(product.price)})`;
        openWhatsApp(phone, message);
    });

    // Ingredientes
    if (product.ingredients && product.ingredients.length > 0) {
        const ingredientsContainer = document.getElementById('ingredientsContainer');
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = product.ingredients
            .map(ing => `<li>${ing}</li>`)
            .join('');
        ingredientsContainer.style.display = 'block';
    }
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
// RECOMENDAÇÕES
// ========================================

function setupRecommendations() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));
    const product = getProductById(productId);

    if (!product) return;

    const allProducts = getAllProducts();
    const recommended = allProducts
        .filter(p => p.category === product.category && p.id !== productId)
        .slice(0, 3);

    if (recommended.length === 0) {
        document.getElementById('recommendationContainer').style.display = 'none';
        return;
    }

    const grid = document.getElementById('recommendedProducts');
    grid.innerHTML = recommended.map(p => `
        <div class="recommendation-item" onclick="window.location.href='produto.html?id=${p.id}'">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x150?text=Imagem'">
            <p><strong>${p.name}</strong></p>
            <p>${formatCurrency(p.price)}</p>
        </div>
    `).join('');
}
