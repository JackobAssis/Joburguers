# 🗺️ Mapa do Projeto - JoBurguers

## Estrutura Completa

```
d:\Arquivos DEV\Joburguers\
│
├── 📄 Arquivos Raiz
│   ├── index.html                  [Página Inicial - Cardápio]
│   ├── login.html                  [Login Cliente/Admin]
│   ├── cliente.html                [Dashboard Cliente]
│   ├── admin.html                  [Painel Admin]
│   ├── produto.html                [Detalhes do Produto]
│   │
│   ├── package.json                [Metadados NPM]
│   ├── vercel.json                 [Config Vercel Deploy]
│   ├── .gitignore                  [Config Git]
│   │
│   └── 📚 Documentação
│       ├── README.md               [Visão Geral do Projeto]
│       ├── DOCUMENTACAO.md         [Docs Técnicas Completas]
│       ├── TESTE_LOCAL.md          [Guia de Testes]
│       ├── DEPLOY_VERCEL.md        [Guia de Deployment]
│       ├── MELHORIAS_SUGERIDAS.md  [Ideias de Features]
│       ├── MAPA_PROJETO.md         [Este arquivo]
│       └── QUICK_REFERENCE.md      [Referência Rápida]
│
├── 📁 css/ [Estilos - 7 arquivos]
│   ├── globals.css                 [Tema global + reset]
│   ├── header.css                  [Header/Nav]
│   ├── footer.css                  [Footer + floating buttons]
│   ├── index.css                   [Página inicial]
│   ├── login.css                   [Página de login]
│   ├── cliente.css                 [Dashboard cliente]
│   ├── admin.css                   [Painel admin]
│   └── produto.css                 [Página de produto]
│
├── 📁 js/ [JavaScript - 7 módulos]
│   ├── storage.js                  [Data management + CRUD]
│   ├── utils.js                    [Utility functions]
│   ├── app.js                      [Lógica página inicial]
│   ├── login.js                    [Lógica de autenticação]
│   ├── cliente.js                  [Lógica dashboard cliente]
│   ├── admin.js                    [Lógica painel admin]
│   └── produto.js                  [Lógica página produto]
│
└── 📁 assets/ [Mídia - criar conforme necessário]
    ├── 📁 imgs/
    │   ├── logo.png
    │   ├── hero-banner.jpg
    │   └── produtos/
    │       ├── hamburguer-1.jpg
    │       ├── hamburguer-2.jpg
    │       └── ...
    ├── 📁 icons/
    │   ├── heart.svg
    │   ├── star.svg
    │   └── ...
    └── 📁 placeholders/
        └── default-product.jpg
```

---

## 📱 Fluxo de Páginas

### Visitante Anônimo

```
┌─────────────┐
│ index.html  │  ← Entrada (cardápio público)
│  (cardápio) │
└──────┬──────┘
       │
       ├─→ [Clica "Login"] ──→ login.html
       ├─→ [Clica Produto] ──→ produto.html?id=123
       └─→ [WhatsApp Button] ──→ Abre chat WhatsApp
```

### Cliente Registrado

```
┌─────────────┐
│ login.html  │  ← Faz login
└──────┬──────┘
       │
       ├─→ [Cliente Login] ──→ cliente.html
       │                       ├─ Dashboard (pontos/perfil)
       │                       ├─ Meus Pontos (resgates)
       │                       ├─ Histórico (transações)
       │                       └─ Meus Dados (perfil)
       │
       └─→ [Admin Login] ──→ admin.html
                           ├─ Dashboard (stats)
                           ├─ Produtos (CRUD)
                           ├─ Clientes (gerenciar)
                           ├─ Promoções (criar)
                           ├─ Resgates (configurar)
                           └─ Configurações (backup)
```

---

## 🔄 Fluxo de Dados

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────┐
│ Apresentação (HTML + CSS)                    │
│ index.html, login.html, cliente.html, etc   │
└────────────────────┬────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│ Lógica de Página (JavaScript)                │
│ app.js, login.js, cliente.js, admin.js      │
└────────────────────┬────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│ Utilitários (utils.js)                      │
│ - Formatação (currency, date, phone)        │
│ - Validação (email, phone, URL)             │
│ - DOM (createElement, notifications)        │
│ - Arquivo (JSON export/import)              │
└────────────────────┬────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│ Dados (storage.js)                          │
│ - CRUD de Clientes, Produtos, Transações   │
│ - Cálculo de Níveis/Pontos                  │
│ - Gerenciamento de Sessão                   │
└────────────────────┬────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│ localStorage API (Browser)                  │
│ Persistência local de dados                 │
└─────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados

### Cliente (Customer)

