# 📊 System Tracker — Automação de Workflow
### Desenvolvido por: **Luiz Felipe** (Estudante de ADS)

O **System Tracker** é uma solução inteligente desenvolvida para **automatizar a criação e gestão de relatórios de atividades (REATs)**. O projeto nasceu da necessidade de transformar processos manuais e repetitivos em um fluxo digital ágil, seguro e centralizado, otimizando o tempo de resposta e a precisão dos dados coletados.

---

## 🎯 O Objetivo do Projeto

A ideia central é simplificar rotinas profissionais através de:
* **Fim do Trabalho Manual**: Automação total na geração de relatórios de produtividade e satisfação.
* **Padronização**: Garantia de que todos os registros sigam os mesmos critérios técnicos de qualidade.
* **Inteligência de Dados**: Dashboard intuitivo para visualização imediata de indicadores e performance.

---

## 🛠️ Stack Tecnológica (Nível Profissional)

Utilizei tecnologias modernas de desenvolvimento em nuvem para garantir performance:

* **Backend**: [Hono](https://hono.dev/) — Framework de alta performance para Edge Computing.
* **Frontend**: [Vite](https://vitejs.dev/) + Vanilla JS — Interface leve e extremamente rápida.
* **Banco de Dados**: [Cloudflare D1](https://developers.cloudflare.com/d1/) — Banco de dados relacional SQL nativo na nuvem.
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/) — Segurança de tipos e código limpo.
* **Infraestrutura**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — Gerenciamento de deploys.
* **Integração**: API Convert Touch para monitoramento em tempo real.

---

## 📂 Estrutura e Organização

* **/src**: Lógica de rotas, autenticação e inteligência.
* **/public**: Interface visual, estilos e scripts.
* **/migrations**: Scripts SQL de estruturação do banco de dados.
* **/dist**: Pacote final otimizado para produção.

---

## 🚀 Como Iniciar o Sistema

Copie e execute os comandos abaixo em sequência no seu terminal:

```bash
# 1. Instalar as dependências
npm install

# 2. Configurar o banco de dados local (com persistência)
npx wrangler d1 execute DB --local --file=./migrations/0001_initial.sql --persist-to=./meu_banco

# 3. Executar o servidor de desenvolvimento
npx wrangler pages dev ./dist --local --d1 DB --persist-to=./meu_banco
