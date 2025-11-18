# TODO - Correção Completa do Projeto Joburguers

## ✅ Concluído
- [x] Análise completa do projeto e identificação de problemas
- [x] Criação do plano de correção
- [x] Corrigir storage.js - Normalizar tipos de IDs e garantir consistência

## 🔄 Em Andamento
- [x] Adicionar exports faltantes em storage.js (addPromotion, updatePromotion, deletePromotion)
- [x] Refatorar admin.js - Adicionar import renderPromocoes e corrigir event listeners
- [x] Corrigir cliente.js - Promises não aguardadas
- [x] Corrigir app.js - Chamadas assíncronas
- [x] Corrigir produto.js - Funções assíncronas
- [x] Mover promocoes.js para js/promocoes.js
- [ ] Testar todas as funcionalidades CRUD
- [ ] Adicionar validações e fallbacks

## 📋 Detalhes das Correções

### storage.js
- [x] Normalizar IDs para sempre serem strings
- [x] Garantir consistência entre Firebase e localStorage
- [x] Adicionar try/catch em todas as operações
- [x] Melhorar logs de erro com contexto
- [ ] Adicionar exports faltantes: addPromotion, updatePromotion, deletePromotion

### admin.js
- [x] Já usa await corretamente
- [ ] Adicionar import de renderPromocoes
- [ ] Corrigir event listeners para usar async/await

### cliente.js
- [x] Corrigir currentClient = getClientById() → await getClientById()
- [x] Corrigir loadResgates() → await loadResgates()
- [x] Corrigir getAllRedeems() → await getAllRedeems()

### app.js
- [x] Corrigir getAllProducts() → await getAllProducts()
- [x] Corrigir getActivePromotions() → await getActivePromotions()
- [x] Corrigir getSettings() → await getSettings()

### produto.js
- [x] Corrigir getProductById(parseInt(productId)) → await getProductById(String(productId))
- [x] Corrigir getAllProducts() → await getAllProducts()
- [x] Corrigir getSettings() → await getSettings()

### promocoes.js
- [ ] Mover arquivo da raiz para js/promocoes.js
- [ ] Atualizar imports

## 🧪 Testes Necessários
- [ ] CRUD de Produtos (criar, editar, excluir)
- [ ] CRUD de Clientes (criar, editar, excluir)
- [ ] Sistema de Promoções
- [ ] Sistema de Resgates
- [ ] Painel Admin funcionando
- [ ] Painel Cliente funcionando
- [ ] Sincronização Firebase/localStorage