```javascript
{
  id: "cli_001",                    // ID único
  name: "João Silva",               // Nome completo
  phone: "11987654321",             // Telefone
  password: "hash_senha",           // Senha (não salva em texto plano idealmente)
  points: 250,                      // Saldo de pontos
  level: "silver",                  // Nível (bronze/silver/gold/platinum)
  active: true,                     // Status
  createdAt: "2025-01-15T10:30:00" // Data de cadastro
}
```

### Produto

```javascript
{
  id: "prod_001",                   // ID único
  name: "Hambúrguer Clássico",     // Nome
  category: "hamburguer",           // Categoria
  price: 29.90,                     // Preço
  image: "url-da-imagem.jpg",      // Foto
  description: "Descrição...",      // Descrição
  ingredients: ["carne", "queijo"], // Ingredientes (opcional)
  available: true,                  // Disponibilidade
  nutritional: { cal: 500 }         // Info nutricional (opcional)
}
```

### Transação

```javascript
{
  id: "trans_001",                  // ID único
  clientId: "cli_001",              // Referência ao cliente
  points: 50,                       // Quantidade de pontos
  type: "purchase",                 // Tipo (purchase/redeem/bonus)
  reason: "Compra no cardápio",    // Motivo
  timestamp: "2025-01-15T10:30:00" // Data/hora
}
```

### Promoção

```javascript
{
  id: "promo_001",                  // ID único
  name: "Cupom 10%",               // Nome
  description: "10% de desconto",   // Descrição
  discount: 10,                     // Desconto (%)
  startDate: "2025-01-15",          // Data início
  endDate: "2025-01-31",            // Data fim
  active: true                      // Status
}
```

### Resgate

```javascript
{
  id: "resgate_001",                // ID único
  name: "Suco Grátis",             // Nome do prêmio
  description: "Suco natural...",  // Descrição
  points: 100,                      // Pontos necessários
  available: true                   // Disponível para resgate
}
```

---

## 🔐 Fluxo de Autenticação

### Login Cliente

```
1. Usuário digita telefone + senha
   ↓
2. Valida formato de telefone (11 dígitos)
   ↓
3. Procura cliente em localStorage
   ↓
4. Verifica senha
   ├─ ✅ Senha correta → Salva sessão → Redireciona para cliente.html
   └─ ❌ Senha errada → Mostra erro
```

### Login Admin

```
1. Usuário digita email + senha
   ↓
2. Valida formato de email
   ↓
3. Compara com DEFAULT_ADMIN em storage.js
   ├─ ✅ Credenciais corretas → Salva sessão → Redireciona para admin.html
   └─ ❌ Credenciais incorretas → Mostra erro
```

### Registro Cliente

```
1. Usuário preenche: telefone, senha, aceita termos
   ↓
2. Valida telefone e senha
   ↓
3. Verifica se telefone já existe
   ├─ ✅ Novo cliente → Cria com 50 pontos bônus → Login automático
   └─ ❌ Já existe → Mostra erro
```

---

## 📈 Fluxo de Pontos

### Ganhar Pontos

```
Compra no cardápio (simulada)
   ↓
Admin adiciona pontos (ou sistema calcula)
   ↓
Registra em transação
   ↓
Atualiza saldo cliente
   ↓
Recalcula nível
   ↓
Cliente vê pontos no dashboard
```

### Resgatar Pontos

```
Cliente clica "Resgatar" em prêmio
   ↓
Sistema verifica saldo
   ├─ ✅ Pontos suficientes → Confirma resgate
   └─ ❌ Insuficiente → Mostra erro

Após confirmação:
   ↓
Deduz pontos
   ↓
Registra transação (tipo: "resgate")
   ↓
Admin vê em "Resgates Pendentes"
   ↓
Marca como entregue
```

---

## 🎨 Paleta de Cores

```css
/* Cores Principais */
--primary-color: #ff9500;           /* Laranja - CTA, Buttons */
--secondary-color: #ffb84d;         /* Laranja claro - Hover */
--danger-color: #ef4444;            /* Vermelho - Deletar, Risco */
--success-color: #10b981;           /* Verde - Sucesso */
--warning-color: #f59e0b;           /* Amarelo - Aviso */

/* Neutros */
--bg-dark: #0f0f0f;                 /* Fundo escuro (preto) */
--bg-card: #1a1a1a;                 /* Card background */
--border-color: #404040;            /* Bordas */
--text-light: #ffffff;              /* Texto principal */
--text-muted: #9ca3af;              /* Texto secundário */

/* Níveis */
--bronze: #cd7f32;                  /* Bronze */
--silver: #c0c0c0;                  /* Prata */
--gold: #ffd700;                    /* Ouro */
--platinum: #e5e4e2;                /* Platina */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile (padrão) */
0 - 479px          /* Extra pequeno */

/* Mobile Large */
480px - 767px      /* Tablet pequeno */

/* Tablet */
768px - 1023px     /* Tablet grande */

/* Desktop */
1024px+            /* Desktop e acima */
```

