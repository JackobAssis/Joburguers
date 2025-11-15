/**
 * CLIENTE.JS - Painel do Cliente com Sistema de Pontos
 */

import {
    initializeStorage,
    getCurrentSession,
    clearSession,
    getClientById,
    updateClient,
    getClientTransactions,
    getAllRedeems,
    addPointsToClient,
    getSettings,
    calculateLevel,
    getPointsUntilNextLevel
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

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();

    const session = getCurrentSession();
    if (!session || session.userType !== 'cliente') {
        window.location.href = 'login.html';
        return;
    }

    currentClient = getClientById(session.userId);
    if (!currentClient) {
        clearSession();
        window.location.href = 'login.html';
        return;
    }

    setupNavigation();
    setupLogout();
    loadDashboard();
    loadPontos();
    loadHistorico();
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

function loadDashboard() {
    const settings = getSettings();
    
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
    const progress = Math.min(100, ((currentClient.points - levelPoints) / (nextLevelPoints - levelPoints)) * 100);
    
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentPoints').textContent = currentClient.points;
    document.getElementById('levelTarget').textContent = nextLevelPoints;
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

function loadPontos() {
    // Saldos
    document.getElementById('saldoPontos').textContent = currentClient.points;
    
    const transactions = getClientTransactions(currentClient.id);
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

function loadResgates() {
    const redeems = getAllRedeems();
    const grid = document.getElementById('resgatesGrid');

    if (redeems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum resgate disponível</p>';
        return;
    }

    grid.innerHTML = redeems
        .filter(r => r.active)
        .map(redeem => `
            <div class="resgate-card">
                <h4>${redeem.name}</h4>
                <p>${redeem.points} pontos</p>
                <p style="color: #ff9500; font-weight: 600;">
                    ${redeem.type === 'percentage' ? redeem.value + '%' : formatCurrency(redeem.value)}
                </p>
                <button class="btn ${currentClient.points >= redeem.points ? 'btn--primary' : 'btn--secondary'} btn--small" 
                        ${currentClient.points < redeem.points ? 'disabled' : ''}
                        onclick="resgatarPontos(${redeem.id})">
                    ${currentClient.points >= redeem.points ? 'Resgatar' : 'Pontos Insuficientes'}
                </button>
            </div>
        `).join('');
}

window.resgatarPontos = function(redeemId) {
    const redeem = getAllRedeems().find(r => r.id === redeemId);
    if (!redeem) return;

    showConfirmDialog(
        'Confirmar Resgate',
        `Deseja resgatar "${redeem.name}" por ${redeem.points} pontos?`,
        () => {
            if (currentClient.points >= redeem.points) {
                addPointsToClient(currentClient.id, -redeem.points, 'resgate');
                currentClient.points -= redeem.points;
                
                showNotification(`✓ Resgate realizado! Você ganhou ${redeem.value}% de desconto!`, 'success');
                loadPontos();
                loadDashboard();
            }
        }
    );
};

// ========================================
// HISTÓRICO
// ========================================

function loadHistorico() {
    const transactions = getClientTransactions(currentClient.id);
    const list = document.getElementById('historicoList');
    const empty = document.getElementById('emptyHistorico');

    if (transactions.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.style.display = 'block';

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

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const updated = updateClient(currentClient.id, {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            birthdate: document.getElementById('editBirthdate').value
        });

        if (updated) {
            currentClient = updated;
            showNotification('✓ Dados atualizados com sucesso!', 'success');
            document.getElementById('clientName').textContent = currentClient.name;
        }
    });
}

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
