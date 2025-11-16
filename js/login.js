/**
 * LOGIN.JS - Lógica de Login/Registro de Usuários
 */

import {
    initializeStorage,
    validateAdminLogin,
    getAdmin,
    getClientByPhone,
    validateClientLogin,
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

    setupUnifiedLogin();
    setupClientRegister();
});

// ========================================
// LOGIN UNIFICADO (AUTO-DETECÇÃO)
// ========================================

function setupUnifiedLogin() {
    const form = document.getElementById('unifiedLoginForm');
    const inputField = document.getElementById('unifiedInput');
    const passwordInput = document.getElementById('unifiedPassword');
    const errorDiv = document.getElementById('unifiedError');
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const input = inputField.value.trim();
        const password = passwordInput.value.trim();

        // Validações
        if (!input || !password) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        // Detectar tipo de login: verifica se é o telefone do admin
        const admin = await getAdmin();
        if (admin && input === admin.phone) {
            // Login de Admin
            await handleAdminLogin(input, password, errorDiv);
        } else {
            // Login de Cliente
            await handleClientLogin(input, password, errorDiv);
        }
    });
}

/**
 * Processa login de administrador
 */
async function handleAdminLogin(phone, password, errorDiv) {
    // Validar credenciais
    if (!validateAdminLogin(phone, password)) {
        showError('Telefone ou senha incorretos', errorDiv);
        return;
    }

    // Login bem-sucedido
    setCurrentSession('admin', 1);
    showNotification('Login de administrador realizado! 👨‍💼', 'success');
    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 500);
}

/**
 * Processa login de cliente
 */
async function handleClientLogin(phone, password, errorDiv) {
    // Validar formato do telefone
    if (!validatePhone(phone)) {
        showError('Telefone inválido. Formato: (XX) 9 XXXX-XXXX', errorDiv);
        return;
    }

    // Validar login (telefone + senha)
    const client = await validateClientLogin(phone, password);

    if (!client) {
        // Verificar se é porque cliente não existe ou senha está errada
        const existingClient = await getClientByPhone(phone);
        if (!existingClient) {
            showError('Telefone não encontrado. Crie uma conta!', errorDiv);
        } else {
            showError('Senha incorreta', errorDiv);
        }
        return;
    }

    // Login bem-sucedido
    setCurrentSession('cliente', client.id);
    showNotification('Login realizado com sucesso! 🎉', 'success');
    setTimeout(() => {
        window.location.href = 'cliente.html';
    }, 500);
}

// ========================================
// REGISTRO DE CLIENTE
// ========================================

async function setupClientRegister() {
    const form = document.getElementById('clientRegisterForm');
    const loginForm = document.getElementById('unifiedLoginForm');
    const nameInput = document.getElementById('registerName');
    const phoneInput = document.getElementById('registerPhone');
    const confirmPhoneInput = document.getElementById('registerConfirmPhone');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const confirmPhone = confirmPhoneInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Validações
        if (!name || !phone || !confirmPhone || !password || !confirmPassword) {
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

        if (password.length < 4) {
            showError('Senha deve ter no mínimo 4 caracteres', errorDiv);
            return;
        }

        if (password !== confirmPassword) {
            showError('As senhas não conferem', errorDiv);
            return;
        }

        // Normalizar telefone
        const normalizedPhone = sanitizePhone(phone);

        // Verificar se cliente já existe
        const existingClient = await getClientByPhone(normalizedPhone);
        if (existingClient) {
            showError('Este telefone já está registrado', errorDiv);
            return;
        }

        // Criar novo cliente (usar telefone formatado para exibição)
        try {
            const newClient = await addClient({
                name,
                phone: formatPhone(normalizedPhone),
                password, // Usar senha fornecida pelo cliente
                points: 50 // Bônus de boas-vindas
            });

            showSuccess(`Conta criada com sucesso! 🎉 Ganhou 50 pontos de boas-vindas!`, successDiv);

            // Limpar formulário
            form.reset();

            // Redirecionar após 2 segundos
            setTimeout(() => {
                try {
                    setCurrentSession('cliente', newClient.id);
                    window.location.href = 'cliente.html';
                } catch (err) {
                    console.error('Erro ao definir sessão após registro:', err);
                    showError('Erro ao iniciar sessão. Faça login manualmente.', errorDiv);
                }
            }, 2000);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
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
