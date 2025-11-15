# 🧪 Guia de Testes Locais - JoBurguers

## 1. Preparação Inicial

### 1.1 Verificar Arquivos
Certifique-se de que todos os arquivos estão presentes:

```
d:\Arquivos DEV\Joburguers\
├── index.html
├── login.html
├── cliente.html
├── admin.html
├── produto.html
├── css/
│   ├── globals.css
│   ├── header.css
│   ├── footer.css
│   ├── index.css
│   ├── login.css
│   ├── cliente.css
│   ├── admin.css
│   └── produto.css
├── js/
│   ├── app.js
│   ├── login.js
│   ├── cliente.js
│   ├── admin.js
│   ├── produto.js
│   ├── storage.js
│   └── utils.js
├── assets/
│   ├── imgs/
│   ├── icons/
│   └── placeholders/
├── package.json
├── vercel.json
├── .gitignore
├── README.md
├── DOCUMENTACAO.md
├── MELHORIAS_SUGERIDAS.md
└── TESTE_LOCAL.md (este arquivo)
```

### 1.2 Abrir Pasta no Terminal

**Windows PowerShell:**
```powershell
cd "d:\Arquivos DEV\Joburguers"
```

## 2. Executar Servidor Local

### Opção 1: Python (Recomendado)
```powershell
# Python 3.x
python -m http.server 8000

# Ou Python 2.x
python -m SimpleHTTPServer 8000
```

### Opção 2: Node.js
```powershell
# Instalar http-server globalmente (primeira vez)
npm install -g http-server

# Iniciar servidor
http-server -p 8000
```

### Opção 3: Usar navegador diretamente
```powershell
# Se não tiver servidor, abrir arquivo direto
# Arquivo > Abrir: d:\Arquivos DEV\Joburguers\index.html
```

**⚠️ Nota:** Alguns recursos podem não funcionar sem servidor (especialmente import de módulos ES6).

## 3. Acessar no Navegador

Após iniciar o servidor:
```
http://localhost:8000
```

Você deve ver a página inicial do JoBurguers com o cardápio.

## 4. Testes Funcionais por Página

### 4.1 Página Inicial (index.html)

**URL:** `http://localhost:8000/index.html`

#### ✅ Checklist de Testes
- [ ] Página carrega sem erros (F12 → Console limpo)
- [ ] Hero section exibe corretamente
- [ ] Barra de busca funciona (digite "hamburguer")
- [ ] Botões de categoria filtram produtos
- [ ] Grid de produtos exibe 3 colunas no desktop
- [ ] Cards de produtos têm hover effect
- [ ] Botão WhatsApp flutuante aparece no canto inferior
- [ ] Botão "Scroll to Top" aparece ao descer página
- [ ] Links de navegação funcionam (Login, Admin, Cardápio)
- [ ] Página é responsiva em mobile (F12 → Device Toolbar)

#### 🧪 Testes Específicos
```javascript
// Cole no console (F12) para testar:

// 1. Verificar se produtos carregaram
console.log(getAllProducts());

// 2. Verificar localStorage
console.log(localStorage.getItem('joburguers_products'));

// 3. Testar busca
window.setupSearch(); // Reinicializar busca

// 4. Ver sessão atual
console.log(getCurrentSession());
```

---

### 4.2 Página de Login (login.html)

**URL:** `http://localhost:8000/login.html`

#### ✅ Checklist de Testes - Admin
- [ ] Aba "Admin" está selecionada
- [ ] Inputs para email e senha aparecem
- [ ] Pode digitar no email
- [ ] Pode digitar na senha
- [ ] Botão "Entrar" funciona
- [ ] Credenciais padrão funcionam:
  - **Email:** admin@joburguers.com
  - **Senha:** admin123

**⚠️ Importante:** Mude a senha antes de fazer deploy!

#### ✅ Checklist de Testes - Cliente
- [ ] Clicar em "Aba Cliente"
- [ ] Inputs para telefone e senha aparecem
- [ ] Pode digitar telefone (formato: 11999999999)
- [ ] Pode digitar senha
- [ ] Botão "Entrar" funciona
- [ ] Aba "Registrar" permite criar novo cliente
  - [ ] Campo telefone
  - [ ] Campo senha
  - [ ] Checkbox aceitar termos
  - [ ] Botão registrar

