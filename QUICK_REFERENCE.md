# 📋 Quick Reference - JoBurguers

## 🎯 O que foi criado?

Um sistema completo de hamburgueria digital com:
- ✅ Cardápio digital público
- ✅ Sistema de pontos/rewards
- ✅ Painel de admin
- ✅ Dashboard de cliente
- ✅ Integração WhatsApp
- ✅ Responsivo para mobile
- ✅ Pronto para Vercel

---

## 📂 Estrutura de Arquivos

```
joburguers/
├── index.html              # Página inicial (cardápio)
├── login.html              # Login cliente/admin
├── cliente.html            # Dashboard do cliente
├── admin.html              # Painel de administração
├── produto.html            # Página de produto individual
├── css/                    # Estilos (7 arquivos)
├── js/                     # Lógica (7 módulos)
├── assets/                 # Imagens e ícones (criar)
├── package.json            # Metadados do projeto
├── vercel.json             # Config Vercel
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Visão geral do projeto
├── DOCUMENTACAO.md         # Documentação completa
├── MELHORIAS_SUGERIDAS.md # Ideias para melhorias
├── TESTE_LOCAL.md          # Guia de testes
├── DEPLOY_VERCEL.md        # Guia de deployment
└── QUICK_REFERENCE.md      # Este arquivo
```

---

## 🚀 Começar Rápido

### 1. Executar Localmente

```powershell
cd "d:\Arquivos DEV\Joburguers"
python -m http.server 8000
```

Acesse: `http://localhost:8000`

### 2. Credenciais Padrão

**Admin:**
- Email: `admin@joburguers.com`
- Senha: `admin123`

**Cliente (criar novo):**
- Telefone: `11999999999`
- Senha: qualquer uma

### 3. Fazer Deploy

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/usuario/joburguers.git
git push -u origin main
```

Depois conectar no Vercel.com → Import Git Repo → Deploy

---

## ⚡ Tarefas Urgentes Antes de Publicar

```
[ ] 1. Alterar senha admin em js/storage.js
[ ] 2. Atualizar número WhatsApp em index.html e produto.html
[ ] 3. Testar localmente (TESTE_LOCAL.md)
[ ] 4. Fazer push para GitHub
[ ] 5. Deploy em Vercel (DEPLOY_VERCEL.md)
```

---

## 📱 Páginas Principais

| Página | URL | Função |
|--------|-----|--------|
| **Home** | `/index.html` | Cardápio público |
| **Login** | `/login.html` | Entrar como admin ou cliente |
| **Admin** | `/admin.html` | Gerenciar tudo |
| **Cliente** | `/cliente.html` | Ver pontos e histórico |
| **Produto** | `/produto.html?id=1` | Detalhes do produto |

---

## 🔑 Recursos Principais

### Para Clientes
- 📋 Ver cardápio completo
- 🔐 Login com telefone
- 🏆 Visualizar pontos (4 níveis)
- 💰 Resgatar prêmios
- 📊 Ver histórico de transações
- ⚙️ Gerenciar perfil

### Para Admin
- 📦 CRUD de produtos
- 👥 Gerenciar clientes
- 🎁 Criar promoções
- 💎 Configurar resgates
- 📈 Ver estatísticas
- 💾 Backup/Restore dados

---

## 📊 Dados Persistentes

Tudo é salvo em **localStorage** (browser do usuário):
- Clientes
- Produtos
- Pontos e histórico
- Promoções
- Resgates
- Configurações

⚠️ **Não há servidor backend** - dados não sincronizam entre dispositivos.

---

## 🎨 Cores e Estilo

```css
--primary-color: #ff9500      /* Laranja */
--secondary-color: #ffb84d    /* Laranja claro */
--bg-dark: #0f0f0f            /* Preto */
--text-light: #ffffff         /* Branco */
```

Edite em `css/globals.css` para customizar.

---

## 🧪 Testar Tudo

```powershell
# 1. Terminal 1: Iniciar servidor
python -m http.server 8000

# 2. Terminal 2 ou Browser
# Abrir http://localhost:8000

