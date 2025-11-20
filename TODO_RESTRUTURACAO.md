# TODO: Reestruturação do Projeto para Firebase

## Passos para Reestruturação
- [ ] Revisar MAPA_PROJETO.md e atualizar arquitetura para Firebase
- [ ] Modificar storage.js para usar Firebase ao invés de localStorage
- [ ] Adaptar funções de CRUD para Firestore
- [ ] Manter compatibilidade com APIs existentes (admin.js, cliente.js, etc.)
- [ ] Atualizar initializeStorage para inicializar dados no Firebase
- [ ] Testar funcionalidades de login e CRUD após mudanças
- [ ] Verificar deploy no Vercel após mudanças
- [ ] Atualizar documentação (README.md, DOCUMENTACAO.md)

## Arquitetura Atual vs Nova
### Atual: localStorage
- Dados armazenados localmente no navegador
- Não sincroniza entre dispositivos
- Dados perdidos ao limpar cache

### Nova: Firebase Firestore
- Dados na nuvem
- Sincronização em tempo real
- Backup automático
- Acesso multi-dispositivo

## Riscos
- Projeto em produção no Vercel
- Possível perda de dados durante migração
- Compatibilidade com código existente

## Status
- Em andamento: Planejamento da reestruturação
