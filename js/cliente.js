/**
 * CLIENTE.JS - Painel do Cliente com Sistema de Pontos
 */

import {
    initializeStorage,
    getCurrentSession,
    clearSession,
    getClientById,
    setCurrentSession,
    updateClient,
    getClientTransactions,
    getAllRedeems,
    addPointsToClient,
    getSettings,
    calculateLevel,
    getPointsUntilNextLevel,
    getProductById
} from './storage.js';
import {
    formatCurrency,
    formatDate,
    showNotification,
    showConfirmDialog
} from './utils.js';
import { getLevelLabel } from './storage.js';

// ========================================
// INICIALIZAÇÃO
// ========================================

let currentClient = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeStorage();

    const session = await getCurrentSession();
    if (!session || session.userType !== 'cliente') {
        window.location.href = 'login.html';
        return;
    }

    currentClient = await getClientById(session.userId);
    if (!currentClient) {
        await clearSession();
        window.location.href = 'login.html';
        return;
    }

    setupNavigation();
    setupLogout();
    loadDashboard();
    loadPontos();
    loadHistorico();
    // render dynamic 'Como Ganhar' based on settings
    try {
        const s = await getSettings();
        renderComoGanhar(s);
    } catch (e) { console.warn('[cliente] could not render Como Ganhar on init', e); }
    loadDados();
    setupChangePassword();
});

// ========================================
// NAVEGAÇÃO
// ========================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.cliente-nav__item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;

            // Remover active de todos
            navItems.forEach(i => i.classList.remove('cliente-nav__item--active'));
            item.classList.add('cliente-nav__item--active');

            // Ocultar todas as seções
            document.querySelectorAll('.cliente-section').forEach(sec => {
                sec.classList.remove('cliente-section--active');
            });

            // Mostrar seção clicada
            const sectionEl = document.getElementById(section);
            if (sectionEl) {
                sectionEl.classList.add('cliente-section--active');
            }
        });
    });
}

// ========================================
// LOGOUT
// ========================================

function setupLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnSidebar');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirmDialog(
                'Sair da Conta?',
                'Tem certeza que deseja sair?',
                () => {
                    clearSession();
                    window.location.href = 'index.html';
                }
            );
        });
    });
}

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {
    const settings = await getSettings();
    
    // Informações do cliente
    document.getElementById('clientName').textContent = currentClient.name;
    document.getElementById('clientPhone').textContent = formatPhone(currentClient.phone);
    document.getElementById('memberSince').textContent = 
        `Membro desde ${new Date(currentClient.createdAt).toLocaleDateString('pt-BR')}`;

    // Pontos
    document.getElementById('totalPoints').textContent = currentClient.points;
    
    // Nível
    const level = calculateLevel(currentClient.points);
    document.getElementById('memberStatus').textContent = getLevelLabel(level).split(' ')[1]; // Apenas emoji
    
    // Próximo nível
    const pointsNeeded = getPointsUntilNextLevel(currentClient.points);
    document.getElementById('nextLevel').textContent = pointsNeeded > 0 ? 
        settings.levels[getNextLevel(level)] : 'Máximo!';
    document.getElementById('pointsNeeded').textContent = pointsNeeded;
    document.getElementById('nextReward').textContent = 
        pointsNeeded > 0 ? `${pointsNeeded} pontos` : '🏆 Nível Máximo!';

    // Progresso
    const levelPoints = getPointsForLevel(level, settings);
    const nextLevelPoints = getPointsForNextLevel(level, settings);

    // Determine next redeem threshold (menor pointsRequired entre resgates ativos)
    let nextRedeemPoints = 0;
    try {
        const redeems = await getAllRedeems();
        const active = (redeems || []).filter(r => r && r.active && typeof r.pointsRequired === 'number');
        if (active.length > 0) {
            nextRedeemPoints = active.map(r => r.pointsRequired).reduce((a, b) => Math.min(a, b), Infinity);
            if (!isFinite(nextRedeemPoints)) nextRedeemPoints = 0;
        }
    } catch (e) { console.warn('[cliente] could not fetch redeems to compute nextRedeemPoints', e); }

    const progress = Math.min(100, ((currentClient.points - levelPoints) / (nextLevelPoints - levelPoints)) * 100);

    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentPoints').textContent = currentClient.points;
    // show next redeem points if available, otherwise show next level threshold
    document.getElementById('levelTarget').textContent = nextRedeemPoints > 0 ? nextRedeemPoints : nextLevelPoints;
}

