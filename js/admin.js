// admin.js - versão totalmente assíncrona e compatível com storage.js
import {
  initializeStorage,
  getCurrentSession,
  clearSession,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllClients,
  getClientById,
  addClient,
  updateClient,
  deleteClient,
  addPointsToClient,
  getAllPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
  getAllRedeems,
  addRedeem,
  updateRedeem,
  deleteRedeem,
  getSettings,
  updateSettings,
  getAllTransactions,
  exportAllData,
  importAllData,
  clearAllData
} from './storage.js';

import {
  formatCurrency,
  formatDate,
  formatPhone,
  showNotification,
  showConfirmDialog,
  downloadJSON,
  readJSONFile
} from './utils.js';

// Placeholders
const DEFAULT_THUMB = 'https://via.placeholder.com/60?text=Sem+Imagem';
const DEFAULT_PROMO_IMG = 'https://via.placeholder.com/100x60?text=Sem+Imagem';

// helper
const $id = id => document.getElementById(id);
const escapeHtml = s => {
  if (!s && s !== 0) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

async function init() {
  await initializeStorage();

  const session = await getCurrentSession();
  if (!session || session.userType !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  if ($id('adminUsername')) $id('adminUsername').textContent = session.username || 'Admin';

  setupHamburger();
  setupNavigation();
  setupLogout();

  // load modules
  await loadDashboard();
  await setupProductsSection();
  await setupClientsSection();
  await setupPromotionsSection();
  await setupRedeemSection();
  await setupSettings();
}

document.addEventListener('DOMContentLoaded', init);

// ---------------- Hamburger & overlay ----------------
function setupHamburger() {
  const hamburger = $id('hamburgerBtn');
  const sidebar = $id('adminSidebar');
  const overlay = $id('sidebarOverlay');

  function openSidebar() {
    // show overlay and sidebar (no animation - instant)
    if (overlay) overlay.style.display = 'block';
    if (sidebar) sidebar.style.display = 'block';
    // add mobile class to sidebar for styling if needed
    if (sidebar) sidebar.classList.add('mobile');
    // clicking overlay closes
    if (overlay) overlay.onclick = closeSidebar;
  }

  function closeSidebar() {
    if (overlay) overlay.style.display = 'none';
    if (sidebar) sidebar.style.display = ''; // restore default (desktop handles display)
    if (sidebar) sidebar.classList.remove('mobile');
    if (overlay) overlay.onclick = null;
  }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  // close sidebar on window resize > 768
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      if (overlay) overlay.style.display = 'none';
      if (sidebar) sidebar.style.display = ''; // let css handle it
      if (sidebar) sidebar.classList.remove('mobile');
    }
  });
}

// ---------------- Navigation (sidebar items) ----------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.admin-nav__item');
  if (!navItems) return;
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('admin-nav__item--active'));
      btn.classList.add('admin-nav__item--active');
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('admin-section--active'));
      const target = btn.dataset.section;
      const el = $id(target);
      if (el) el.classList.add('admin-section--active');

      // if mobile, close overlay/sidebar
      const overlay = $id('sidebarOverlay');
      const sidebar = $id('adminSidebar');
      if (overlay) overlay.style.display = 'none';
      if (sidebar) { sidebar.style.display = ''; sidebar.classList.remove('mobile'); }
    });
  });
}

// ---------------- Logout ----------------
function setupLogout() {
  const btn = $id('adminLogoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await clearSession();
    window.location.href = 'index.html';
  });
}

