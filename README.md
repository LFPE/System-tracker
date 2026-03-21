# 📊 Tracker Coobrastur - Automação de REATs
### Desenvolvido por: **Luiz Felipe** (Estudante de ADS)

O **Tracker Coobrastur** é uma solução inteligente desenvolvida para **automatizar a criação e elaboração de relatórios (REATs)**. O projeto nasceu da necessidade de transformar processos manuais e repetitivos em um fluxo digital ágil, seguro e centralizado, otimizando o tempo de resposta e a precisão dos dados coletados.

---

## 🎯 O Objetivo do Projeto

A ideia central é simplificar a rotina de trabalho na Coobrastur:
* **Fim do Trabalho Manual**: Automação total na geração de relatórios de atividades e satisfação.
* **Padronização**: Garantia de que todos os REATs sigam o mesmo critério técnico.
* **Acesso Rápido**: Dashboard intuitivo para visualização imediata dos indicadores.

---

## 🛠️ Stack Tecnológica (Nível Profissional)

Para garantir que o sistema suporte o volume de dados da Coobrastur, utilizei as tecnologias mais modernas do mercado:

* **Back-end**: [Hono](https://hono.dev/) - Framework de alta performance para Edge Computing.
* **Front-end**: [Vite](https://vitejs.dev/) + Vanilla JS - Interface leve e extremamente rápida.
* **Banco de Dados**: [Cloudflare D1](https://developers.cloudflare.com/d1/) - Banco de dados relacional SQL nativo na nuvem.
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/) - Garantia de código limpo e livre de erros de tipagem.
* **Infraestrutura**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Gerenciamento de deploys e ambiente local.

---

## 📂 Estrutura e Organização

O projeto segue uma arquitetura separada para facilitar a manutenção:

* **/src**: Lógica de rotas, autenticação e inteligência do sistema.
* **/public**: Interface visual, incluindo os arquivos `style.css` e `app.js`.
* **/migrations**: Scripts SQL de estruturação do banco de dados (Tabelas `users` e `satisfacao`).
* **/dist**: Pacote final otimizado e pronto para produção no servidor Cloudflare.

---

## 🚀 Como Iniciar o Sistema

Siga estes passos para rodar o ambiente de automação no seu computador:

### 1. Instalar as Dependências
```bash
npm install