#### 🧪 Testes Específicos
```javascript
// Testar login com cliente padrão
// Você pode criar um cliente de teste primeiro

// Ou verificar clientes existentes:
console.log(getAllClients());

// Testar validação de telefone
console.log(validatePhone('11999999999')); // true
console.log(validatePhone('123')); // false
```

---

### 4.3 Painel de Admin (admin.html)

**URL:** `http://localhost:8000/admin.html` (após login admin)

#### ✅ Checklist de Testes - Dashboard
- [ ] Página carrega corretamente após login
- [ ] Sidebar com 6 seções aparece:
  1. Dashboard
  2. Produtos
  3. Clientes
  4. Promoções
  5. Resgates
  6. Configurações
- [ ] Header exibe "Admin" e botão Logout
- [ ] Logout funciona (volta para index.html)
- [ ] Stats boxes mostram números corretos
- [ ] Seção "Últimas Atividades" exibe algo

#### ✅ Checklist de Testes - Produtos
- [ ] Clicar em "Produtos" na sidebar
- [ ] Tabela de produtos carrega
- [ ] Cada produto tem 3 botões: Editar, Deletar, Ver
- [ ] Botão "Adicionar Produto" abre modal
- [ ] Preencher formulário:
  - [ ] Nome
  - [ ] Categoria (dropdown)
  - [ ] Preço
  - [ ] Descrição
  - [ ] Imagem (URL)
- [ ] Botão Salvar funciona
- [ ] Produto aparece na tabela
- [ ] Botão Editar abre modal com dados preenchidos
- [ ] Editar e salvar atualiza
- [ ] Botão Deletar pede confirmação
- [ ] Deletar remove da lista

#### ✅ Checklist de Testes - Clientes
- [ ] Clicar em "Clientes" na sidebar
- [ ] Lista de clientes carrega
- [ ] Barra de busca filtra por nome/telefone
- [ ] Cada cliente tem botões: Editar, Gerenciar Pontos, Deletar
- [ ] Clicar "Gerenciar Pontos" abre modal
- [ ] Adicionar pontos funciona (+ 50)
- [ ] Remover pontos funciona (- 10)
- [ ] Confirmação aparece após ação

#### ✅ Checklist de Testes - Configurações
- [ ] Clicar em "Configurações" na sidebar
- [ ] Formulário com várias seções carrega
- [ ] **Pontos por Real:** Editar e salvar
- [ ] **Níveis:** Ver e editar thresholds
- [ ] **Backup:** Botão "Exportar Dados" baixa JSON
- [ ] **Restaurar:** Botão "Importar Dados" carrega arquivo
- [ ] **Limpar:** Botão "Limpar Dados" pede confirmação

#### 🧪 Testes Específicos
```javascript
// Verificar admin logado
console.log(getCurrentSession());

// Listar todos os produtos
console.log(getAllProducts());

// Listar todos os clientes
console.log(getAllClients());

// Testar adição de produto
addProduct({
    name: 'Hambúrguer Teste',
    category: 'hamburguer',
    price: 25.90,
    description: 'Teste',
    image: 'https://via.placeholder.com/300'
});

// Verificar se foi adicionado
console.log(getAllProducts());
```

---

### 4.4 Dashboard do Cliente (cliente.html)

**URL:** `http://localhost:8000/cliente.html` (após login cliente)

#### ✅ Checklist de Testes - Dashboard Geral
- [ ] Página carrega após login de cliente
- [ ] Sidebar com 4 seções aparece:
  1. Dashboard
  2. Meus Pontos
  3. Histórico
  4. Meus Dados
- [ ] Logout funciona
- [ ] Ícone de usuário ou nome aparece no header

#### ✅ Checklist de Testes - Dashboard Principal
- [ ] Card de Perfil exibe:
  - [ ] Nome do cliente
  - [ ] Telefone
  - [ ] Data de cadastro
- [ ] Card "Meus Pontos" exibe:
  - [ ] Saldo total de pontos
- [ ] Card "Meu Nível" exibe:
  - [ ] Nível atual (Bronze/Prata/Ouro/Platina)
  - [ ] Barra de progresso para próximo nível
  - [ ] Pontos até próximo nível
- [ ] Seção "Como Ganhar Pontos" lista instruções
- [ ] Card "Próximas Recompensas" exibe resgates disponíveis

