# System Tracker
### Desenvolvido por: **Luiz Felipe** (Estudante de ADS)

O **System Tracker** e uma aplicacao para automatizar a importacao, organizacao e analise de relatorios de REAT e satisfacao em um fluxo centralizado.

---

## Objetivo do Projeto

O sistema foi pensado para reduzir trabalho manual e padronizar o acompanhamento operacional:

- Automatizar a geracao e o tratamento de registros de atividade e satisfacao.
- Padronizar criterios de acompanhamento e consulta.
- Facilitar a visualizacao de indicadores em uma interface unica.

---

## Stack Tecnologica

- **Backend**: [Hono](https://hono.dev/)
- **Frontend**: [Vite](https://vitejs.dev/) + Vanilla JS
- **Banco de Dados**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Infraestrutura**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## Estrutura

- **/backend/src**: aplicacao da API organizada em config, controllers, middlewares, models, routes, services, utils e validations.
- **/frontend/public**: interface do sistema com assets globais e paginas organizadas por contexto.
- **/frontend/public/assets/css**: camadas de estilo globais e tema visual.
- **/frontend/public/assets/js**: bootstrap, utilitarios compartilhados e scripts globais.
- **/frontend/public/pages**: modulos das telas principais do sistema.
- **/migrations**: estrutura SQL do banco local/remoto.
- **/dist**: arquivos gerados para execucao e deploy.

---

## Como executar

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
