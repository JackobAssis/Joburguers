/**
 * LOGIN.JS - Lógica de Login/Registro de Usuários
 */

import {
    initializeStorage,
    validateAdminLogin,
    getClientByPhone,
    addClient,
    setCurrentSession,
    getCurrentSession
} from './storage.js';
import {
    formatPhone,
    sanitizePhone,
    validatePhone,
    showNotification
} from './utils.js';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();

    // Redirecionar se já logado
    if (getCurrentSession()) {
        const session = getCurrentSession();
        if (session.userType === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'cliente.html';
        }
        return;
    }

    setupTabs();
    setupClientLogin();
    setupAdminLogin();
    setupClientRegister();
});

// ========================================
// SISTEMA DE ABAS
// ========================================

function setupTabs() {
    const tabs = document.querySelectorAll('.login-tab');
    const forms = {
        cliente: document.getElementById('clientLoginForm'),
        admin: document.getElementById('adminLoginForm')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Atualizar abas
            tabs.forEach(t => t.classList.remove('login-tab--active'));
            tab.classList.add('login-tab--active');

            // Atualizar formulários
            Object.entries(forms).forEach(([name, form]) => {
                if (form) {
                    form.classList.toggle('login-form--active', name === tabName);
                }
            });
        });
    });
}

// ========================================
// LOGIN DE CLIENTE
// ========================================

function setupClientLogin() {
    const form = document.getElementById('clientLoginForm');
    const phoneInput = document.getElementById('clientPhone');
    const passwordInput = document.getElementById('clientPassword');
    const errorDiv = document.getElementById('clientError');
    const registerLink = document.getElementById('goToRegister');
    const registerForm = document.getElementById('clientRegisterForm');

    if (!form) return;

    // Configurar link para registro
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            form.classList.remove('login-form--active');
            registerForm.classList.add('login-form--active');
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const phone = phoneInput.value.trim();
        const password = passwordInput.value.trim();

        // Validações
        if (!phone || !password) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        if (!validatePhone(phone)) {
            showError('Telefone inválido', errorDiv);
            return;
        }

        // Buscar cliente
        const client = getClientByPhone(phone);
        if (!client) {
            showError('Telefone não encontrado. Crie uma conta!', errorDiv);
            return;
        }

        // Verificar senha (que é o telefone confirmado)
        const normalizedPhone = sanitizePhone(phone);
        const normalizedPassword = sanitizePhone(password);

        if (normalizedPhone !== normalizedPassword) {
            showError('Senha incorreta', errorDiv);
            return;
        }

        // Login bem-sucedido
        setCurrentSession('cliente', client.id);
        showNotification('Login realizado com sucesso! 🎉', 'success');
        setTimeout(() => {
            window.location.href = 'cliente.html';
        }, 500);
    });
}

// ========================================
// LOGIN DE ADMIN
// ========================================

function setupAdminLogin() {
    const form = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const errorDiv = document.getElementById('adminError');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validações
        if (!email || !password) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        // Validar credenciais
        if (!validateAdminLogin(email, password)) {
            showError('Email ou senha incorretos', errorDiv);
            return;
        }

        // Login bem-sucedido
        setCurrentSession('admin', 1);
        showNotification('Login de administrador realizado! 👨‍💼', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 500);
    });
}

// ========================================
// REGISTRO DE CLIENTE
// ========================================

function setupClientRegister() {
    const form = document.getElementById('clientRegisterForm');
    const loginForm = document.getElementById('clientLoginForm');
    const nameInput = document.getElementById('registerName');
    const phoneInput = document.getElementById('registerPhone');
    const confirmPhoneInput = document.getElementById('registerConfirmPhone');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const backBtn = document.getElementById('backToLogin');

    if (!form) return;

    // Voltar para login
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            form.classList.remove('login-form--active');
            loginForm.classList.add('login-form--active');
            form.reset();
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const confirmPhone = confirmPhoneInput.value.trim();

        // Validações
        if (!name || !phone || !confirmPhone) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        if (!validatePhone(phone)) {
            showError('Telefone inválido. Formato: (XX) 9 XXXX-XXXX', errorDiv);
            return;
        }

        if (sanitizePhone(phone) !== sanitizePhone(confirmPhone)) {
            showError('Os telefones não conferem', errorDiv);
            return;
        }

        if (name.length < 3) {
            showError('Nome deve ter no mínimo 3 caracteres', errorDiv);
            return;
        }

        // Verificar se cliente já existe
        if (getClientByPhone(phone)) {
            showError('Este telefone já está registrado', errorDiv);
            return;
        }

        // Criar novo cliente
        try {
            const newClient = addClient({
                name,
                phone: formatPhone(phone),
                points: 50 // Bônus de boas-vindas
            });

            showSuccess(
                `Conta criada com sucesso! 🎉 Ganhou 50 pontos de boas-vindas!`,
                successDiv
            );

            // Limpar formulário
            form.reset();

            // Redirecionar após 2 segundos
            setTimeout(() => {
                setCurrentSession('cliente', newClient.id);
                window.location.href = 'cliente.html';
            }, 2000);
        } catch (error) {
            showError('Erro ao criar conta. Tente novamente.', errorDiv);
        }
    });
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function showError(message, errorDiv) {
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.classList.remove('alert--success');
    errorDiv.classList.add('alert--error');
}

function showSuccess(message, successDiv) {
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    successDiv.classList.remove('alert--error');
    successDiv.classList.add('alert--success');
}
