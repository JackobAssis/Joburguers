# 🚀 Guia de Deploy - JoBurguers no Vercel

## 1. Pré-Requisitos

Você precisará de:
- ✅ Conta GitHub (gratuita em https://github.com)
- ✅ Conta Vercel (gratuita em https://vercel.com)
- ✅ Git instalado (https://git-scm.com/download/win)
- ✅ Projeto funcionando localmente

---

## 2. Preparar Projeto Localmente

### 2.1 Abrir Terminal PowerShell

```powershell
cd "d:\Arquivos DEV\Joburguers"
```

### 2.2 Inicializar Git

```powershell
# Inicializar repositório
git init

# Ver arquivos
git status
```

Você deve ver algo assim:
```
On branch master
Initial commit

Untracked files:
  (use "git add <file>..." to include in what is contained in the commit)
        .gitignore
        README.md
        index.html
        ...
```

### 2.3 Configurar Usuário Git (primeira vez)

```powershell
git config --global user.email "seu@email.com"
git config --global user.name "Seu Nome"
```

### 2.4 Adicionar Arquivos ao Git

```powershell
# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status
```

### 2.5 Fazer Primeiro Commit

```powershell
git commit -m "Initial commit: JoBurguers - Complete hamburger shop system"
```

---

## 3. Criar Repositório no GitHub

### 3.1 Acessar GitHub

1. Abra https://github.com e faça login
2. Clique em "New" (canto superior esquerdo)
3. Preencha:
   - **Repository name:** `joburguers` (ou seu nome)
   - **Description:** "Digital hamburger shop with rewards system"
   - **Public** (para Vercel acessar)
   - ✅ Não inicialize com README (já temos um)

### 3.2 Copiar URL do Repositório

Depois de criar, você verá algo como:
```
https://github.com/seu-usuario/joburguers.git
```

Copie este link.

### 3.3 Conectar Repositório Local ao GitHub

```powershell
# Adicionar o remote
git remote add origin https://github.com/seu-usuario/joburguers.git

# Mudar branch para main (padrão do GitHub)
git branch -M main

# Fazer push (enviar) para GitHub
git push -u origin main
```

Você pode ser pedido para autenticar. Se aparecer popup, clique "Authorize".

### 3.4 Verificar no GitHub

1. Acesse https://github.com/seu-usuario/joburguers
2. Você deve ver todos os seus arquivos lá ✅

---

## 4. Deploy no Vercel

### 4.1 Acessar Vercel

1. Abra https://vercel.com
2. Clique "Sign Up"
3. Escolha "Continue with GitHub"
4. Autorize Vercel a acessar seu GitHub

### 4.2 Importar Projeto

1. Na dashboard do Vercel, clique "Add New..."
2. Escolha "Project"
3. Clique "Import Git Repository"
4. Selecione `joburguers` da lista
5. Clique "Import"

### 4.3 Configuração (padrão está OK)

Os padrões estão corretos para nosso projeto estático:
- **Framework Preset:** Other (estático)
- **Root Directory:** ./
- **Build Command:** (deixe em branco)
- **Output Directory:** (deixe em branco)

Clique "Deploy" 🚀

### 4.4 Aguardar Deploy

Você verá uma tela com animação:
```
[████████████░░░░] Building...
Generating...
Optimizing...
Finalizing...
```

Quando terminar, mostrará:
```
✅ Congratulations! Your project has been successfully deployed.
```

---

## 5. Acessar Site Publicado

### 5.1 URL Pública

Você terá uma URL como:
```
https://joburguers.vercel.app
```

**Compartilhe este link com seus clientes!** 🎉

### 5.2 Domínio Customizado (Opcional)

Para usar seu próprio domínio (ex: www.joburguers.com.br):

1. No Vercel, vá a **Settings**
2. Clique em **Domains**
3. Adicione seu domínio
4. Siga as instruções para configurar DNS

---

## 6. Fazer Atualizações

### 6.1 Após Fazer Mudanças Localmente

```powershell
# 1. Fazer as mudanças nos arquivos

# 2. Adicionar mudanças
git add .

# 3. Commit
git commit -m "Descrição da mudança"

# 4. Push para GitHub
git push
```

### 6.2 Vercel Fará Deploy Automaticamente

Vercel detecta mudanças no GitHub e faz deploy automaticamente. Você pode:

1. Acessar Dashboard Vercel
2. Ver histórico de deploys
3. Verificar status

**Novo site estará ao vivo em ~2-3 minutos** ✅

---

## 7. Customizações Antes de Publicar

### ⚠️ CRÍTICO: Alterar Senha Admin

Edite `js/storage.js`:

```javascript
// Antes:
const DEFAULT_ADMIN = {
    id: 'admin001',
    email: 'admin@joburguers.com',
    password: 'admin123'  // ← INSEGURO!
};

// Depois:
const DEFAULT_ADMIN = {
    id: 'admin001',
    email: 'admin@joburguers.com',
    password: 'SuaSenhaNovaForte123!'  // ← Mude para algo seguro
};
```

**Envie para GitHub e Vercel vai atualizar automaticamente.**

### 🔔 Alterar Número WhatsApp

1. Edite `index.html` (procure por `SEU_NUMERO_WHATSAPP`)
2. Edite `produto.html` (procure por `SEU_NUMERO_WHATSAPP`)

Substitua por seu número:
```html
<!-- Antes -->
<a href="https://wa.me/551199999999" class="whatsapp-btn">

<!-- Depois -->
<a href="https://wa.me/551187654321" class="whatsapp-btn">
```

**Formato:** `55` (país) + `11` (DDD) + `987654321` (número)

### 🎨 Personalizar Cores (Opcional)

Edite `css/globals.css`:

```css
:root {
    --primary-color: #ff9500;      /* Cor principal */
    --secondary-color: #ffb84d;    /* Cor secundária */
    --danger-color: #ef4444;       /* Botões de risco */
    --success-color: #10b981;      /* Confirmações */
    --bg-dark: #0f0f0f;            /* Fundo escuro */
    --bg-card: #1a1a1a;            /* Cards */
    --text-light: #ffffff;         /* Texto claro */
}
```

### 📝 Adicionar Dados Reais

**Via Admin Panel (Recomendado):**
1. Acesse `https://joburguers.vercel.app/admin.html`
2. Login: admin@joburguers.com / sua-nova-senha
3. Vá a "Produtos"
4. Clique "Adicionar Produto"
5. Preencha informações dos seus hambúrgueres
6. Clique "Salvar"

**Os dados são salvos no navegador do cliente (localStorage).**

---

## 8. Monitorar Site em Produção

### Dashboard Vercel

Acesse https://vercel.com/dashboard para:

#### Ver Analíticas
- **Edge Network:** Onde seu site está sendo acessado
- **Cache:** Quantos acessos foram servidos do cache
- **Response Time:** Velocidade média

#### Ver Logs de Deploy
1. Clique em seu projeto
2. Vá a **Deployments**
3. Clique no último deploy
4. Veja logs de build (não devem ter erros)

#### Configurar CI/CD
Se quiser deploy automático em cada push do GitHub:
1. **Settings** → **Environment Variables**
2. Adicione variáveis se necessário (opcional para este projeto)

---

## 9. Solução de Problemas

### Problema: Deploy falha

**Solução:**
1. Verifique se todos os arquivos estão no repositório GitHub:
   ```powershell
   git status  # Não deve ter arquivos não-commitados
   ```

2. Verifique se `index.html` está na raiz:
   ```powershell
   ls index.html  # Deve listar o arquivo
   ```

3. Nos logs do Vercel, procure por erros

### Problema: Site carrega mas sem estilos

**Solução:**
1. Verifique que arquivos CSS estão em `css/` pasta
2. Verifique que JS estão em `js/` pasta
3. No console (F12) procure por erros 404

### Problema: Login não funciona

**Solução:**
1. Abra console (F12)
2. Digite: `getAdmin()`
3. Procure pela senha que você configurou
4. Altere em `js/storage.js` se necessário

### Problema: localStorage vazio

**Solução (esperado!):**
- Cada navegador/cliente tem seu próprio localStorage
- Admin deve adicionar dados (produtos, clientes, etc)
- Não é um problema - é por design

---

## 10. Backup e Segurança

### Backup Automático do GitHub

1. Seu repositório GitHub é seu backup automático
2. Todo push é salvo na nuvem
3. Se precisar restaurar:
   ```powershell
   git clone https://github.com/seu-usuario/joburguers.git
   ```

### Backup de Dados do Cliente

Para fazer backup dos dados dos clientes:

1. Acesse o admin panel
2. Vá em **Configurações**
3. Clique "Exportar Dados"
4. Um arquivo JSON será baixado
5. Guarde-o em local seguro

Para restaurar:
1. Vá em **Configurações**
2. Clique "Importar Dados"
3. Selecione o arquivo JSON

---

## 11. Checklist Final de Deploy

- [ ] Senha admin foi alterada
- [ ] Número WhatsApp foi atualizado
- [ ] Todas as mudanças foram commitadas (`git status` limpo)
- [ ] Push foi feito para GitHub (`git push`)
- [ ] Deploy no Vercel terminou com sucesso ✅
- [ ] Site abre em https://joburguers.vercel.app
- [ ] Login admin funciona
- [ ] Pode criar produtos no admin
- [ ] Cardápio mostra os produtos
- [ ] WhatsApp buttons funcionam

---

## 12. Pós-Deploy: Próximas Ações

### Semana 1
- [ ] Testar todas as funcionalidades em produção
- [ ] Adicionar seus produtos reais
- [ ] Configurar promoções e resgates
- [ ] Testar login de clientes
- [ ] Fazer backup de dados

### Semana 2
- [ ] Compartilhar link com alguns clientes beta
- [ ] Coletar feedback
- [ ] Fazer ajustes (cores, produtos, etc)
- [ ] Testar WhatsApp integration

### Semana 3+
- [ ] Lançamento oficial
- [ ] Promover nas redes sociais
- [ ] Monitorar Vercel analytics
- [ ] Adicionar mais produtos/promoções

---

## 13. Informações Úteis

### Links Importantes
- **Seu Site:** https://joburguers.vercel.app (substitua URL)
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Repositório GitHub:** https://github.com/seu-usuario/joburguers
- **Documentação Vercel:** https://vercel.com/docs

### Comandos Git Úteis

```powershell
# Ver histórico de commits
git log

# Ver mudanças não commitadas
git status

# Ver diferença de um arquivo
git diff caminho/arquivo.js

# Desfazer último commit (cuidado!)
git revert HEAD

# Ver branches
git branch -a

# Mudar de branch
git checkout nome-branch
```

### Suporte

- **Vercel Support:** https://vercel.com/support
- **GitHub Help:** https://docs.github.com
- **Stack Overflow:** https://stackoverflow.com (procure por suas dúvidas)

---

## 14. Melhorias Pós-Deploy

Após o launch inicial, considere adicionar:

1. **Analytics:** Google Analytics
2. **Feedback:** Formulário de contato
3. **Push Notifications:** Avisar sobre promoções
4. **Mobile App:** React Native ou Flutter
5. **Backend:** Node.js com banco de dados real

Ver arquivo `MELHORIAS_SUGERIDAS.md` para ideias!

---

**🎉 Parabéns! Seu JoBurguers está no ar!**

Qualquer dúvida, consulte a `DOCUMENTACAO.md` ou `TESTE_LOCAL.md`.

**Desenvolvido com ❤️ e ☕**
