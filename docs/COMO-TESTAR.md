# Como testar o StorySell no seu computador

Este guia mostra, passo a passo, como rodar o StorySell no seu computador e abri-lo dentro da sua
loja de desenvolvimento da Shopify. Você faz a **parte 1** (instalação) **uma vez só**. Depois, a cada
etapa nova, basta seguir a parte **"Como receber as atualizações"**.

> **Dica:** os nomes de botões e menus dos sites (Shopify, Neon, GitHub) às vezes mudam um pouco.
> Se não encontrar um botão exatamente com o nome escrito aqui, procure algo parecido. Na dúvida,
> tire um print e mande na conversa com o Claude.

**Palavras que aparecem neste guia**

- **Terminal:** janela onde você digita comandos. No Windows chama-se **Prompt de Comando**; no Mac,
  **Terminal**. Para rodar um comando, digite (ou cole) e aperte **Enter**.
- **Repositório:** a pasta do projeto guardada no GitHub.
- **Loja de desenvolvimento:** loja de teste gratuita da Shopify. Ninguém compra de verdade nela.
- **Banco de dados:** onde o app guarda as informações dele (usaremos o Neon, gratuito).

---

## Sumário

1. [Instalar os programas](#1-instalar-os-programas)
2. [Criar a loja de desenvolvimento](#2-criar-a-loja-de-desenvolvimento)
3. [Criar o banco de dados no Neon](#3-criar-o-banco-de-dados-no-neon)
4. [Baixar o projeto](#4-baixar-o-projeto)
5. [Criar o arquivo `.env`](#5-criar-o-arquivo-env)
6. [Rodar o app pela primeira vez](#6-rodar-o-app-pela-primeira-vez)
7. [Instalar o app na loja e ver funcionando](#7-instalar-o-app-na-loja-e-ver-funcionando)
8. [Enviar o `shopify.app.toml` atualizado](#8-enviar-o-shopifyapptoml-atualizado)
9. [Como receber as atualizações das próximas etapas](#9-como-receber-as-atualizações-das-próximas-etapas)
10. [Deu erro, e agora?](#10-deu-erro-e-agora)
11. [O que testar em cada etapa](#11-o-que-testar-em-cada-etapa)

---

## 1. Instalar os programas

Você vai instalar 4 programas: **Node.js**, **Git**, **GitHub Desktop** e **Shopify CLI**.

### 1.1 Node.js (o "motor" que roda o app)

1. Acesse <https://nodejs.org/>.
2. Baixe a versão marcada como **LTS** (é a mais estável). Ela precisa ser **22.12 ou mais nova**.
3. Abra o arquivo baixado e clique em **Next/Continuar** até o fim, sem mudar nada.
   - No Windows, se aparecer a opção *"Automatically install the necessary tools"*, deixe
     **desmarcada**.
4. Confira: abra o terminal e digite:
   ```shell
   node -v
   ```
   Deve aparecer algo como `v22.20.0` ou `v24.x.x`. Se aparecer um número menor que 22.12, instale de
   novo a versão LTS.

> **Como abrir o terminal**
> - **Windows:** aperte a tecla **Windows**, digite `cmd` e abra **Prompt de Comando**.
> - **Mac:** aperte **Cmd + Espaço**, digite `Terminal` e aperte **Enter**.
>
> Depois de instalar um programa, **feche e abra o terminal de novo** para ele "enxergar" o programa novo.

### 1.2 Git (ferramenta de versões que o Shopify CLI usa)

- **Windows:** baixe em <https://git-scm.com/download/win> e instale clicando em **Next** até o fim,
  sem mudar nada.
- **Mac:** no terminal, digite `git --version`. Se o Mac oferecer instalar as "ferramentas de linha de
  comando" (*command line developer tools*), clique em **Instalar** e espere terminar.

Confira com `git --version`. Deve aparecer `git version 2.xx`.

### 1.3 GitHub Desktop (para baixar e atualizar o projeto com botões)

1. Baixe em <https://desktop.github.com/> e instale.
2. Abra o programa e clique em **Sign in to GitHub.com**. Entre com a **mesma conta do GitHub** onde
   está o repositório StorySell.

### 1.4 Shopify CLI (ferramenta da Shopify que liga o app à sua loja)

No terminal, digite:

```shell
npm install -g @shopify/cli@latest
```

- **Mac:** se aparecer um erro com a palavra `EACCES` (permissão), use:
  ```shell
  sudo npm install -g @shopify/cli@latest
  ```
  O Mac vai pedir a **senha do computador**. Ao digitar, nada aparece na tela; isso é normal.
  Digite e aperte **Enter**.

Confira, **fechando e abrindo o terminal antes**:

```shell
shopify version
```

Deve aparecer um número de versão (ex.: `4.8.4`).

---

## 2. Criar a loja de desenvolvimento

1. Acesse o **Dev Dashboard** da Shopify: <https://dev.shopify.com/> e entre com a sua conta de parceiro.
2. No menu da esquerda, clique em **Stores** (Lojas).
3. Clique em **Create store** (Criar loja) e escolha o tipo **Dev**.
4. Dê um nome, por exemplo `storysell-teste`. Se pedir um plano, escolha qualquer um (para loja de
   desenvolvimento é gratuito). Se oferecer **dados de exemplo** (*demo data*), aceite.
5. Espere a loja ser criada e abra o admin dela.

> Se a sua conta ainda mostrar o painel antigo de parceiro (<https://partners.shopify.com/>), o caminho
> é: **Stores** → **Add store** → **Create development store**.

### 2.1 Preparar a loja para os testes

1. **Produtos:** no admin da loja, vá em **Produtos**. Garanta que existem **3 a 5 produtos** (se a
   loja veio com dados de exemplo, já existem). Para criar: **Adicionar produto**, preencha título e
   preço e clique em **Salvar**.
2. **Vídeos:** em **1 ou 2 produtos**, abra o produto, vá na área **Mídia**, clique em **Adicionar** e
   envie um **vídeo curto** (5 a 20 segundos, gravado no celular serve). Use um vídeo em pé (vertical)
   e outro deitado (horizontal), se puder. A Shopify leva alguns minutos para processar o vídeo.
3. **Tema:** vá em **Loja virtual** → **Temas**. O tema atual deve ser um tema moderno da Shopify
   (ex.: **Horizon** ou **Dawn**). Lojas novas já vêm com um assim; não precisa mudar nada.

---

## 3. Criar o banco de dados no Neon

1. Acesse <https://neon.tech/> e clique em **Sign up**. O jeito mais fácil é entrar com a conta do
   **GitHub**.
2. Crie um projeto (**New project** / **Create project**):
   - **Nome do projeto:** `storysell`
   - **Região:** a mais próxima de você (ex.: **AWS São Paulo**, se aparecer; senão, **US East**).
   - Deixe o resto como está e confirme.
3. Na tela do projeto, clique em **Connect** (Conectar).
4. Na janela que abrir:
   - **Desligue** a opção **Connection pooling** (o endereço **não** pode ter a palavra `-pooler`).
   - Se houver a opção de mostrar a senha (**Show password**), ative.
   - Copie o endereço que começa com `postgresql://`. Ele é parecido com:
     ```
     postgresql://neondb_owner:SENHA@ep-xxxx-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
     ```
5. Guarde esse endereço: você vai colá-lo no passo 5. **Ele é secreto**, porque contém a senha do
   banco. Não mande em lugar público. Na conversa com o Claude não é preciso mandá-lo.

Este será o banco de **desenvolvimento** (testes). O banco de **produção** será criado separado, na
Etapa 12.

---

## 4. Baixar o projeto

1. Abra o **GitHub Desktop**.
2. Menu **File** → **Clone repository**.
3. Na aba **GitHub.com**, escolha **StorySell** na lista.
4. Em **Local path**, veja onde ele vai salvar (normalmente `Documentos\GitHub\StorySell`). Clique em
   **Clone**.
5. Abra o terminal **já dentro da pasta do projeto**: no GitHub Desktop, menu **Repository** →
   **Open in Command Prompt** (Windows) ou **Open in Terminal** (Mac).
6. No terminal, instale as dependências do projeto (pode levar alguns minutos):
   ```shell
   npm install
   ```
   Avisos amarelos (`warn`) ou mensagens sobre *vulnerabilities* são normais. Só é problema se
   terminar com `ERR!` em vermelho.

> **Importante:** confira no GitHub Desktop que a branch atual (**Current branch**, no topo) é a
> **main**. As mudanças de cada etapa só chegam à `main` depois que você aprova o *pull request*
> (ver [parte 9](#9-como-receber-as-atualizações-das-próximas-etapas)).

---

## 5. Criar o arquivo `.env`

O arquivo `.env` guarda o endereço do banco de dados. Ele fica **só no seu computador**; o projeto já
está configurado para nunca enviá-lo ao GitHub.

1. No terminal (ainda na pasta do projeto), crie o arquivo a partir do modelo:
   - **Windows:**
     ```shell
     copy .env.example .env
     ```
   - **Mac:**
     ```shell
     cp .env.example .env
     ```
2. Abra o arquivo para editar:
   - **Windows:** `notepad .env`
   - **Mac:** `open -e .env`
3. Encontre a linha que começa com `DATABASE_URL=` e troque o endereço de exemplo pelo endereço do
   Neon (passo 3), **mantendo as aspas**:
   ```
   DATABASE_URL="postgresql://neondb_owner:SENHA@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   ```
4. Salve e feche. **Não mexa nas outras linhas**: o Shopify CLI cuida delas no seu computador.

> **Atenção (Windows):** o arquivo precisa se chamar exatamente `.env`, e **não** `.env.txt`. Usando
> o comando `copy` acima, o nome fica certo.

---

## 6. Rodar o app pela primeira vez

No terminal, dentro da pasta do projeto:

```shell
npm run dev
```

Na **primeira vez**, o Shopify CLI faz algumas perguntas. Use as setas do teclado para escolher e
**Enter** para confirmar:

| O CLI pergunta | Responda |
|---|---|
| Pede para fazer **login** (abre o navegador) | Entre com a sua conta da Shopify (a mesma do Dev Dashboard / parceiro). Depois volte ao terminal. |
| Pergunta qual **organização** usar (se você tiver mais de uma) | Escolha a sua organização de parceiro. |
| **Create this project as a new app on Shopify?** | **Yes, create it as a new app** |
| **App name** | `StorySell` |
| **Configuration file name:** (pode não aparecer) | **Apague o texto** e deixe vazio. A linha de baixo deve dizer `shopify.app.toml will be generated`. Aperte **Enter**. |
| Pergunta se quer **escolher outro nome** para o arquivo de configuração (pode não aparecer) | **No, overwrite my existing configuration file** |
| **Which store would you like to use to view your project?** | Escolha a loja criada no passo 2. |
| **Have Shopify override your app URLs when running `app dev`…?** | **Yes** |

Depois disso, o CLI prepara tudo: cria as tabelas no banco, abre um "túnel" (um endereço público
temporário para a Shopify falar com o seu computador) e mostra no fim algo como
`Ready, watching for changes in your app`.

**Deixe esse terminal aberto** enquanto estiver testando. Se fechar, o app para de funcionar.

---

## 7. Instalar o app na loja e ver funcionando

1. Com o `npm run dev` rodando, aperte a tecla **P** no terminal. O navegador abre o admin da sua loja.
2. Aparece a tela de instalação do app. Clique em **Instalar** (*Install*).
3. O app abre dentro do admin da Shopify, com o título **StorySell** e o texto
   **"Welcome to StorySell"**.

✅ **Se você viu essa tela, a Etapa 1 está concluída!** Avise o Claude.

Nas próximas vezes, o app já vai estar instalado. Basta rodar `npm run dev` e apertar **P** (ou abrir
o app pelo menu **Apps** do admin da loja, **com o `npm run dev` rodando**).

**Para parar o app:** no terminal, aperte **Ctrl + C**.

---

## 8. Enviar o `shopify.app.toml` atualizado

Na primeira vez, o Shopify CLI grava no arquivo `shopify.app.toml` o **`client_id`**, o "número de
identidade" do seu app. Ele **não é segredo** e precisa ir para o GitHub, para que as próximas etapas
usem o app certo.

**Jeito mais fácil (GitHub Desktop):**

1. Abra o GitHub Desktop. À esquerda, deve aparecer o arquivo `shopify.app.toml` como alterado.
   - Se aparecer o arquivo `.env` na lista, **pare** e avise o Claude. Ele nunca deve ser enviado.
2. Embaixo, à esquerda, em **Summary**, escreva: `Add StorySell client_id`.
3. Clique em **Commit to main**.
4. Clique em **Push origin** (no topo).

**Outro jeito:** abra o arquivo `shopify.app.toml` (no terminal: `notepad shopify.app.toml` no
Windows ou `open -e shopify.app.toml` no Mac), copie **todo o conteúdo** e cole na conversa com o
Claude. Depois, antes da próxima atualização, desfaça a mudança local no GitHub Desktop: clique com o
botão direito no arquivo → **Discard changes**.

---

## 9. Como receber as atualizações das próximas etapas

A cada etapa, o Claude envia as mudanças para o GitHub numa **branch** separada (uma "cópia de
trabalho" do projeto) e pode abrir um **pull request** (um pedido para juntar as mudanças à `main`).

**1. Aprovar as mudanças (no site do GitHub):**

1. Abra o repositório StorySell no GitHub e clique na aba **Pull requests**.
2. Abra o pull request da etapa e clique em **Merge pull request** → **Confirm merge**.

**2. Baixar para o seu computador:**

1. Se o `npm run dev` estiver rodando, pare com **Ctrl + C**.
2. No **GitHub Desktop**, com a branch **main** selecionada, clique em **Fetch origin** e depois em
   **Pull origin**.
3. No terminal, na pasta do projeto:
   ```shell
   npm install
   npm run dev
   ```
4. Aperte **P** para abrir o app.

> **Alternativa pelo terminal** (no lugar do GitHub Desktop): `git pull`, depois `npm install` e
> `npm run dev`.

> **Se o app pedir permissões novas:** algumas etapas acrescentam permissões (ex.: ler produtos).
> Quando você abrir o app, a Shopify pode mostrar uma tela pedindo para **aceitar/atualizar** o app.
> Aceite.

---

## 10. Deu erro, e agora?

Primeiro, tente o básico: **pare o app (Ctrl + C), feche o terminal, abra de novo** na pasta do
projeto e rode `npm run dev`. Muitos erros somem assim. Se continuar, procure a mensagem abaixo.
Se não encontrar, **copie a mensagem de erro inteira** (ou tire um print) e mande ao Claude.

| Mensagem (ou parte dela) | O que significa | O que fazer |
|---|---|---|
| `'node' não é reconhecido` / `command not found: node` | O Node.js não está instalado, ou o terminal foi aberto antes de instalar | Feche e abra o terminal. Se continuar, reinstale o Node.js (passo 1.1). |
| `'shopify' não é reconhecido` / `command not found: shopify` | O Shopify CLI não está instalado, ou o terminal precisa ser reaberto | Feche e abra o terminal. Se continuar, repita o passo 1.4. |
| `EBADENGINE` / `Unsupported engine` / `requires node >=22.12` | Versão do Node.js antiga | Instale a versão **LTS** mais nova do Node.js (passo 1.1). |
| `EACCES: permission denied` (Mac, ao instalar o CLI) | Falta de permissão | Use `sudo npm install -g @shopify/cli@latest` (passo 1.4). |
| `a execução de scripts foi desabilitada neste sistema` (Windows) | Você está no **PowerShell**, que bloqueia scripts | Use o **Prompt de Comando** (`cmd`). Ou, no PowerShell, rode uma vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e responda **S**. |
| `Environment variable not found: DATABASE_URL` | O arquivo `.env` não existe, está com nome errado ou fora da pasta do projeto | Refaça o passo 5. Confira que o nome é `.env` (e não `.env.txt`) e que está na pasta principal do projeto. |
| `P1001: Can't reach database server` | O app não conseguiu falar com o banco | Confira a internet. O Neon "adormece" quando fica parado: espere 10 segundos e tente de novo. Confira se o `DATABASE_URL` foi colado inteiro, entre aspas. |
| `P1000: Authentication failed` | Senha do banco errada no `.env` | Copie de novo o endereço no Neon (passo 3, com a senha visível) e cole no `.env`. |
| `ENOENT` ou `Could not read package.json` | O terminal não está na pasta do projeto | Abra o terminal pelo GitHub Desktop (**Repository** → **Open in…**), como no passo 4. |
| `Could not find any shopify.app.toml file` | Mesmo caso acima: terminal fora da pasta do projeto | Idem. |
| `Port 3000 is in use` / `EADDRINUSE` | Já tem outro `npm run dev` rodando | Feche os outros terminais (ou aperte **Ctrl + C** neles) e rode de novo. |
| O app abre com **tela em branco** ou "**this page isn't working**" | O `npm run dev` não está rodando, ou o túnel caiu | Confira se o terminal ainda está rodando. Pare (**Ctrl + C**), rode `npm run dev` e aperte **P** de novo. |
| Login pede uma conta/organização errada | Você entrou com outra conta Shopify | Rode `shopify auth logout` e depois `npm run dev` de novo. |
| GitHub Desktop: **"Your local changes would be overwritten"** ao fazer **Pull** | Você tem mudanças locais num arquivo que a atualização também mudou | Se o arquivo for o `shopify.app.toml` e você já fez o passo 8: clique com o botão direito nele → **Discard changes** e faça **Pull** de novo. Se for outro arquivo, avise o Claude. |
| Quer recomeçar a ligação com a Shopify do zero | — | Rode `npm run dev -- --reset`. O CLI faz as perguntas do passo 6 de novo. |

---

## 11. O que testar em cada etapa

Cada etapa acrescenta aqui o que você deve testar.

### Etapa 0 — Base do projeto

Nada visível. Foi só a troca do código antigo pelo template oficial da Shopify.

### Etapa 1 — Ambiente de teste

Siga as partes 1 a 8 deste guia. **Deu certo se:** o app abre dentro do admin da sua loja de
desenvolvimento mostrando **"Welcome to StorySell"**.
