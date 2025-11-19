/**
 * LOGIN.JS - Lógica completa de Login/Registro de Usuários
 * Revisado e 100% compatível com storage.js/admin.js atualizados
 */

import {
    initializeStorage,
    validateAdminLogin,
    getAdmin,
    getClientByPhone,
    validateClientLogin,
    addClient,
    setCurrentSession,
    getCurrentSession,
    getSettings,
    recordTransaction
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

document.addEventListener('DOMContentLoaded', async () => {
    await initializeStorage();

    const session = getCurrentSession();
    if (session) {
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
// LOGIN INTELIGENTE
// ========================================

function setupUnifiedLogin() {
    const form = document.getElementById('unifiedLoginForm');
    const inputField = document.getElementById('unifiedInput');
    const passwordInput = document.getElementById('unifiedPassword');
    const errorDiv = document.getElementById('unifiedError');
    const registerLink = document.getElementById('goToRegister');
    const registerForm = document.getElementById('clientRegisterForm');

    if (!form) return;

    // Navegar para tela de registro
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

        if (!input || !password) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        const admin = await getAdmin();

        // Detectar se é admin pelo telefone sanitizado
        if (admin && sanitizePhone(input) === sanitizePhone(admin.phone)) {
            await handleAdminLogin(input, password, errorDiv);
            return;
        }

        // Caso contrário → login de cliente
        await handleClientLogin(input, password, errorDiv);
    });
}

// ========================================
// LOGIN ADMINISTRADOR
// ========================================

async function handleAdminLogin(phone, password, errorDiv) {
    const admin = await getAdmin();

    if (!admin) {
        showError('Administrador não configurado', errorDiv);
        return;
    }

    const phoneOk = sanitizePhone(phone) === sanitizePhone(admin.phone);
    const passOk = password === admin.password;

    if (!phoneOk || !passOk) {
        showError('Telefone ou senha incorretos', errorDiv);
        return;
    }

    // Login bem-sucedido
    setCurrentSession({ userType: 'admin', userId: admin.id || 'admin', username: admin.name || 'Admin' });
    showNotification('Login de Administrador realizado!', 'success');

    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 500);
}

// ========================================
// LOGIN CLIENTE
// ========================================

async function handleClientLogin(phone, password, errorDiv) {
    if (!validatePhone(phone)) {
        showError('Telefone inválido. Ex: (XX) 9 XXXX-XXXX', errorDiv);
        return;
    }

    const sanitizedPhone = sanitizePhone(phone);

    const client = await validateClientLogin(sanitizedPhone, password);

    if (!client) {
        const existingClient = await getClientByPhone(sanitizedPhone);

        if (!existingClient) {
            showError('Telefone não encontrado. Crie uma conta!', errorDiv);
        } else {
            showError('Senha incorreta', errorDiv);
        }
        return;
    }

    // Login ok
    setCurrentSession({ userType: 'cliente', userId: client.id, username: client.name });
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

    // Voltar ao login
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

        // -------------------------
        // VALIDAÇÕES
        // -------------------------

        if (!name || !phone || !confirmPhone || !password || !confirmPassword) {
            showError('Preencha todos os campos', errorDiv);
            return;
        }

        if (!validatePhone(phone)) {
            showError('Telefone inválido', errorDiv);
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

        const normalizedPhone = sanitizePhone(phone);

        const existingClient = await getClientByPhone(normalizedPhone);
        if (existingClient) {
            showError('Este telefone já está registrado', errorDiv);
            return;
        }

        // Criar cliente
        try {
            // Obter configurações para bônus dinâmico
            const settings = await getSettings();
            const bonusPoints = settings.bonusRegistration || 50;

            const newClient = await addClient({
                name,
                phone: formatPhone(normalizedPhone),
                password,
                points: bonusPoints
            });

            // Registrar transação de bônus de cadastro
            await recordTransaction({
                clientId: newClient.id,
                points: bonusPoints,
                type: 'ganho',
                reason: 'cadastro',
                timestamp: new Date().toISOString()
            });

            showSuccess(`Conta criada com sucesso! +${bonusPoints} pontos 🎉`, successDiv);

            form.reset();

            setTimeout(() => {
                setCurrentSession({ userType: 'cliente', userId: newClient.id, username: newClient.name });
                window.location.href = 'cliente.html';
            }, 2000);

        } catch (err) {
            console.error('Erro ao criar cliente:', err);
            showError('Erro ao criar conta. Tente novamente.', errorDiv);
        }
    });
}

// ========================================
// AUXILIARES
// ========================================

function showError(message, div) {
    div.textContent = message;
    div.style.display = 'block';
    div.classList.add('alert--error');
    div.classList.remove('alert--success');
}

function showSuccess(message, div) {
    div.textContent = message;
    div.style.display = 'block';
    div.classList.add('alert--success');
    div.classList.remove('alert--error');
}
