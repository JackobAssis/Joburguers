/**
 * UTILS.JS - Funções Utilitárias Gerais
 */

/**
 * Formata moeda em reais
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata data em português
 */
function formatDate(dateString) {
    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

/**
 * Formata apenas a data
 */
function formatDateOnly(dateString) {
    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(dateString));
}

/**
 * Formata telefone
 */
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

/**
 * Remove caracteres especiais do telefone
 */
function sanitizePhone(phone) {
    return phone.replace(/\D/g, '');
}

/**
 * Valida e-mail
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida telefone
 */
function validatePhone(phone) {
    const cleaned = sanitizePhone(phone);
    return cleaned.length === 11;
}

/**
 * Valida URL
 */
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Trunca texto com reticências
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce para funções
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para funções
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Cria um elemento DOM com classes
 */
function createElement(tag, classes = '', attributes = {}) {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'text') {
            element.textContent = value;
        } else if (key === 'html') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    return element;
}

/**
 * Mostra notificação temporária
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = createElement('div', `notification notification--${type}`);
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    const bgColors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    notification.style.backgroundColor = bgColors[type] || bgColors.info;
    notification.style.color = '#fff';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Mostrar modal de confirmação
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const dialog = createElement('div', 'confirm-dialog');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const content = createElement('div', 'confirm-dialog__content');
    content.style.cssText = `
        background-color: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        text-align: center;
    `;

    content.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: #fff;">${title}</h2>
        <p style="color: #b0b0b0; margin-bottom: 2rem;">${message}</p>
        <div style="display: flex; gap: 1rem;">
            <button class="btn btn--primary" style="flex: 1;" id="confirmBtn">Confirmar</button>
            <button class="btn btn--secondary" style="flex: 1;" id="cancelBtn">Cancelar</button>
        </div>
    `;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    const confirmBtn = content.querySelector('#confirmBtn');
    const cancelBtn = content.querySelector('#cancelBtn');

    confirmBtn.addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
}

/**
 * Carrega imagem com fallback
 */
function loadImageWithFallback(imgElement, fallback = 'https://via.placeholder.com/400x300?text=Imagem+Indisponivel') {
    imgElement.addEventListener('error', () => {
        imgElement.src = fallback;
        imgElement.style.opacity = '0.5';
    });
}

/**
 * Copia texto para clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado para clipboard!', 'success');
    }).catch(() => {
        showNotification('Erro ao copiar', 'error');
    });
}

/**
 * Abre link WhatsApp
 */
function openWhatsApp(phone, message = '') {
    const cleaned = sanitizePhone(phone);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleaned}?text=${encodedMessage}`;
    window.open(url, '_blank');
}

/**
 * Download JSON
 */
function downloadJSON(data, filename = 'dados.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Lê arquivo JSON
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                resolve(json);
            } catch (error) {
                reject(new Error('Arquivo JSON inválido'));
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
    });
}

/**
 * Gera ID único
 */
function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simula delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Smooth scroll
 */
function smoothScroll(target, duration = 1000) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const start = window.pageYOffset;
    const target_position = element.getBoundingClientRect().top;
    const distance = target_position;
    let start_time = null;

    window.requestAnimationFrame(function scroll(currentTime) {
        if (start_time === null) start_time = currentTime;
        const elapsed = currentTime - start_time;
        const run = ease(elapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (elapsed < duration) window.requestAnimationFrame(scroll);
    });

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
}

/**
 * Verifica se o usuário está online
 */
function isOnline() {
    return navigator.onLine;
}

export {
    formatCurrency,
    formatDate,
    formatDateOnly,
    formatPhone,
    sanitizePhone,
    validateEmail,
    validatePhone,
    validateURL,
    truncateText,
    debounce,
    throttle,
    createElement,
    showNotification,
    showConfirmDialog,
    loadImageWithFallback,
    copyToClipboard,
    openWhatsApp,
    downloadJSON,
    readJSONFile,
    generateUniqueId,
    delay,
    smoothScroll,
    isOnline
};