#### ✅ Checklist de Testes - Meus Pontos
- [ ] Saldo total exibido
- [ ] Cards de cada resgate aparecem
- [ ] Cada resgate mostra:
  - [ ] Nome
  - [ ] Pontos necessários
  - [ ] Botão "Resgatar"
- [ ] Clicar "Resgatar" pede confirmação
- [ ] Após confirmação, pontos são deduzidos
- [ ] Transação aparece no histórico

#### ✅ Checklist de Testes - Histórico
- [ ] Lista de transações exibe com:
  - [ ] Data
  - [ ] Tipo (Compra, Resgate, Bônus)
  - [ ] Pontos
  - [ ] Status
- [ ] Botões de filtro funcionam:
  - [ ] Todos
  - [ ] Compras
  - [ ] Resgates
  - [ ] Bônus

#### ✅ Checklist de Testes - Meus Dados
- [ ] Formulário com dados do cliente carrega
- [ ] Pode editar informações
- [ ] Botão "Salvar" funciona
- [ ] Seção "Segurança":
  - [ ] Campo para alterar senha
  - [ ] Botão "Deletar Conta" (com confirmação)

#### 🧪 Testes Específicos
```javascript
// Ver dados do cliente logado
console.log(getCurrentSession());

// Ver pontos do cliente
const client = getCurrentSession().user;
console.log(client.points);

// Ver nível do cliente
console.log(calculateLevel(client.points));

// Ver histórico de transações
console.log(getClientTransactions(client.id));

// Ver resgates disponíveis
console.log(getAllRedeems());
```

---

### 4.5 Página de Produto (produto.html)

**URL:** `http://localhost:8000/produto.html?id=1`

#### ✅ Checklist de Testes
- [ ] Página carrega com detalhes do produto
- [ ] Imagem grande do produto exibe
- [ ] Nome do produto aparece
- [ ] Preço formatado em BRL (R$ XX,XX)
- [ ] Descrição completa visível
- [ ] Categoria exibida com badge
- [ ] Status de disponibilidade aparece
- [ ] Se tiver ingredientes, lista exibe
- [ ] Se tiver informação nutricional, mostra
- [ ] Botão WhatsApp permite solicitar produto
- [ ] Seção "Produtos Relacionados" exibe 3 produtos da mesma categoria
- [ ] Links "Ver mais" nos relacionados funcionam

#### 🧪 Testes Específicos
```javascript
// Testar carregamento com diferentes IDs
// Abra: http://localhost:8000/produto.html?id=1
// Depois: http://localhost:8000/produto.html?id=2

// Verificar produto no console
console.log(getProductById(1));

// Ver todos os produtos
console.log(getAllProducts());
```

---

## 5. Testes de Responsividade

### No DevTools (F12)

#### Desktop (1920px)
- [ ] Grid de produtos em 3 colunas
- [ ] Sidebar visível
- [ ] Todos os botões grandes e clicáveis
- [ ] Nenhum overflow horizontal

#### Tablet (768px)
- [ ] Grid de produtos em 2 colunas
- [ ] Menu em hamburger
- [ ] Sidebar colapsada
- [ ] Texto legível

#### Mobile (375px)
- [ ] Grid de produtos em 1 coluna
- [ ] Menu hamburger funciona
- [ ] Botões grandes para toque
- [ ] Nenhum overflow horizontal
- [ ] Padding/margins apropriados

### Teste Físico em Mobile

1. Descubra seu IP local:
```powershell
ipconfig | findstr "IPv4"
```

2. Acesse no celular:
```
http://SEU_IP:8000
```

Exemplo: `http://192.168.1.100:8000`

---

## 6. Testes de Performance

### Executar Lighthouse

1. Abra DevTools (F12)
2. Vá para aba "Lighthouse"
3. Clique em "Analyze page load"
4. Espere completar

**Metas:**
- Performance: 90+
- Accessibility: 80+
- Best Practices: 80+
- SEO: 80+

### Medir Tempo de Carregamento

No console:
```javascript
// Medir tempo do cardápio
console.time('render-products');
renderProducts(getAllProducts());
console.timeEnd('render-products');

// Verificar tamanho do localStorage
function getStorageSize() {
    let size = 0;
    for (let key in localStorage) {
        size += localStorage[key].length;
    }
    return (size / 1024).toFixed(2) + ' KB';
}
console.log('Storage usado:', getStorageSize());
```