function getNextLevel(currentLevel) {
    const levels = {
        bronze: 'silver',
        silver: 'gold',
        gold: 'platinum',
        platinum: 'platinum'
    };
    return levels[currentLevel];
}

function getPointsForLevel(level, settings) {
    const mapping = {
        bronze: 0,
        silver: settings.levels.silver,
        gold: settings.levels.gold,
        platinum: settings.levels.platinum
    };
    return mapping[level] || 0;
}

function getPointsForNextLevel(level, settings) {
    const mapping = {
        bronze: settings.levels.silver,
        silver: settings.levels.gold,
        gold: settings.levels.platinum,
        platinum: settings.levels.platinum
    };
    return mapping[level] || 0;
}

function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

// ========================================
// PONTOS
// ========================================

async function loadPontos() {
    // Saldos
    document.getElementById('saldoPontos').textContent = currentClient.points;

    const transactions = await getClientTransactions(currentClient.id);
    const ganhos = transactions
        .filter(t => t.type === 'ganho' || t.points > 0)
        .reduce((sum, t) => sum + Math.abs(t.points), 0);
    const resgates = transactions
        .filter(t => t.type === 'resgate' || t.points < 0)
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

    document.getElementById('pontosGanhos').textContent = ganhos;
    document.getElementById('pontosResgatados').textContent = resgates;

    // Resgates disponíveis
    loadResgates();
}

async function loadResgates() {
    const redeems = await getAllRedeems();
    const grid = document.getElementById('resgatesGrid');

    if (redeems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum resgate disponível</p>';
        return;
    }

    const redeemCards = await Promise.all(redeems
        .filter(r => r.active)
        .map(async redeem => {
            const product = await getProductById(redeem.productId);
            const productName = product ? product.name : 'Produto não encontrado';
            return `
                <div class="resgate-card">
                    <h4>${productName}</h4>
                    <p>${redeem.pointsRequired} pontos</p>
                    <p style="color: #ff9500; font-weight: 600;">
                        ${product ? formatCurrency(product.price) : 'N/A'}
                    </p>
                    <button class="btn ${currentClient.points >= redeem.pointsRequired ? 'btn--primary' : 'btn--secondary'} btn--small"
                            ${currentClient.points < redeem.pointsRequired ? 'disabled' : ''}
                            onclick="resgatarPontos('${redeem.id}')">
                        ${currentClient.points >= redeem.pointsRequired ? 'Resgatar' : 'Pontos Insuficientes'}
                    </button>
                </div>
            `;
        }));

    grid.innerHTML = redeemCards.join('');
}

window.resgatarPontos = async function(redeemId) {
    const redeems = await getAllRedeems();
    const redeem = redeems.find(r => r.id === redeemId);
    if (!redeem) return;

    const product = await getProductById(redeem.productId);
    const productName = product ? product.name : 'Produto não encontrado';

    showConfirmDialog(
        'Confirmar Resgate',
        `Deseja resgatar "${productName}" por ${redeem.pointsRequired} pontos?`,
        async () => {
            if (currentClient.points >= redeem.pointsRequired) {
                // Registrar resgate
                await addPointsToClient(currentClient.id, -redeem.pointsRequired, 'resgate');
                currentClient.points -= redeem.pointsRequired;

                showNotification(`✓ Resgate realizado! Você ganhou ${productName} gratuitamente!`, 'success');
                await loadPontos();
                await loadDashboard();

                // Buscar número do WhatsApp da loja nas settings
                let waNumber = '5581989334497'; // padrão se não configurado
                let lojaNome = 'Joburguers';
                try {
                    const settings = await getSettings();
                    if (settings && settings.storeWhatsApp) waNumber = settings.storeWhatsApp.replace(/\D/g, '');
                    if (settings && settings.storeName) lojaNome = settings.storeName;
                } catch (e) {}

                // Montar mensagem automática
                const msg = encodeURIComponent(
                    `Olá! Gostaria de resgatar o produto "${productName}" usando meus pontos no programa de fidelidade do ${lojaNome}.`
                );
                const waUrl = `https://wa.me/${waNumber}?text=${msg}`;
                window.open(waUrl, '_blank');
            }
        }
    );
};

