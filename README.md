# System Tracker

Sistema web para importar, organizar, acompanhar e analisar dados operacionais de REAT e satisfacao em uma unica interface.

## Visao Geral

O objetivo do projeto e reduzir trabalho manual, padronizar o acompanhamento da operacao e transformar dados operacionais em informacao util para tomada de decisao.

Hoje o sistema cobre quatro frentes principais:

- importacao e tratamento de REATs
- acompanhamento de satisfacao
- visualizacao de indicadores e rankings
- administracao de usuarios, acessos e backup

Na pratica, o Tracker atua como uma camada de organizacao entre a operacao diaria e a leitura gerencial dos dados.

## Problema que o sistema resolve

Antes de um fluxo como este, o processo normalmente fica espalhado entre copia e cola manual, planilhas, filtros repetitivos e consultas demoradas. Isso gera alguns gargalos comuns:

- retrabalho operacional para consolidar dados do dia
- risco de erro ao importar ou interpretar informacoes
- dificuldade para comparar desempenho ao longo do tempo
- pouca rastreabilidade de alteracoes e acessos
- dependencia de memoria ou de planilhas paralelas para acompanhar a operacao

O Tracker foi desenhado para centralizar esse fluxo em um unico ambiente e tornar o acompanhamento mais rapido, previsivel e replicavel.

## Principais Funcionalidades

### Operacao

- importar REATs a partir de texto colado do sistema
- revisar preview antes de salvar registros
- editar status e analise de registros salvos
- consultar historico com filtros por consultor, status, data e busca textual
- excluir um dia inteiro de registros quando necessario

### Satisfacao

- importar dados de satisfacao via TSV
- acompanhar resultados por mes
- visualizar distribuicao por consultor
- gerar leitura mensal e comparativos visuais

### Analise

- dashboard com KPIs principais
- estatisticas por consultor
- graficos de distribuicao e evolucao
- heatmap de horarios
- ranking da equipe

### Administracao

- login e sessao por cookie
- controle de acesso por perfil
- troca de senha do proprio usuario
- criacao e remocao de usuarios
- exportacao e importacao de backup do sistema

## Stack Tecnologica

### Backend: Hono

O backend usa **Hono** porque ele e leve, rapido e muito aderente ao modelo do Cloudflare Workers. Para este projeto, isso faz bastante sentido por alguns motivos:

- inicializacao rapida e baixa sobrecarga
- roteamento simples e organizado
- boa integracao com o ambiente edge da Cloudflare
- estrutura suficiente para uma API pequena e media sem carregar peso desnecessario

Hono atende bem o tipo de API deste sistema: autenticao, CRUD, importacao, agregacao e respostas JSON simples.

### Frontend: Vite + Vanilla JavaScript

O frontend usa **Vite** com **Vanilla JS** por escolha de simplicidade e velocidade de entrega.

**Por que Vite:**

- ambiente de desenvolvimento rapido
- build simples e moderno
- boa integracao com o fluxo atual do projeto
- ideal para uma aplicacao front-end sem camada complexa de framework

**Por que Vanilla JS:**

- menor custo de abstracao para um sistema orientado a telas e modulos diretos
- controle total do DOM sem depender de runtime adicional
- mais facil para evoluir incrementalmente em um projeto que nasceu de forma pratica
- reduz complexidade de bundle para um sistema administrativo

Para este caso, Vanilla JS funciona bem porque a interface e fortemente baseada em modulos de pagina, manipulacao de estado simples e chamadas diretas para API.

### Banco de Dados: Cloudflare D1

O banco usa **Cloudflare D1**, que entrega um SQLite gerenciado dentro do ecossistema Cloudflare.

Motivos da escolha:

- simplicidade operacional
- boa aderencia ao volume e perfil do projeto
- baixo custo de infraestrutura
- schema relacional suficiente para usuarios, reats e satisfacao
- facilidade para rodar localmente e publicar no mesmo stack da aplicacao

Como o sistema trabalha com entidades bem definidas e consultas relativamente diretas, D1 oferece um equilibrio muito bom entre simplicidade e capacidade.

### Infraestrutura e Deploy: Wrangler + Cloudflare Pages

A aplicacao usa **Wrangler** e **Cloudflare Pages** para build local, preview e deploy.

Essa stack foi escolhida porque:

- reduz complexidade de deploy
- aproxima ambiente local e ambiente publicado
- integra bem com Workers e D1
- facilita manter front-end e API no mesmo fluxo de publicacao

### Linguagem: TypeScript

O backend foi estruturado em **TypeScript** para dar mais seguranca nas regras de negocio e nos contratos da aplicacao.

Motivos principais:

- melhor previsibilidade em payloads, modelos e respostas
- ajuda a evitar regressao em refatoracoes
- deixa servicos, validacoes e controladores mais confiaveis
- melhora a manutencao conforme o sistema cresce

## Arquitetura do Projeto