---

## 7. Testes de Segurança

### Testar Sanitização
```javascript
// Tentar injetar script no search
// Campo: <script>alert('xss')</script>

// Verificar se foi neutralizado:
console.log(document.body.innerHTML); // Não deve conter <script>
```

### Testar localStorage
```javascript
// Verificar que dados sensíveis estão seguros
console.log(localStorage);

// Não deve mostrar senhas em texto plano
```

### Testar HTTPS
```javascript
// No console:
console.log(location.protocol);
// Deve retornar: https: (em produção)
```

---

## 8. Testes com Diferentes Navegadores

### Chrome ✅
```powershell
# Windows
& "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:8000
```

### Firefox ✅
```powershell
# Windows
& "C:\Program Files\Mozilla Firefox\firefox.exe" http://localhost:8000
```

### Edge ✅
```powershell
# Windows
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000
```

---

## 9. Testes de Funcionalidades

### Sistema de Pontos
```javascript
// 1. Criar cliente de teste
addClient({
    name: 'Teste Cliente',
    phone: '11987654321',
    password: 'teste123'
});

// 2. Buscar cliente
const client = getClientByPhone('11987654321');

// 3. Adicionar pontos
addPointsToClient(client.id, 50, 'teste');

// 4. Verificar nível
console.log(calculateLevel(client.points));

// 5. Ver transações
console.log(getClientTransactions(client.id));
```

### Sistema de Promoções
```javascript
// 1. Criar promoção
addPromotion({
    name: 'Promoção Teste',
    description: 'Teste de promoção',
    discount: 10,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString() // +7 dias
});

// 2. Listar ativas
console.log(getActivePromotions());
```

### Exportar/Importar Dados
```javascript
// 1. Exportar
const data = exportAllData();
console.log(data);

// 2. Isso vai criar um arquivo JSON
// Use em Settings > Backup > Exportar Dados

// 3. Depois importe para restaurar
// Use em Settings > Backup > Importar Dados
```

---

## 10. Checklist Final Pré-Deploy

- [ ] Nenhum erro no console (F12)
- [ ] Todas as páginas carregam
- [ ] Login admin funciona
- [ ] Login cliente funciona
- [ ] Criar novo cliente funciona
- [ ] CRUD de produtos funciona
- [ ] Adicionar pontos funciona
- [ ] Resgatar pontos funciona
- [ ] Histórico mostra transações
- [ ] Exportar dados funciona
- [ ] Importar dados funciona
- [ ] Responsivo em mobile (375px)
- [ ] Responsivo em tablet (768px)
- [ ] Responsivo em desktop (1920px)
- [ ] WhatsApp buttons funcionam
- [ ] Lighthouse score 80+
- [ ] Sem warnings de segurança
- [ ] Senha admin foi alterada
- [ ] Número WhatsApp foi atualizado
- [ ] README.md está correto
- [ ] .gitignore está configurado

---

## 11. Troubleshooting

### Problema: "Cannot find module"
**Solução:** 
- Verifique que está usando um servidor HTTP (não file://)
- Use Python: `python -m http.server 8000`

### Problema: localStorage vazio
**Solução:**
- Abra o console (F12)
- Digite: `initializeStorage()`
- Recarregue a página

### Problema: Imagens não carregam
**Solução:**
- Verifique as URLs das imagens
- Use imagens de HTTPS (seguras)
- Alternativa: Use `https://via.placeholder.com/300`

### Problema: Login não funciona
**Solução:**
```javascript
// Verificar admin
console.log(getAdmin());

// Verificar clientes
console.log(getAllClients());

// Resetar dados se necessário
initializeStorage();
```

### Problema: Pontos não aparecem
**Solução:**
```javascript
// Verificar cliente
const client = getClientById('id-do-cliente');
console.log(client.points);

// Adicionar pontos manualmente
addPointsToClient(client.id, 100, 'teste');
```

---

## 📞 Próximos Passos

1. **Executar Testes Locais** (este guia)
2. **Fazer Customizações** (MELHORIAS_SUGERIDAS.md)
3. **Criar Repositório GitHub**
4. **Deploy no Vercel**
5. **Compartilhar com Clientes**

---

**Boa sorte com os testes! 🎉**