### Grid Responsivo

```
Desktop (>768px):  3 colunas
Tablet (480-768):  2 colunas
Mobile (<480px):   1 coluna
```

---

## 🧪 Testes por Página

### index.html ✅
- [x] Cardápio carrega
- [x] Busca funciona
- [x] Filtros funcionam
- [x] Cards clicáveis
- [x] Responsivo

### login.html ✅
- [x] Abas funcionam
- [x] Validação de entrada
- [x] Registro funciona
- [x] Redirect após login

### cliente.html ✅
- [x] Dashboard carrega
- [x] Pontos exibem
- [x] Histórico mostra
- [x] Resgate funciona

### admin.html ✅
- [x] Produtos CRUD
- [x] Clientes gerenciáveis
- [x] Configurações salvam
- [x] Backup funciona

### produto.html ✅
- [x] Detalhes carregam
- [x] URL parameter funciona
- [x] Relacionados exibem
- [x] WhatsApp funciona

---

## 🚀 Deploy Timeline

```
Dia 1: Testes Locais
├─ Executar servidor
├─ Testar todas as páginas
└─ Verificar funcionalidades

Dia 2: Preparação Deploy
├─ Alterar senha admin
├─ Atualizar WhatsApp
└─ Criar GitHub repo

Dia 3: Deploy
├─ Push para GitHub
├─ Conectar ao Vercel
└─ Deploy automático

Dia 4: Verificação
├─ Testar site em produção
├─ Adicionar produtos reais
└─ Verificar WhatsApp

Dia 5+: Lançamento
├─ Compartilhar com clientes
├─ Monitorar analytics
└─ Fazer ajustes
```

---

## 📚 Referência Rápida de Arquivos

| Arquivo | Linhas | Função |
|---------|--------|--------|
| storage.js | 550 | Gerenciamento de dados |
| utils.js | 350 | Funções auxiliares |
| admin.js | 600 | Lógica painel admin |
| cliente.js | 400 | Lógica dashboard cliente |
| app.js | 250 | Lógica página inicial |
| login.js | 250 | Autenticação |
| produto.js | 100 | Detalhes do produto |
| globals.css | 300 | Tema global |
| cliente.css | 500 | Estilos cliente |
| admin.css | 350 | Estilos admin |
| **Total** | **~5500** | **Código completo** |

---

## 🔑 Chaves Importantes

### localStorage Keys
```javascript
'joburguers_admin'           // Admin data
'joburguers_clients'         // Clientes
'joburguers_products'        // Produtos
'joburguers_transactions'    // Transações
'joburguers_promotions'      // Promoções
'joburguers_redeems'         // Resgates
'joburguers_settings'        // Configurações
'joburguers_session'         // Sessão atual
```

### IDs dos Elementos HTML

```javascript
// Modais
'productModal'
'pointsModal'
'settingsModal'

// Forms
'loginForm'
'registerForm'
'productForm'

// Containers
'productGrid'
'clientTable'
'transactionHistory'

// Buttons
'logoutBtn'
'whatsappBtn'
'scrollTopBtn'
```

---

## 🎓 Como Usar Este Mapa

1. **Primeira vez?** Comece pelo `QUICK_REFERENCE.md`
2. **Quer testar?** Vá para `TESTE_LOCAL.md`
3. **Quer fazer deploy?** Consulte `DEPLOY_VERCEL.md`
4. **Técnico/Desenvolvimento?** Veja `DOCUMENTACAO.md`
5. **Quer melhorias?** Leia `MELHORIAS_SUGERIDAS.md`
6. **Referência visual?** Este arquivo (`MAPA_PROJETO.md`)

---

## 🎯 Checklist Inicial

- [ ] Ler `QUICK_REFERENCE.md`
- [ ] Executar servidor local (`python -m http.server 8000`)
- [ ] Acessar `http://localhost:8000`
- [ ] Testar cardápio
- [ ] Fazer login admin
- [ ] Fazer login cliente
- [ ] Adicionar produto teste
- [ ] Adicionar pontos teste
- [ ] Verificar histórico
- [ ] Confirmar dados salvam após refresh

---

## 🎉 Você está pronto!

Agora que conhece a estrutura, está pronto para:
- ✅ Testar localmente
- ✅ Fazer customizações
- ✅ Fazer deploy
- ✅ Usar em produção

**Boa sorte! 🚀**

---

**Desenvolvido com ❤️ e ☕**
**JoBurguers v1.0.0 - 2025**
