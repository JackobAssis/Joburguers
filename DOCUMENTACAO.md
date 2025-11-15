# 📚 Documentação Completa - Joburguers

## Índice
1. [Instalação](#instalação)
2. [Estrutura do Projeto](#estrutura)
3. [Como Usar](#como-usar)
4. [Sistema de Dados](#dados)
5. [Personalizações](#personalizações)
6. [Deploy](#deploy)
7. [Troubleshooting](#troubleshooting)

---

## Instalação

### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Editor de código (VS Code, Sublime, etc) - opcional
- Git - opcional

### Passo a Passo

1. **Clonar o repositório**
```bash
git clone https://github.com/seu-usuario/joburguers.git
cd joburguers
```

2. **Iniciar servidor local**

**Opção 1: Python**
```bash
python3 -m http.server 8000
# Acesse http://localhost:8000
```

**Opção 2: Node.js**
```bash
npx http-server -p 8000 -o
```

**Opção 3: VS Code Live Server**
- Instale a extensão "Live Server"
- Clique direito em `index.html` → "Open with Live Server"

---

## Estrutura

### Pastas Principais

```
joburguers/
│
├── 📄 Arquivos HTML (Páginas)
│   ├── index.html           ← Cardápio (página pública)
│   ├── login.html           ← Login (admin e clientes)
│   ├── cliente.html         ← Painel do cliente
│   ├── admin.html           ← Painel administrativo
│   └── produto.html         ← Detalhes de produto
│
├── 🎨 css/
│   ├── globals.css          ← Estilos globais
│   ├── header.css           ← Header e footer
│   ├── index.css            ← Página principal
│   ├── login.css            ← Login
│   ├── cliente.css          ← Painel cliente
│   ├── produto.css          ← Página produto
│   └── admin.css            ← Painel admin
│
├── ⚙️ js/
│   ├── storage.js           ← Gerenciamento de dados
│   ├── utils.js             ← Funções utilitárias
│   ├── app.js               ← Lógica cardápio
│   ├── login.js             ← Lógica login
│   ├── cliente.js           ← Lógica painel cliente
│   ├── admin.js             ← Lógica painel admin
│   └── produto.js           ← Lógica página produto
│
├── 🖼️ assets/
│   ├── images/              ← Fotos de produtos
│   └── icons/               ← Ícones
│
└── 📋 Config
    ├── package.json         ← Info do projeto
    ├── vercel.json          ← Config deploy
    └── .gitignore           ← Arquivos ignorados
```

### Fluxo de Arquivo

```
Cliente acessa → index.html (app.js) → Seleciona produto
                          ↓
                  produto.html (produto.js)
                          ↓
         login.html (login.js) → cliente.html (cliente.js)
                          ↑
                    Admin faz login
                          ↓
                  admin.html (admin.js)
```

---

## Como Usar

### 👥 Para Clientes

#### Ver Cardápio (sem login)
1. Acesse `index.html`
2. Browse produtos em grid
3. Use busca e filtros
4. Clique em produto para detalhes
5. Use botão WhatsApp para pedir

#### Fazer Login (com login)
1. Clique em "Login" no header
2. Selecione aba "Cliente"
3. Digite telefone: `(85) 9 9999-9999`
4. Confirme o telefone como senha
5. Acesse `cliente.html`

#### No Painel Cliente
- **Dashboard**: Veja seus pontos e nível
- **Meus Pontos**: Veja regras e resgates disponíveis
- **Histórico**: Veja todas suas transações
- **Meus Dados**: Atualize suas informações

### 👨‍💼 Para Admin

#### Fazer Login
1. Acesse `login.html`
2. Selecione aba "Administrador"
3. Email: `admin@joburguers.com`
4. Senha: `admin123`
5. Acesse `admin.html`

#### Gerenciar Produtos
1. Menu → "Produtos"
2. Clique "+ Novo Produto"
3. Preencha:
   - Nome
   - Categoria
   - Preço
   - URL da imagem
   - Descrição
   - Ingredientes (opcional)
4. Clique "Salvar Produto"

**Editar/Deletar:**
- Clique "Editar" para modificar
- Clique "Deletar" para remover

#### Gerenciar Clientes
1. Menu → "Clientes"
2. Clique "+ Novo Cliente"
3. Preencha dados
4. Clique "Salvar Cliente"

**Adicionar Pontos:**
- Clique botão "Pontos" na tabela
- Digite quantidade (positivo = ganho, negativo = resgate)
- Selecione motivo
- Confirme

#### Configurações do Sistema
1. Menu → "Configurações"
2. Edite:
   - **Pontuação**: Regras de ganho de pontos
   - **Níveis**: Thresholds de cada nível
   - **Informações da Loja**: Dados para exibição

#### Backup e Restore
- **Exportar**: Clique botão com seta para baixo
- **Importar**: Clique botão com seta para cima
- **Limpar**: Clique botão lixo (com confirmação)

---

## Dados

### Estrutura do LocalStorage

Cada item é salvo como JSON em chaves específicas:

```javascript
{
  "admin_user": {
    "email": "admin@joburguers.com",
    "password": "admin123",
    "name": "Administrador"
  },
  
  "clients_data": [
    {
      "id": 1,
      "name": "João Silva",
      "phone": "(85) 9 9999-9999",
      "points": 150,
      "level": "silver",
      "createdAt": "2025-11-14T10:30:00Z",
      "active": true
    }
  ],
  
  "products_data": [
    {
      "id": 1,
      "name": "Hamburger Clássico",
      "category": "hamburguer",
      "price": 25.00,
      "image": "https://...",
      "description": "...",
      "available": true
    }
  ]
}
```

### Categorias de Produto
- `hamburguer` - Hambúrgueres
- `bebida` - Bebidas
- `combo` - Combos
- `acompanhamento` - Acompanhamentos

### Níveis de Cliente
| Nível | Pontos | Emoji |
|-------|--------|-------|
| Bronze | 0-99 | 🥉 |
| Prata | 100-299 | 🥈 |
| Ouro | 300-499 | 🥇 |
| Platina | 500+ | 💎 |

### Transações
```javascript
{
  "id": 1,
  "clientId": 1,
  "points": 50,
  "type": "ganho", // ou "resgate"
  "reason": "compra", // ou "bono", "ajuste", etc
  "timestamp": "2025-11-14T10:30:00Z"
}
```

---

## Personalizações

### 🔒 Mudar Senha Admin

**Arquivo**: `js/storage.js` linha ~18

```javascript
const DEFAULT_ADMIN = {
    email: 'admin@joburguers.com',
    password: 'MUDE_AQUI', // ← Altere
    name: 'Administrador'
};
```

### 📱 Configurar WhatsApp

**Arquivo**: `index.html` linha ~130

```html
<a href="https://wa.me/5585999999999?text=..." class="whatsapp-btn">
    <!-- Mude 5585999999999 para seu número com código do país -->
</a>
```

**Arquivo**: `produto.html` linha ~160

```javascript
const phone = '5585999999999'; // ← Mude aqui também
```

### 🎨 Alterar Cores

**Arquivo**: `css/globals.css`

```css
/* Cores principais */
--primary-color: #ff9500;   /* Laranja */
--secondary-color: #1a1a1a; /* Escuro */
--accent-color: #e74c3c;    /* Vermelho */

/* Exemplo de mudança */
.btn--primary {
    background-color: #ff9500; /* ← Mude aqui */
}
```

### 🔤 Alterar Fonte

**Arquivo**: `css/globals.css`

```css
body {
    font-family: 'Poppins', 'Inter', sans-serif;
    /* Mude para: 'Roboto', 'Lato', 'Playfair Display', etc */
}
```

### 📸 Adicionar Produtos de Exemplo

**Arquivo**: `js/storage.js` função `initializeStorage()`

```javascript
const defaultProducts = [
    {
        id: 1,
        name: 'Seu Produto',
        category: 'hamburguer',
        price: 25.00,
        image: 'https://sua-imagem.jpg',
        description: 'Descrição do produto',
        ingredients: ['Ingrediente 1', 'Ingrediente 2'],
        available: true,
        createdAt: new Date().toISOString()
    }
];
```

### 🏪 Informações da Loja

**Arquivo**: `js/storage.js`

```javascript
const DEFAULT_SETTINGS = {
    storeName: 'Joburguers',
    storeAddress: 'Rua das Hambúrgueres, 123',
    storePhone: '(85) 99999-9999',
    storeHours: 'Seg-Dom 11h às 23h',
    // ... mais configurações
};
```

---

## Deploy

### Opção 1: Vercel (Recomendado)

**Via CLI:**
```bash
npm install -g vercel
vercel
# Siga as instruções no terminal
```

**Via GitHub:**
1. Push para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique "New Project"
4. Selecione o repositório
5. Clique "Deploy"

**URL final**: `seu-nome.vercel.app`

### Opção 2: GitHub Pages

1. Faça push para GitHub
2. Vá em Settings → Pages
3. Selecione "Deploy from a branch"
4. Escolha `main` branch
5. Aguarde ~5 minutos

**URL final**: `seu-usuario.github.io/joburguers`

### Opção 3: Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique "Add new site"
3. Selecione repositório
4. Clique "Deploy site"

**URL final**: `seu-site.netlify.app`

---

## Troubleshooting

### ❌ Erro: Dados não aparecem após refresh

**Causa**: localStorage está desabilitado ou limpo

**Solução**:
```javascript
// Abra console (F12) e execute:
localStorage.getItem('products_data');
// Se retornar null, os dados foram perdidos
// Clique em Admin → Configurações → Limpar dados e reabra
```

### ❌ Erro: "Imagens não carregam"

**Causa**: URL de imagem inválida ou quebrada

**Solução**:
1. Use URLs HTTPS
2. Teste a URL no navegador
3. Prefira plataformas como: Imgur, Cloudinary, Unsplash

**Exemplo de URL válida**:
```
https://via.placeholder.com/400x300?text=Hamburger
```

### ❌ Erro: "Login não funciona"

**Causa**: Cache do navegador

**Solução**:
```
Ctrl + Shift + Del (Windows)
Cmd + Shift + Del (Mac)
```

Selecione:
- ☑️ Cookies
- ☑️ Cache
- ☑️ Local Storage

### ❌ Erro: "Estilos não aparecem"

**Causa**: Caminho de arquivo incorreto

**Solução**:
1. Verifique que `css/` existe na mesma pasta de `index.html`
2. Abra DevTools (F12) → Network → verifique status 404
3. Corrija o caminho no HTML

### ❌ Erro: "Módulos ES6 não funcionam"

**Causa**: Arquivo aberto diretamente (não via servidor)

**Solução**:
- Use um servidor local (ver [Instalação](#instalação))
- Não abra `file://` diretamente

### 💡 Dica: Visualizar Dados

```javascript
// Cole no console (F12):
console.log(JSON.parse(localStorage.getItem('clients_data')));
// Mostra todos os clientes
```

---

## Scripts Úteis

### Adicionar Cliente via Console

```javascript
import { addClient } from './js/storage.js';
addClient({
    name: 'Novo Cliente',
    phone: '(85) 9 1234-5678',
    points: 100
});
```

### Resetar Dados

```javascript
// No console:
localStorage.clear();
location.reload();
```

### Exportar Dados

```javascript
import { exportAllData } from './js/storage.js';
const data = exportAllData();
copy(JSON.stringify(data)); // Copia para clipboard
```

---

## Boas Práticas

✅ **DO:**
- Fazer backup regularmente
- Mudar senha admin antes de deploy
- Validar URLs de imagem
- Testar em mobile
- Usar HTTPS em produção

❌ **DON'T:**
- Deixar senha padrão no admin
- Usar imagens de URL inválida
- Usar localhost em produção
- Armazenar dados sensíveis no localStorage
- Esquecer de fazer backup

---

## Suporte

Se tiver dúvidas:
1. Leia esta documentação novamente
2. Verifique o console (F12)
3. Abra uma issue no GitHub
4. Envie um email

---

**Última atualização**: Novembro de 2025
**Versão**: 1.0.0
