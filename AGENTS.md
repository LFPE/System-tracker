# AGENTS.md — Tracker

## 1) Contexto do projeto
Este repositório é o Tracker, um sistema de retenção em evolução com foco em uso real, qualidade técnica, segurança e crescimento gradual.

### Stack atual
- Backend: Hono
- Runtime/Deploy: Cloudflare Pages / Workers
- Banco: Cloudflare D1
- Frontend: modular, em evolução para estrutura mais profissional
- Objetivo atual: elevar o projeto para padrão mais robusto de engenharia

## 2) Objetivos de engenharia
Prioridades do projeto:
1. segurança
2. previsibilidade
3. testes
4. organização arquitetural
5. qualidade visual e UX
6. escalabilidade gradual

## 3) Regras gerais obrigatórias
1. Não faça mudanças fora do escopo pedido.
2. Prefira mudanças pequenas, seguras e graduais.
3. Não reescreva o projeto inteiro sem necessidade.
4. Preserve compatibilidade com o comportamento atual, salvo instrução explícita em contrário.
5. Sempre explique decisões relevantes.
6. Se houver risco de quebra, explicite esse risco.
7. Não misture refatoração estrutural, mudanças visuais e novas regras de negócio no mesmo PR, salvo pedido explícito.
8. Não altere secrets, tokens, variáveis sensíveis ou arquivos de ambiente reais.
9. Nunca introduza credenciais hardcoded.
10. Sempre priorize legibilidade e manutenção futura.

## 4) Regras de segurança
1. Nunca criar fallback inseguro para secrets.
2. Nunca hardcodar salts, tokens, chaves ou credenciais reais.
3. Preferir padrões de autenticação e sessão mais seguros.
4. Validar entradas no backend.
5. Tratar erros sem expor detalhes sensíveis.
6. Em mudanças de auth, manter compatibilidade gradual quando possível.
7. Em qualquer alteração sensível, listar riscos, impacto e plano de validação.

## 5) Arquitetura esperada

### Backend
- routes: definição de rotas
- controllers: recebem requests e retornam responses
- services: regras de negócio
- validations: validação de entrada
- middlewares: autenticação, logs, erro, etc.
- utils: helpers compartilhados
- models/types: contratos e tipos

### Regras de backend
1. Controllers devem ser leves.
2. Regras de negócio devem ficar em services.
3. Validação deve ocorrer antes da lógica principal.
4. Evitar duplicação.
5. Erros devem ser tratados de forma padronizada.

### Frontend
- pages: telas principais
- components: partes reutilizáveis
- services: comunicação com API
- utils/core: helpers compartilhados
- evitar concentrar lógica demais em um único arquivo
- reduzir uso de funções globais quando possível

### Regras de frontend
1. Não transformar tudo de uma vez.
2. Priorizar refatoração incremental.
3. Separar estrutura visual de lógica sempre que fizer sentido.
4. Preservar funcionalidade existente ao melhorar layout.

## 6) Regras de escopo
Ao receber uma tarefa:
1. Altere somente a área necessária.
2. Não “aproveite” para refatorar outras áreas sem necessidade.
3. Se encontrar problema fora do escopo, apenas sinalize.
4. Se a tarefa for grande, proponha divisão em etapas ou PRs menores.

## 7) Branches
Usar estes padrões:
- feat/nome-da-feature
- fix/nome-do-problema
- refactor/nome-da-area
- test/nome-da-area
- docs/nome-da-doc
- chore/nome-da-tarefa

## 8) Commits
Usar commits claros no formato:
- feat: ...
- fix: ...
- refactor: ...
- test: ...
- docs: ...
- chore: ...

Exemplos:
- feat: add dashboard KPI cards
- fix: handle expired session flow
- refactor: improve auth service structure
- test: add auth integration tests

## 9) Pull Requests
Todo PR deve ser focado em um assunto principal.

### Formato obrigatório do PR
## Objetivo
Explique por que este PR existe.

## O que foi feito
- item 1
- item 2
- item 3

## Impacto
- impacto técnico
- impacto funcional
- base para próximos passos

## Como validar
- passo 1
- passo 2
- passo 3

## Riscos
- risco 1
- risco 2

## Próximos passos
- próximo passo 1
- próximo passo 2

## 10) Qualidade e validação
Depois de qualquer mudança:
1. rodar instalação de dependências se necessário
2. rodar build
3. rodar lint, se existir
4. rodar testes, se existirem
5. conferir que a mudança não extrapolou o escopo
6. revisar arquivos alterados
7. informar claramente:
   - resumo do que mudou
   - arquivos modificados
   - riscos
   - checklist manual de teste

## 11) Regras para mudanças grandes
Se a tarefa envolver layout + arquitetura + novas funcionalidades:
1. sugerir divisão em múltiplos PRs
2. preservar funcionamento atual primeiro
3. fazer base estrutural antes de mudanças visuais extensas
4. separar:
   - segurança
   - testes
   - estrutura
   - layout
   - novas funcionalidades

## 12) Regra final
Trabalhar como engenheiro cuidadoso, não como agente que muda tudo de uma vez.
Priorizar segurança, clareza, escopo controlado e facilidade de revisão.