// ========================================
// HISTÓRICO
// ========================================

async function loadHistorico() {
    try {
        let transactions = await getClientTransactions(currentClient.id) || [];
        const list = document.getElementById('historicoList');
        const empty = document.getElementById('emptyHistorico');

        // Defensive logging for unexpected shapes
        console.info('[cliente] loadHistorico: transactions type=', typeof transactions, 'isArray=', Array.isArray(transactions));
        if (!Array.isArray(transactions)) {
            if (transactions && typeof transactions === 'object') {
                console.warn('[cliente] loadHistorico: normalizing transactions object to array', transactions);
                transactions = Object.keys(transactions).map(k => transactions[k]);
            } else {
                transactions = [];
            }
        }

        if (!Array.isArray(transactions) || transactions.length === 0) {
            if (list) list.style.display = 'none';
            if (empty) empty.style.display = 'block';
            // still ensure filters are initialized with empty array
            setupHistoricoFilters([]);
            return;
        }

        if (empty) empty.style.display = 'none';
        if (list) list.style.display = 'block';

        list.innerHTML = transactions.map(trans => `
        <div class="historico-item">
            <div class="historico-item__info">
                <div class="historico-item__desc">${trans.reason || trans.type}</div>
                <div class="historico-item__date">${formatDate(trans.timestamp)}</div>
            </div>
            <div class="historico-item__pontos ${trans.points > 0 ? 'historico-item__pontos--ganho' : 'historico-item__pontos--resgate'}">
                ${trans.points > 0 ? '+' : ''}${trans.points}
            </div>
        </div>
    `).join('');

    // Filtros
    setupHistoricoFilters(transactions);
    } catch (err) {
        console.error('[cliente] loadHistorico error', err);
        // Ensure UI doesn't break
        const list = document.getElementById('historicoList');
        const empty = document.getElementById('emptyHistorico');
        if (list) list.style.display = 'none';
        if (empty) empty.style.display = 'block';
        setupHistoricoFilters([]);
    }
}

function setupHistoricoFilters(allTransactions) {
    const filterBtns = document.querySelectorAll('.historico-filters .filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');

            const filter = btn.dataset.filter;
            let filtered = allTransactions;

            if (filter === 'ganho') {
                filtered = allTransactions.filter(t => t.points > 0);
            } else if (filter === 'resgate') {
                filtered = allTransactions.filter(t => t.points < 0);
            }

            const list = document.getElementById('historicoList');
            list.innerHTML = filtered.map(trans => `
                <div class="historico-item">
                    <div class="historico-item__info">
                        <div class="historico-item__desc">${trans.reason || trans.type}</div>
                        <div class="historico-item__date">${formatDate(trans.timestamp)}</div>
                    </div>
                    <div class="historico-item__pontos ${trans.points > 0 ? 'historico-item__pontos--ganho' : 'historico-item__pontos--resgate'}">
                        ${trans.points > 0 ? '+' : ''}${trans.points}
                    </div>
                </div>
            `).join('');
        });
    });
}

// ========================================
// DADOS PESSOAIS
// ========================================