// ---------------- Dashboard ----------------
async function loadDashboard() {
  try {
    const products = await getAllProducts();
    const clients = await getAllClients();
    const transactions = await getAllTransactions();

    if ($id('totalProducts')) $id('totalProducts').textContent = (products || []).length;
    if ($id('totalClientes')) $id('totalClientes').textContent = (clients || []).length;
    let totalPoints = 0;
    (clients || []).forEach(c => totalPoints += (c.points || 0));
    if ($id('totalPoints')) $id('totalPoints').textContent = totalPoints;
    if ($id('recentTransactions')) $id('recentTransactions').textContent = (transactions || []).slice(-10).length;

    const recentActivities = $id('recentActivities');
    if (recentActivities) {
      const recent = (transactions || []).slice(-5).reverse();
      if (recent.length === 0) {
        recentActivities.innerHTML = '<p style="text-align:center; color:#808080;">Nenhuma atividade recente</p>';
      } else {
        recentActivities.innerHTML = recent.map(act => `
          <div class="activity-item">
            <div class="activity-item__time">${formatDate(act.timestamp)}</div>
            <div class="activity-item__desc">${act.type === 'ganho' ? '✓ Pontos ganhos' : '📊 Resgate'}: ${(act.points>0?'+':'')}${act.points} pontos</div>
          </div>
        `).join('');
      }
    }
  } catch (err) { console.warn('dashboard error', err); }
}

// ---------------- Products section ----------------
async function setupProductsSection() {
  const addBtn = $id('addProductBtn');
  const productForm = $id('productForm');
  const closeProductBtn = $id('closeProductModal');

  if (!productForm || !addBtn) return;

  addBtn.addEventListener('click', () => {
    productForm.reset();
    productForm.dataset.productId = '';
    openModal('productModal', 'Novo Produto');
  });

  if (closeProductBtn) closeProductBtn.addEventListener('click', () => closeModal('productModal'));

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // gather data
    const fileInput = $id('productImageFile');
    let imageValue = ($id('productImage') && $id('productImage').value) ? $id('productImage').value.trim() : '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        imageValue = await fileToDataURL(fileInput.files[0]);
      } catch (err) {
        console.warn('image read failed', err);
        showNotification('Erro ao ler imagem, produto será salvo sem imagem.', 'warning');
      }
    }
    // keep image optional
    if (!imageValue) imageValue = '';

    const productData = {
      name: $id('productName').value.trim(),
      category: $id('productCategory').value,
      price: parseFloat($id('productPrice').value) || 0,
      image: imageValue,
      description: $id('productDescription').value.trim(),
      ingredients: ($id('productIngredients').value || '').split(',').map(i => i.trim()).filter(Boolean),
      available: !!$id('productAvailable').checked
    };

    const pid = productForm.dataset.productId;
    if (pid) {
      await updateProduct(pid, productData);
      showNotification('✓ Produto atualizado!', 'success');
    } else {
      await addProduct(productData);
      showNotification('✓ Produto criado!', 'success');
    }

    if (fileInput) fileInput.value = '';
    closeModal('productModal');
    await loadProductsTable();
    await loadRedeemOptions();
    await loadDashboard();
  });

  await loadProductsTable();
}

