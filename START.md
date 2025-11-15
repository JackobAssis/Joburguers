# 🚀 START - Comece Aqui!

## Olá! 👋

Seu **JoBurguers** está **100% pronto**!

Siga estas 3 etapas simples para começar:

---

## ✅ Etapa 1: Executar Localmente (2 minutos)

### 1️⃣ Abra PowerShell

Procure por "PowerShell" no seu computador e abra.

### 2️⃣ Cole este comando

```powershell
cd "d:\Arquivos DEV\Joburguers" ; python -m http.server 8000
```

### 3️⃣ Você verá algo assim

```
Serving HTTP on 0.0.0.0 port 8000
http://[::1]:8000/
```

✅ **Sucesso!** Seu servidor está rodando.

---

## ✅ Etapa 2: Abrir no Navegador (1 minuto)

Abra seu navegador (Chrome, Firefox, Edge) e digite:

```
http://localhost:8000
```

Você deve ver a página inicial do JoBurguers com o cardápio! 🍔

---

## ✅ Etapa 3: Testar Login (2 minutos)

### Para Testar Admin:
1. Clique em "Login" (canto superior)
2. Selecione aba "Admin"
3. Digite:
   - **Email:** admin@joburguers.com
   - **Senha:** admin123
4. Clique "Entrar"

Você deve ver o painel de administração!

### Para Testar Cliente:
1. Volte em "Login"
2. Clique em "Registrar" (aba Cliente)
3. Digite um telefone: `11987654321`
4. Digite uma senha: `teste123`
5. Clique "Registrar"

Você deve ver o dashboard do cliente!

---

## 🎯 Próximos Passos

### Agora que funciona localmente:

1. **Adicionar Produtos:**
   - Login como admin
   - Vá em "Produtos"
   - Clique "Adicionar Produto"
   - Preencha e salve

2. **Testar Tudo:**
   - Consulte: `TESTE_LOCAL.md`
   - Segue um checklist completo

3. **Fazer Deploy:**
   - Consulte: `DEPLOY_VERCEL.md`
   - Passo a passo com imagens

4. **Personalizar:**
   - Consulte: `QUICK_REFERENCE.md`
   - Seção "Customizações"

---

## 📚 Documentação Rápida

| Arquivo | O que é | Quando ler |
|---------|---------|-----------|
| **QUICK_REFERENCE.md** | Referência rápida | Sempre |
| **TESTE_LOCAL.md** | Como testar | Antes de deploy |
| **DEPLOY_VERCEL.md** | Como publicar | Para ir ao ar |
| **DOCUMENTACAO.md** | Documentação técnica | Se quer entender o código |

👉 **Comece com QUICK_REFERENCE.md** (5 min)

---

## ⚠️ Importante Antes de Publicar

Quando quiser colocar seu site no ar, **altere a senha admin**:

1. Abra `js/storage.js` em um editor de texto
2. Procure por `password: 'admin123'`
3. Mude para uma senha forte, ex: `password: 'SuaSenha123!'`
4. Salve o arquivo

**⚠️ NÃO ESQUEÇA!** Caso contrário, qualquer um poderá acessar seu painel admin.

---

## 🆘 Algo Deu Errado?

### O servidor não inicia?
```powershell
# Tente este comando:
cd "d:\Arquivos DEV\Joburguers"
python -m http.server 8000
```

Se não funcionar, tente `python3` em vez de `python`.

### A página não carrega?
- Certifique-se que digitou certo: `http://localhost:8000`
- Verifique que o PowerShell ainda está rodando
- Se não, repita o comando acima

### Login não funciona?
- Certifique-se que está na aba certa (Admin ou Cliente)
- Admin: email `admin@joburguers.com` + senha `admin123`
- Cliente: faça um novo registro

### Mais problemas?
Consulte: `TESTE_LOCAL.md` (seção Troubleshooting)

---

## 📝 Arquivos Criados

```
✅ 5 páginas HTML
✅ 8 arquivos CSS
✅ 7 módulos JavaScript
✅ 8 documentações
✅ Configuração Vercel
✅ Arquivo Git
✅ Tudo pronto para produção!
```

---

## 🎉 Você conseguiu!

Se chegou até aqui:
- ✅ Seu projeto funciona localmente
- ✅ Você sabe como fazer login
- ✅ Sabe onde está a documentação
- ✅ Está pronto para os próximos passos

**Parabéns! 🎊**

---

## 🚀 Próximo: Aprenda o Projeto

Leia nesta ordem (15 minutos total):

1. **README.md** (visão geral)
2. **QUICK_REFERENCE.md** (referência rápida)
3. **MAPA_PROJETO.md** (estrutura)

Depois:
- **TESTE_LOCAL.md** (para testar tudo)
- **DEPLOY_VERCEL.md** (para publicar)

---

## 💬 Resumo

```
⏱️ Tempo gasto: 5 minutos
🎯 Resultado: Projeto rodando localmente
📚 Próximo: Ler QUICK_REFERENCE.md
🚀 Depois: Deploy no Vercel
```

---

## 📞 Contato / Suporte

Se tiver dúvidas:
1. Consulte os arquivos `.md` (documentação)
2. Verifique se o erro está em TESTE_LOCAL.md
3. Procure a solução em DOCUMENTACAO.md

---

**Bem-vindo ao JoBurguers! 🍔**

**Desenvolvido com ❤️ e ☕**

---

## ⭐ Próxima Ação

👉 **Abra PowerShell e execute:**

```powershell
cd "d:\Arquivos DEV\Joburguers" ; python -m http.server 8000
```

Depois abra: `http://localhost:8000`

✨ **Seu projeto está esperando!**