```text
TRACKER/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- validations/
|   |   `-- app.ts
|-- frontend/
|   `-- public/
|       |-- assets/
|       |   |-- css/
|       |   `-- js/
|       |-- pages/
|       `-- index.html
|-- migrations/
|-- scripts/
|-- dist/
|-- meu_banco/
|-- package.json
|-- vite.config.ts
`-- wrangler.jsonc
```

## Como a arquitetura esta organizada

### backend/src/controllers

Camada HTTP. Recebe a requisicao, chama a validacao, delega para o service e devolve resposta.

### backend/src/services

Camada de regra de negocio e acesso a dados. Aqui fica a logica real de importacao, backup, autenticacao e persistencia.

### backend/src/validations

Centraliza validacao de entrada. Isso evita espalhar regra de payload em varios pontos e ajuda a proteger a API.

### backend/src/routes

Define as rotas publicas e protegidas, alem das regras de permissao.

### backend/src/middlewares

Responsavel por autenticao, autorizacao e tratamento transversal de requisicoes.

### frontend/public/pages

Cada pagina importante do sistema tem seu proprio modulo, o que ajuda a separar responsabilidade por contexto de tela.

### frontend/public/assets/js/core

Camada base do front-end: cliente de API, helpers de DOM e feedback visual.

### frontend/public/assets/js/shared

Utilitarios compartilhados entre modulos, como templates, download e normalizacao de consultores.

## Fluxo de Dados do Sistema

### Fluxo de REAT

1. O usuario cola o texto bruto do sistema.
2. O front faz o parse inicial e apresenta preview.
3. Ao salvar, a API valida os registros.
4. O backend substitui os dados daquele dia e persiste no D1.
5. O front recarrega indicadores, filtros e dashboards.

### Fluxo de Satisfacao

1. O usuario seleciona o mes de referencia.
2. Cola os dados TSV da pesquisa.
3. O front normaliza os registros e apresenta preview.
4. O backend valida o mes e os dados recebidos.
5. O banco substitui o conjunto daquele mes para evitar duplicidade.
6. O front atualiza as visoes analiticas.

### Fluxo de Backup

1. O admin exporta um snapshot completo do sistema.
2. O arquivo inclui REATs, satisfacao e usuarios.
3. Na importacao, o backend recompõe os dados por dominio.
4. O front recarrega a aplicacao para refletir o estado restaurado.

## Modulos da Interface

### Dashboard

Visao executiva com indicadores, metas, comparativos e destaques de desempenho.

### Importar REATs

Entrada operacional para consolidar dados do dia com preview antes da gravacao.

### Historico

Consulta detalhada dos registros ja importados, com busca e filtros.

### Estatisticas e Graficos

Camada de leitura gerencial para comparar volume, taxa de reversao e distribuicao de status.

### Heatmap

Ajuda a identificar horarios com maior concentracao de reversoes.

### Satisfacao

Modulo focado em leitura mensal de percepcao do cliente por consultor e por categoria.

### Ranking

Leitura comparativa da equipe em um formato simples de acompanhar.

### Usuarios

Area administrativa para controle de acesso ao sistema.

## Seguranca e Controle de Acesso

O sistema hoje trabalha com autenticacao baseada em sessao por cookie e perfis de usuario.

Alguns pontos importantes da implementacao atual:

- sessao com token validado no backend
- expiraracao da sessao por tempo
- sessao vinculada ao hash atual da senha
- troca de senha exigindo senha atual
- operacoes criticas restritas a administradores
- validacoes de payload mais estritas para importacao e atualizacao

Operacoes administrativas incluem:

- importar REAT
- editar REAT
- apagar dia de REAT
- salvar satisfacao
- exportar backup
- importar backup
- gerenciar usuarios

## Banco de Dados

A estrutura atual gira em torno de tres dominios principais:

- `users`: autenticacao e perfis
- `reats`: base operacional importada
- `satisfacao`: resultados da pesquisa de satisfacao

Essa modelagem foi suficiente porque o problema de negocio atual ainda e bem relacional, com entidades pequenas e consultas previsiveis.

## Scripts Disponiveis

```bash
npm install
npm run dev
npm run build
npm run db:local:setup
npm run local:start
npm run preview -- --persist-to=./meu_banco
npm run deploy
```

### O que cada script faz

- `npm run dev`: sobe o ambiente de desenvolvimento do front
- `npm run build`: gera o build da aplicacao e o bundle SSR do backend
- `npm run db:local:setup`: prepara o banco local D1
- `npm run local:start`: prepara banco, builda e sobe a aplicacao localmente
- `npm run preview`: executa o build em modo local via Wrangler Pages
- `npm run deploy`: gera o build e publica na Cloudflare

## Como Rodar Localmente

### Opcao rapida

```bash
npm install
npm run local:start
```

### Opcao passo a passo

```bash
npm install
npm run db:local:setup
npm run build
npm run preview -- --persist-to=./meu_banco
```

## Fluxo de Desenvolvimento Recomendado

1. subir banco local
2. rodar build
3. validar login, importacao, dashboards e backup
4. revisar alteracoes antes de publicar

## Estado Atual do Projeto

O projeto ja tem uma base funcional para uso administrativo interno e agora esta mais consistente em pontos criticos como:

- autenticacao e sessao
- controle administrativo de operacoes sensiveis
- importacao mensal de satisfacao sem duplicidade
- backup mais completo
- validacoes mais fortes no backend

## Limites e Proximos Passos Naturais

Mesmo com a base atual mais madura, ainda existem evolucoes importantes para fases seguintes:

- trilha de auditoria de alteracoes
- parametrizacao de consultores, metas e catalogos
- testes automatizados
- alertas administrativos e operacionais
- refinamento da gestao de usuarios
- possivel automacao de importacao no futuro

## Resumo da Escolha de Stack

Em poucas palavras, a stack foi escolhida pelo equilibrio entre simplicidade, performance e manutencao:

- **Hono** para uma API enxuta e aderente ao runtime da Cloudflare
- **Vite** para desenvolvimento rapido e build simples
- **Vanilla JS** para reduzir complexidade em uma interface administrativa modular
- **Cloudflare D1** para persistencia relacional leve e facil de operar
- **Wrangler + Cloudflare Pages** para deploy direto no ecossistema da aplicacao
- **TypeScript** para dar mais seguranca ao backend e ao crescimento do codigo

Essa combinacao faz sentido porque o Tracker nao precisa de uma arquitetura pesada para entregar valor. Ele precisa de rapidez para evoluir, baixo custo de manutencao e previsibilidade operacional.