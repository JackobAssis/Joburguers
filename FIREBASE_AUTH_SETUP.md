# 🔒 Configuração de Segurança para Produção (Vercel)

## ✅ Implementado

Sistema de autenticação Firebase anônima para produção na Vercel.

## 📋 Passos para Configurar no Firebase Console

### 1. Ativar Autenticação Anônima

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto **"joburguers"**
3. No menu lateral, clique em **"Authentication"** (Autenticação)
4. Vá na aba **"Sign-in method"** (Métodos de login)
5. Clique em **"Anonymous"** (Anônimo)
6. Ative o botão **"Enable"** (Ativar)
7. Clique em **"Save"** (Salvar)

### 2. Atualizar Regras do Firestore

1. No Firebase Console, vá em **"Firestore Database"**
2. Clique na aba **"Rules"** (Regras)
3. Copie o conteúdo do arquivo `firestore.rules` deste projeto
4. Cole no editor de regras
5. Clique em **"Publish"** (Publicar)

### 3. Deploy na Vercel

```bash
# Fazer commit das alterações
git add .
git commit -m "feat: adicionar Firebase Authentication para produção"
git push origin main

# A Vercel vai fazer deploy automático
```

## 🔐 Como Funciona

### Autenticação Anônima

- Quando um usuário acessa o site, é automaticamente autenticado anonimamente
- Não precisa fazer login ou criar conta para navegar
- O Firebase gera um UID único para cada sessão
- Todas as operações no Firestore exigem `request.auth != null`

### Segurança das Regras

```javascript
// Produtos e Promoções: Leitura pública
match /products/{productId} {
  allow read: if true;              // Qualquer um pode ler
  allow write: if request.auth != null;  // Só autenticados podem escrever
}

// Clientes, Transações, Admin: Protegidos
match /clients/{clientId} {
  allow read, write: if request.auth != null;  // Requer autenticação
}
```

## 🧪 Testar Localmente

1. Limpe o cache do navegador (Ctrl + Shift + Del)
2. Abra o site
3. Verifique o console do navegador:
   - Deve aparecer: `[Firebase Auth] Anonymous sign-in successful`
4. Os produtos devem carregar normalmente
5. Não deve haver erros de permissão

## ⚠️ Importante

### Desenvolvimento Local
Se estiver testando localmente e quiser acesso total sem autenticação, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Produção (Vercel)
Use SEMPRE as regras do arquivo `firestore.rules` que exigem autenticação.

## 📊 Monitoramento

Após o deploy, monitore no Firebase Console:
- **Authentication**: Quantidade de usuários anônimos ativos
- **Firestore → Usage**: Leituras/escritas no banco de dados
- **Firestore → Rules**: Violações de regras de segurança

## ✅ Checklist

- [ ] Autenticação anônima ativada no Firebase Console
- [ ] Regras do Firestore atualizadas
- [ ] Código commitado e pushed para GitHub
- [ ] Deploy feito na Vercel
- [ ] Testado em produção (sem erros de permissão)
- [ ] Console do navegador mostra autenticação bem-sucedida

## 🆘 Solução de Problemas

### Erro: "Missing or insufficient permissions"
- Verifique se a autenticação anônima está ativada
- Confirme se as regras foram publicadas
- Limpe o cache do navegador

### Erro: "Anonymous sign-in failed"
- Verifique a conexão com internet
- Confirme se o Firebase Auth está configurado corretamente
- Revise o `authDomain` no firebaseConfig

### Produtos não carregam
- Abra o console do navegador (F12)
- Verifique se há autenticação: procure por `[Firebase Auth]`
- Confira se as regras permitem leitura pública de produtos