async function loadProductsTable() {
  const tbody = $id('productsTableBody');
  if (!tbody) return;
  const products = await getAllProducts();

  if (!products || products.length === 0) {
    $id('productsList').style.display = 'none';
    $id('emptyProducts').style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  $id('productsList').style.display = 'block';
  $id('emptyProducts').style.display = 'none';

  tbody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
      <td><img class="table-image" src="${p.image || DEFAULT_THUMB}" alt="${escapeHtml(p.name)}" onerror="this.src='${DEFAULT_THUMB}'"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || '')}</td>
      <td>${formatCurrency(p.price || 0)}</td>
      <td><span class="status-badge status-badge--${p.available? 'disponivel':'indisponivel'}">${p.available? 'Disponível':'Indisponível'}</span></td>
      <td>
        <div class="table-actions">
          <button data-action="edit" data-id="${p.id}" class="table-btn table-btn--edit">Editar</button>
          <button data-action="delete" data-id="${p.id}" class="table-btn table-btn--delete">Deletar</button>
        </div>
      </td>
    </tr>
  `).join('');

  // make rows clickable (open product view)
  tbody.querySelectorAll('tr[data-id]').forEach(tr => {
    tr.style.cursor = 'pointer';
    tr.onclick = (ev) => {
      // prevent when clicking the action buttons
      if (ev.target && (ev.target.closest('button') || ev.target.nodeName === 'BUTTON')) return;
      const id = tr.dataset.id;
      openProductModal(id);
    };
  });

  // bind edit/delete buttons
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') btn.onclick = (e) => { e.stopPropagation(); openEditProduct(id); };
    if (btn.dataset.action === 'delete') btn.onclick = (e) => {
      e.stopPropagation();
      showConfirmDialog('Deletar Produto?', 'Esta ação não pode ser desfeita.', async () => {
        await deleteProduct(id);
        showNotification('✓ Produto deletado!', 'success');
        await loadProductsTable();
        await loadRedeemOptions();
        await loadDashboard();
      });
    };
  });
}

async function openEditProduct(id) {
  const p = await getProductById(id);
  if (!p) return;
  const form = $id('productForm');
  if (!form) return;
  $id('productModalTitle').textContent = 'Editar Produto';
  $id('productName').value = p.name || '';
  $id('productCategory').value = p.category || '';
  $id('productPrice').value = p.price || 0;
  $id('productImage').value = p.image || '';
  $id('productDescription').value = p.description || '';
  $id('productIngredients').value = (p.ingredients || []).join(', ');
  $id('productAvailable').checked = !!p.available;
  form.dataset.productId = id;
  openModal('productModal');
}

// open product view modal (image contain + details)
async function openProductModal(id) {
  const p = await getProductById(id);
  if (!p) return;
  if ($id('productViewTitle')) $id('productViewTitle').textContent = p.name || 'Produto';
  if ($id('productViewImage')) {
    $id('productViewImage').src = p.image || DEFAULT_THUMB;
    $id('productViewImage').alt = p.name || 'Imagem';
  }
  if ($id('productViewCategory')) $id('productViewCategory').textContent = `Categoria: ${p.category || '—'}`;
  if ($id('productViewPrice')) $id('productViewPrice').textContent = formatCurrency(p.price || 0);
  if ($id('productViewDescription')) $id('productViewDescription').textContent = p.description || '';
  if ($id('productViewIngredients')) $id('productViewIngredients').textContent = (p.ingredients && p.ingredients.length) ? `Ingredientes: ${p.ingredients.join(', ')}` : '';
  if ($id('productViewAvailable')) $id('productViewAvailable').textContent = p.available ? 'Disponível' : 'Indisponível';

  // buttons
  $id('productViewEditBtn').onclick = () => { closeModal('productViewModal'); openEditProduct(id); };
  $id('productViewDeleteBtn').onclick = () => {
    showConfirmDialog('Deletar Produto?', 'Esta ação não pode ser desfeita.', async () => {
      await deleteProduct(id);
      showNotification('✓ Produto deletado!', 'success');
      closeModal('productViewModal');
      await loadProductsTable();
      await loadRedeemOptions();
      await loadDashboard();
    });
  };
  $id('productViewClose').onclick = () => closeModal('productViewModal');

  openModal('productViewModal');
}

// ---------------- Products helper ----------------
async function loadRedeemOptions() {
  const sel = $id('redeemProduct');
  if (!sel) return;
  const products = await getAllProducts();
  sel.innerHTML = '<option value="">Selecione um produto</option>' + (products || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
}

// ---------------- Clients section ----------------
async function setupClientsSection() {
  const addBtn = $id('addClientBtn');
  const form = $id('clientForm');
  const closeBtn = $id('closeClientModal');
  if (addBtn) addBtn.addEventListener('click', () => { form.reset(); form.dataset.clientId = ''; openModal('clientModal'); });
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('clientModal'));
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: $id('clientName').value.trim(),
        phone: formatPhone($id('clientPhone').value),
        email: ($id('clientEmail').value || '').trim(),
        password: ($id('clientPassword').value || null),
        points: parseInt($id('clientPoints').value) || 0,
        active: !!$id('clientActive').checked
      };
      const id = form.dataset.clientId;
      if (id) {
        if (!data.password) delete data.password;
        await updateClient(id, data);
        showNotification('✓ Cliente atualizado!', 'success');
      } else {
        await addClient(data);
        showNotification('✓ Cliente criado!', 'success');
      }
      closeModal('clientModal');
      await loadClientsTable();
      await loadDashboard();
    });
  }
  await loadClientsTable();

  // sync across tabs
  window.addEventListener('storage', async (ev) => {
    if (!ev.key) return;
    if (ev.key.includes('clients')) {
      await loadClientsTable();
      showNotification('Lista de clientes atualizada (sincronização entre abas).', 'info');
    }
    if (ev.key.includes('products')) {
      await loadProductsTable();
      await loadRedeemOptions();
    }
  });
}

async function loadClientsTable() {
  const tbody = $id('clientsTableBody');
  if (!tbody) return;
  const clients = await getAllClients();
  if (!clients || clients.length === 0) {
    $id('clientsList').style.display = 'none';
    $id('emptyClients').style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  $id('clientsList').style.display = 'block';
  $id('emptyClients').style.display = 'none';
  tbody.innerHTML = (clients || []).map(c => `
    <tr data-id="${c.id}">
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td>${c.points || 0}</td>
      <td>${escapeHtml(c.level || 'bronze')}</td>
      <td>${(c.createdAt) ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
      <td>
        <div class="table-actions">
          <button data-action="manage" data-id="${c.id}" class="table-btn table-btn--manage">Pontos</button>
          <button data-action="edit" data-id="${c.id}" class="table-btn table-btn--edit">Editar</button>
          <button data-action="delete" data-id="${c.id}" class="table-btn table-btn--delete">Deletar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    const id = btn.dataset.id;
    const act = btn.dataset.action;
    if (act === 'manage') btn.onclick = () => managePoints(id);
    if (act === 'edit') btn.onclick = () => editClient(id);
    if (act === 'delete') btn.onclick = () => {
      showConfirmDialog('Deletar Cliente?', 'Esta ação não pode ser desfeita.', async () => {
        await deleteClient(id);
        showNotification('✓ Cliente deletado!', 'success');
        await loadClientsTable();
        await loadDashboard();
      });
    };
  });
}

