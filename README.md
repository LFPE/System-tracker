# System Tracker
### Desenvolvido por: **Luiz Felipe** (Estudante de ADS)

O **System Tracker** e uma aplicacao para importacao, organizacao e analise de relatorios de **REAT** e **satisfacao**, centralizando acompanhamento operacional, indicadores e controle de usuarios em uma unica interface.

---

## Visao Geral

O projeto foi pensado para reduzir trabalho manual e padronizar o acompanhamento do time:

- importar registros operacionais de forma mais rapida
- organizar historico e filtros em uma interface unica
- acompanhar indicadores, ranking, graficos e satisfacao
- manter controle de acesso com autenticacao e perfis

---

## Stack Tecnologica

- **Backend**: [Hono](https://hono.dev/)
- **Frontend**: [Vite](https://vitejs.dev/) + Vanilla JS
- **Banco de Dados**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Infraestrutura**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## Arquitetura Atual

### Backend

O backend foi reorganizado para uma estrutura mais profissional em `backend/src`:

- `config`: configuracoes de ambiente, bindings e CORS
- `controllers`: entrada e saida HTTP
- `middlewares`: autenticacao, permissao e tratamento de erro
- `models`: tipos e contratos de dados
- `routes`: definicao das rotas da API
- `services`: regras de negocio e acesso ao banco
- `utils`: helpers de hash, sessao, resposta e apoio
- `validations`: validacao de entrada

### Frontend

O frontend agora usa `frontend/public` como fonte oficial dos arquivos estaticos:

- `assets/css`: tema visual, tokens e estilos globais
- `assets/js/core`: bootstrap e utilitarios globais
- `assets/js/shared`: funcoes reutilizaveis
- `pages`: modulos organizados por contexto da interface

---

## Estrutura de Pastas

```text
system-tracker/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── validations/
│       └── app.ts
├── frontend/
│   └── public/
│       ├── assets/
│       │   ├── css/
│       │   └── js/
│       ├── pages/
│       └── index.html
├── migrations/
├── dist/
├── package.json
└── vite.config.ts
```

### Observacao

O backend principal agora roda diretamente a partir de `backend/src/app.ts`, sem a camada antiga de compatibilidade na raiz.

---

## Principais Modulos da Interface

- **Dashboard**: visao geral dos indicadores e performance
- **Chamados / REATs**: importacao, historico e edicao de registros
- **Satisfacao**: importacao e acompanhamento mensal de avaliacoes
- **Relatorios**: exportacoes e backup
- **Usuarios**: controle de acesso ao sistema

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run deploy
```

### O que cada script faz

- `npm run dev`: sobe o ambiente de desenvolvimento
- `npm run build`: gera o build de producao
- `npm run preview`: executa o build localmente com Wrangler Pages
- `npm run deploy`: gera o build e publica

---

## Como Executar Localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Criar o banco local
npx wrangler d1 execute DB --local --file=./migrations/0001_initial.sql --persist-to=./meu_banco

# 3. Gerar os arquivos de build
npm run build

# 4. Iniciar a aplicacao local
npm run preview -- --persist-to=./meu_banco
```

Se preferir o ambiente de desenvolvimento do Vite:

```bash
npm run dev
```

---

## Estado Atual do Projeto

Nas ultimas refatoracoes, o projeto recebeu:

- reorganizacao estrutural do backend
- reorganizacao estrutural do frontend
- limpeza de arquivos duplicados e legados
- nova base visual mais corporativa e consistente
- separacao melhor entre estilos globais, scripts globais e paginas

---

## Proximos Passos Sugeridos

- continuar refinando o redesign das telas principais
- reduzir HTML gerado por string em partes mais densas da interface
- fortalecer seguranca de autenticacao e autorizacao
- adicionar testes e scripts de qualidade

