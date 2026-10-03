# StorySell

**StorySell** é um app para a Shopify App Store.

- O lojista escolhe **um vídeo para cada produto**.
- O vídeo aparece **na página daquele produto** na loja, por meio de um bloco que o lojista coloca
  pelo editor de temas.
- Um **dashboard** mostra, por produto e por período: visualizações, pessoas que assistiram, compras
  feitas por quem assistiu, taxa de conversão e valor vendido.

O plano completo, com todas as decisões e etapas, está em [`PLANO.md`](PLANO.md).

> **Situação atual:** base do projeto pronta (Etapa 0). O app ainda não tem funcionalidades de vídeo.

## Como rodar no seu computador

O passo a passo completo e detalhado vem na **Etapa 1** do plano, no arquivo `docs/COMO-TESTAR.md`.
Resumo para quem já tem tudo instalado:

1. Instale o [Node.js](https://nodejs.org/) (versão 22.12 ou mais nova), o
   [Git](https://git-scm.com/) e o [Shopify CLI](https://shopify.dev/docs/apps/tools/cli).
2. Baixe o projeto e instale as dependências:
   ```shell
   git clone <endereço do repositório>
   cd StorySell
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e preencha o `DATABASE_URL` com o endereço do banco
   PostgreSQL (Neon).
4. Rode o app:
   ```shell
   npm run dev
   ```
   Na primeira vez, o Shopify CLI pede login e pergunta se você quer criar um app novo.
   Responda **sim** e dê o nome **StorySell**.
5. Aperte **P** no terminal para abrir o app e instale-o na sua loja de desenvolvimento.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o app no seu computador, conectado à loja de desenvolvimento. |
| `npm run build` | Gera a versão de produção (serve para conferir se está tudo certo). |
| `npm run lint` | Procura erros comuns no código. |
| `npm run typecheck` | Confere os tipos do TypeScript. |
| `npm run deploy` | Publica a configuração e as extensões na Shopify. |

## Tecnologias

- [React Router](https://reactrouter.com/) com o pacote oficial
  [`@shopify/shopify-app-react-router`](https://shopify.dev/docs/api/shopify-app-react-router)
- [Polaris web components](https://shopify.dev/docs/api/app-home/using-polaris-components) e App Bridge
- [Prisma](https://www.prisma.io/) + PostgreSQL ([Neon](https://neon.tech/))
- API GraphQL Admin da Shopify, versão **2026-10**

## Origem do código

Este projeto parte do template oficial e gratuito da Shopify,
[`shopify-app-template-react-router`](https://github.com/Shopify/shopify-app-template-react-router),
distribuído sob a licença MIT (ver [`LICENSE.md`](LICENSE.md)).

**Mantenha este repositório privado.** O histórico do Git ainda contém código de terceiros de uso
restrito (ver `PLANO.md`, risco R17).