function loadDados() {
    const form = document.getElementById('clientDataForm');
    if (!form) return;

    document.getElementById('editName').value = currentClient.name;
    document.getElementById('editPhone').value = currentClient.phone;
    document.getElementById('editEmail').value = currentClient.email || '';
    document.getElementById('editBirthdate').value = currentClient.birthdate || '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const updated = await updateClient(currentClient.id, {
                name: document.getElementById('editName').value,
                phone: document.getElementById('editPhone').value,
                email: document.getElementById('editEmail').value,
                birthdate: document.getElementById('editBirthdate').value
            });

            if (updated) {
                // Update in-memory client
                currentClient = updated;

                // Persist session info so other pages see updated name/phone
                try { await setCurrentSession({ userType: 'cliente', userId: currentClient.id, username: currentClient.name }); } catch (e) { console.warn('[cliente] setCurrentSession failed', e); }

                showNotification('✓ Dados atualizados com sucesso!', 'success');
                document.getElementById('clientName').textContent = currentClient.name;
                const phoneEl = document.getElementById('clientPhone');
                if (phoneEl) phoneEl.textContent = formatPhone(currentClient.phone || '');

                // Refresh UI dependent on client data
                await loadDashboard();
                await loadPontos();
            } else {
                showNotification('Erro ao atualizar os dados. Tente novamente.', 'error');
            }
        } catch (err) {
            console.error('[cliente] erro ao submeter form de dados:', err);
            showNotification('Erro ao atualizar os dados. Veja o console para detalhes.', 'error');
        }
    });
}

// ========================================
// COMO GANHAR - render dinamicamente a seção a partir das configurações
// ========================================
function renderComoGanhar(settings = {}) {
    const container = document.querySelector('.como-ganhar');
    if (!container) return;

    const pointsPerReal = (settings.pointsPerReal !== undefined) ? settings.pointsPerReal : 0.1;
    const bonusRegistration = settings.bonusRegistration || 50;
    const referralBonus = settings.referralBonus || 50;

    const lines = [
        {
            icon: '🍔',
            title: 'Compre no cardápio',
            desc: `${formatNumber(pointsPerReal)} ponto(s) por R$1 gasto (configurado: ${pointsPerReal} ponto(s)/R$)`
        },
        {
            icon: '🎁',
            title: 'Bônus de cadastro',
            desc: `Ganhe ${bonusRegistration} pontos ao criar sua conta`
        },
        {
            icon: '📱',
            title: 'Indique amigos',
            desc: `Ganhe ${referralBonus} pontos quando seu amigo se registrar`
        },
        {
            icon: '🎉',
            title: 'Promoções especiais',
            desc: 'Pontos extras durante promoções — fique de olho nas ofertas!'
        }
    ];

    const html = `
        <h3>Como Ganhar Pontos?</h3>
        <ul class="pontos-list">
            ${lines.map(l => `
                <li>
                    <span class="icon">${l.icon}</span>
                    <div>
                        <strong>${l.title}</strong>
                        <p>${l.desc}</p>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;

    container.innerHTML = html;
}

function formatNumber(n) {
    // Remove trailing zeros for nicer display
    if (Number.isInteger(n)) return String(n);
    return String(parseFloat(n));
}

// Atualizar quando as settings mudarem (outras abas)
window.addEventListener('storage', async (ev) => {
    try {
        if (!ev.key) return;
        if (ev.key === 'joburguers_settings_v1' || ev.key.includes('settings')) {
            // obter as settings mais atuais via storage API
            const s = await getSettings();
            console.info('[cliente] settings changed via storage event, re-rendering Como Ganhar');
            renderComoGanhar(s);
        }
    } catch (e) { console.warn('[cliente] error handling storage event for settings', e); }
});

// ========================================
// ALTERAR SENHA
// ========================================

function setupChangePassword() {
    const btn = document.getElementById('changePasswordBtn');
    const modal = document.getElementById('changePasswordModal');
    const form = document.getElementById('changePasswordForm');
    const cancelBtn = document.getElementById('cancelPassword');

    if (!btn) return;

    btn.addEventListener('click', () => {
        form.reset();
        modal.style.display = 'flex';
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('formMessage');

        if (newPassword.length < 4) {
            showErrorMessage('Senha deve ter no mínimo 4 caracteres', messageDiv);
            return;
        }

        if (newPassword !== confirmPassword) {
            showErrorMessage('As senhas não conferem', messageDiv);
            return;
        }

        // Atualizar senha
        const updated = updateClient(currentClient.id, {
            password: newPassword
        });

        if (updated) {
            currentClient = updated;
            showNotification('✓ Senha alterada com sucesso!', 'success');
            modal.style.display = 'none';
            form.reset();
        }
    });
}

function showErrorMessage(message, element) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('alert--success');
    element.classList.add('alert--error');
    element.style.display = 'block';
}