window.editClient = async function(id) {
  const c = await getClientById(id);
  if (!c) return;
  $id('clientName').value = c.name || '';
  $id('clientPhone').value = c.phone || '';
  $id('clientEmail').value = c.email || '';
  $id('clientPassword').value = c.password || '';
  $id('clientPoints').value = c.points || 0;
  $id('clientActive').checked = !!c.active;
  $id('clientForm').dataset.clientId = id;
  openModal('clientModal');
};

function managePoints(clientId) {
  const client = null; // we'll open a quick modal for points - reuse existing points modal? Not implemented in this snippet.
  // For brevity, using prompt
  const amountStr = prompt('Quantidade de pontos (use negativo para remover):');
  const reason = prompt('Motivo:') || '';
  const amount = parseInt(amountStr) || 0;
  addPointsToClient(clientId, amount, reason).then(() => {
    showNotification('✓ Pontos atualizados!', 'success');
    loadClientsTable();
    loadDashboard();
  });
}

// ---------------- Promotions ----------------
async function setupPromotionsSection() {
  const addBtn = $id('addPromotionBtn');
  const form = $id('promotionForm');
  const closeBtn = $id('closePromotionModal');
  if (addBtn) addBtn.addEventListener('click', () => { form.reset(); form.dataset.promotionId = ''; openModal('promotionModal'); });
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('promotionModal'));
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = $id('promotionPhoto');
      let photo = '';
      if (fileInput && fileInput.files && fileInput.files[0]) {
        try { photo = await fileToDataURL(fileInput.files[0]); } catch (err) { console.warn(err); showNotification('Erro ao ler imagem, promoção será salva sem imagem.', 'warning'); }
      }
      const promo = {
        name: $id('promotionName').value.trim(),
        value: $id('promotionValue').value.trim(),
        description: $id('promotionDescription').value.trim(),
        photo: photo || '',
        instagramLink: $id('promotionInstagramLink').value || '',
        active: !!$id('promotionActive').checked
      };
      const id = form.dataset.promotionId;
      if (id) { await updatePromotion(id, promo); showNotification('✓ Promoção atualizada!', 'success'); }
      else { await addPromotion(promo); showNotification('✓ Promoção criada!', 'success'); }
      if (fileInput) fileInput.value = '';
      closeModal('promotionModal');
      await loadPromotionsTable();
    });
  }
  await loadPromotionsTable();
}