# 3. Executar testes do arquivo TESTE_LOCAL.md
```

**Ver detalhes:** `TESTE_LOCAL.md`

---

## 📤 Deploy Checklist

- [ ] Senha admin alterada
- [ ] WhatsApp number atualizado
- [ ] Todos os arquivos em Git
- [ ] Push para GitHub
- [ ] Conectado ao Vercel
- [ ] Deploy sucesso ✅
- [ ] URL funcionando
- [ ] Login funciona
- [ ] WhatsApp funciona

**Ver detalhes:** `DEPLOY_VERCEL.md`

---

## 💡 Sugestões Rápidas

### Adicionar Produto (via Admin)
1. Login admin
2. Clique "Produtos"
3. "Adicionar Produto"
4. Preencha formulário
5. Salvar

### Gerenciar Pontos
1. Login admin
2. "Clientes"
3. Clique cliente
4. "Gerenciar Pontos"
5. Adicionar/Remover pontos

### Criar Resgate (Premio)
1. Login admin
2. "Resgates"
3. "Adicionar"
4. Nome, descrição, pontos
5. Salvar

### Configurar Níveis
1. Login admin
2. "Configurações"
3. "Níveis"
4. Editar thresholds
5. Salvar

---

## 🆘 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Console com erros | Verifique TESTE_LOCAL.md |
| Login não funciona | Altere senha admin, execute `initializeStorage()` |
| Imagens não carregam | Use URLs HTTPS ou imagens placeholder |
| localStorage vazio | Execute `initializeStorage()` no console |
| Site lento | Verificar performance com Lighthouse |
| Dados não salvam | localStorage pode estar cheio |

---

## 📚 Arquivos de Referência

| Arquivo | Propósito |
|---------|-----------|
| `README.md` | Visão geral do projeto |
| `DOCUMENTACAO.md` | Docs técnicas completas (5000+ linhas) |
| `TESTE_LOCAL.md` | Guia passo-a-passo para testes |
| `DEPLOY_VERCEL.md` | Guia completo de deployment |
| `MELHORIAS_SUGERIDAS.md` | Ideias de features extras |
| `QUICK_REFERENCE.md` | Este arquivo (referência rápida) |

---

## 🔗 Links Úteis

- **Seu site:** https://joburguers.vercel.app
- **GitHub:** https://github.com/seu-usuario/joburguers
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs

---

## 💻 Comandos Terminal

```powershell
# Iniciar servidor local
python -m http.server 8000

# Git - primeira vez
git init
git add .
git commit -m "mensagem"
git remote add origin https://github.com/usuario/repo.git
git push -u origin main

# Git - atualizações
git add .
git commit -m "mudança"
git push

# Ver branches
git branch

# Ver histórico
git log --oneline
```

---

## ✅ Próximos Passos

1. **Imediato:**
   - [ ] Ler este arquivo

2. **Hoje:**
   - [ ] Executar `python -m http.server 8000`
   - [ ] Testar em `http://localhost:8000`
   - [ ] Verificar console (F12)

3. **Hoje/Amanhã:**
   - [ ] Alterar senha admin
   - [ ] Atualizar WhatsApp
   - [ ] Adicionar alguns produtos

4. **Semana:**
   - [ ] Criar GitHub repo
   - [ ] Deploy Vercel
   - [ ] Testar em produção

5. **Depois:**
   - [ ] Compartilhar com clientes
   - [ ] Monitorar analytics
   - [ ] Considerar melhorias (MELHORIAS_SUGERIDAS.md)

---

## 🎓 Aprender Mais

- `TESTE_LOCAL.md` → Testes completos
- `DEPLOY_VERCEL.md` → Deployment
- `DOCUMENTACAO.md` → Código técnico
- `MELHORIAS_SUGERIDAS.md` → Ideias futuras

---

## 📞 Suporte

Dúvidas? Consulte:
1. Arquivo relevante (TESTE_LOCAL, DEPLOY_VERCEL, etc)
2. Console do navegador (F12)
3. Logs do Vercel
4. Stack Overflow ou GitHub Issues

---

## 🎉 Pronto!

Seu sistema JoBurguers está **100% pronto** para:
- ✅ Testar localmente
- ✅ Compartilhar com amigos
- ✅ Deploy em produção
- ✅ Usar com clientes reais

**Boa sorte! 🚀**

---

**Desenvolvido com ❤️ e ☕**
**JoBurguers v1.0.0 - 2025**