async function loadPromotionsTable() {
  const tbody = $id('promotionsTableBody');
  if (!tbody) return;
  const promos = await getAllPromotions();
  tbody.innerHTML = (promos || []).map(p => `
    <tr>
      <td>${p.photo ? `<img src="${p.photo}" class="table-image-small" onerror="this.src='${DEFAULT_PROMO_IMG}'">` : `<span style="color:#777">Sem imagem</span>`}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.value)}</td>
      <td>${escapeHtml((p.description||'').slice(0,50))}${(p.description||'').length>50?'...':''}</td>
      <td><span class="status-badge ${p.active?'status-badge--ativo':'status-badge--inativo'}">${p.active?'Ativa':'Inativa'}</span></td>
      <td>
        <div class="table-actions">
          <button data-action="edit" data-id="${p.id}" class="table-btn table-btn--edit">Editar</button>
          <button data-action="delete" data-id="${p.id}" class="table-btn table-btn--delete">Deletar</button>
        </div>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-action]').forEach(b => {
    const id = b.dataset.id;
    if (b.dataset.action === 'edit') b.onclick = () => openEditPromotion(id);
    if (b.dataset.action === 'delete') b.onclick = () => {
      showConfirmDialog('Deletar Promoção?', 'Esta ação não pode ser desfeita.', async () => {
        await deletePromotion(id);
        showNotification('✓ Promoção deletada!', 'success');
        await loadPromotionsTable();
      });
    };
  });
}

async function openEditPromotion(id) {
  const promo = (await getAllPromotions()).find(p => p.id === id);
  if (!promo) return;
  $id('promotionName').value = promo.name || '';
  $id('promotionValue').value = promo.value || '';
  $id('promotionDescription').value = promo.description || '';
  $id('promotionInstagramLink').value = promo.instagramLink || '';
  $id('promotionActive').checked = !!promo.active;
  $id('promotionForm').dataset.promotionId = id;
  openModal('promotionModal');
}

// ---------------- Redeems ----------------
async function setupRedeemSection() {
  const addBtn = $id('addRedeemBtn');
  const form = $id('redeemForm');
  const closeBtn = $id('closeRedeemModal');
  if (addBtn) addBtn.addEventListener('click', () => { form.reset(); form.dataset.redeemId = ''; openModal('redeemModal'); });
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('redeemModal'));
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pid = $id('redeemProduct').value;
    if (!pid) { showNotification('Selecione um produto válido.', 'error'); return; }
    const redeem = {
      productId: pid,
      pointsRequired: parseInt($id('redeemPointsRequired').value) || 0,
      active: !!$id('redeemActive').checked
    };
    const rid = form.dataset.redeemId;
    if (rid) { await updateRedeem(rid, redeem); showNotification('✓ Resgate atualizado!', 'success'); }
    else { await addRedeem(redeem); showNotification('✓ Resgate criado!', 'success'); }
    closeModal('redeemModal');
    await loadRedeemsTable();
  });
  await loadRedeemsTable();
  await loadRedeemOptions();
}

async function loadRedeemsTable() {
  const tbody = $id('redeemsTableBody');
  if (!tbody) return;
  const redeems = await getAllRedeems();
  tbody.innerHTML = (redeems || []).map(r => {
    const prod = (async () => { try { return await getProductById(r.productId); } catch(e){ return null; } })();
    // We'll just show productId for speed and then refresh text node
    return `<tr data-id="${r.id}"><td data-prod="${r.productId}">Carregando...</td><td>${r.pointsRequired}</td><td><span class="status-badge ${r.active?'status-badge--ativo':'status-badge--inativo'}">${r.active?'Ativo':'Inativo'}</span></td><td><div class="table-actions"><button data-action="delete" data-id="${r.id}" class="table-btn table-btn--delete">Deletar</button></div></td></tr>`;
  }).join('');
  // resolve product names
  for (const td of Array.from(tbody.querySelectorAll('td[data-prod]'))) {
    const pid = td.dataset.prod;
    const prod = await getProductById(pid);
    td.textContent = prod ? prod.name : 'Produto não encontrado';
  }
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    if (btn.dataset.action === 'delete') btn.onclick = () => {
      const id = btn.dataset.id;
      showConfirmDialog('Deletar Resgate?', 'Esta ação não pode ser desfeita.', async () => {
        await deleteRedeem(id);
        showNotification('✓ Resgate deletado!', 'success');
        await loadRedeemsTable();
      });
    };
  });
}

// ---------------- Settings ----------------
async function setupSettings() {
  const s = await getSettings();
  if ($id('pointsPerReal')) $id('pointsPerReal').value = s.pointsPerReal || 0.1;
  if ($id('bonusRegistration')) $id('bonusRegistration').value = s.bonusRegistration || 50;
  if ($id('referralBonus')) $id('referralBonus').value = s.referralBonus || 50;
  $id('pointsSettingsForm').onsubmit = async (e) => {
    e.preventDefault();
    await updateSettings({
      pointsPerReal: parseFloat($id('pointsPerReal').value),
      bonusRegistration: parseInt($id('bonusRegistration').value),
      referralBonus: parseInt($id('referralBonus').value)
    });
    showNotification('✓ Configurações de pontos salvas!', 'success');
  };

  // store info
  if ($id('storeName')) $id('storeName').value = s.storeName || '';
  if ($id('storeAddress')) $id('storeAddress').value = s.storeAddress || '';
  if ($id('storePhone')) $id('storePhone').value = s.storePhone || '';
  if ($id('storeHours')) $id('storeHours').value = s.storeHours || '';
  $id('storeInfoForm').onsubmit = async (e) => {
    e.preventDefault();
    await updateSettings({
      storeName: $id('storeName').value,
      storeAddress: $id('storeAddress').value,
      storePhone: $id('storePhone').value,
      storeHours: $id('storeHours').value
    });
    showNotification('✓ Informações salvas!', 'success');
  };

  // export/import/reset
  $id('exportDataBtn').onclick = async () => {
    const data = await exportAllData();
    downloadJSON(data, `joburguers-backup-${new Date().toISOString().split('T')[0]}.json`);
    showNotification('✓ Dados exportados!', 'success');
  };
  $id('importDataBtn').onclick = () => $id('importFile').click();
  $id('importFile').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      await importAllData(data);
      showNotification('✓ Dados importados!', 'success');
      location.reload();
    } catch (err) {
      showNotification('✗ Erro ao importar dados', 'error');
    }
  };
  $id('resetDataBtn').onclick = () => {
    showConfirmDialog('Limpar todos os dados?', 'Isto apagará todos os dados. Deseja continuar?', async () => {
      await clearAllData();
      location.reload();
    });
  };
}

// ---------------- Utilities ----------------
function openModal(id, title) {
  const el = $id(id);
  if (!el) return;
  el.classList.add('show');
  if (title) {
    const h = el.querySelector('h2');
    if (h) h.textContent = title;
  }
  el.style.display = 'flex';
}
function closeModal(id) {
  const el = $id(id);
  if (!el) return;
  el.classList.remove('show');
  el.style.display = 'none';
}
async function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// small helpers for formatting
function formatDate(d) {
  try { return new Date(d).toLocaleString('pt-BR'); } catch(e) { return '-'; }
}

async function loadAllInitial() {
  await loadProductsTable();
  await loadClientsTable();
  await loadPromotionsTable();
  await loadRedeemsTable();
}

