# PLANO.md — StorySell

> **Para quem for executar este plano (outra sessão do Claude ou outro desenvolvedor):**
> Este arquivo contém tudo o que foi decidido. Não é preciso ter lido a conversa que o gerou.
> O responsável pelo projeto **não é programador**: explique cada passo em linguagem simples, em português,
> e diga sempre como ele pode testar o resultado.
> Execute **uma etapa por vez**, na ordem. Ao terminar uma etapa, marque-a como concluída na
> [Lista de progresso](#9-lista-de-progresso) e faça commit.

Data do plano: 03/10/2026.

---

## Sumário

1. [O que é o app](#1-o-que-é-o-app)
2. [Ponto de partida (o que existe hoje no repositório)](#2-ponto-de-partida)
3. [Decisões já tomadas pelo responsável](#3-decisões-já-tomadas-pelo-responsável)
4. [Decisões técnicas (opções, prós e contras, recomendação)](#4-decisões-técnicas)
5. [Arquitetura final (visão geral)](#5-arquitetura-final)
6. [Etapas de execução](#6-etapas-de-execução)
7. [O que o responsável precisa providenciar](#7-o-que-o-responsável-precisa-providenciar)
8. [Exigências para aprovação na Shopify App Store](#8-exigências-para-aprovação-na-shopify-app-store)
9. [Lista de progresso](#9-lista-de-progresso)
10. [Riscos e pontos em aberto](#10-riscos-e-pontos-em-aberto)
11. [Regras para as sessões que executarem este plano](#11-regras-para-as-sessões-que-executarem-este-plano)
12. [Glossário](#12-glossário)

---

## 1. O que é o app

**StorySell** é um app público para a Shopify App Store.

- O lojista escolhe **um vídeo para cada produto** (ex.: um vídeo para a camisa, outro para a bermuda).
- O vídeo aparece **na página daquele produto** na loja, por meio de um **bloco** que o lojista coloca
  pelo editor de temas.
- Um **dashboard** no painel do app mostra, por produto e por período: visualizações, pessoas que
  assistiram, compras feitas por quem assistiu, taxa de conversão e valor vendido.
- Usa apenas dados da própria loja. Sem integrações externas.

---

## 2. Ponto de partida

Situação do repositório em 03/10/2026 (commit `9045be8 initial launch`):

- O código é o **LaunchQuik**, um kit inicial **pago e de terceiros**, feito para outro tipo de app
  (ofertas no checkout, pós-compra, pesquisa NPS, estrelas de avaliação). **Não há nada de vídeo.**
- O arquivo `LICENSE.txt` diz que esse código é proprietário e proíbe modificação e distribuição sem
  autorização escrita.
- Tecnologias: Remix (substituído pela Shopify por React Router), Polaris React (descontinuado),
  Prisma + PostgreSQL, Redis/BullMQ, Brevo/Mailgun/Resend, chat Crisp.
- Versões da API misturadas (2024-04, 2024-07, 2024-10, 2025-04, 2025-07), quase todas fora do suporte.
- O projeto instala e compila (`npm run build` funciona), mas tem falhas graves:
  - Os webhooks obrigatórios de privacidade respondem "404" (reprovaria na revisão da App Store).
  - A desinstalação não limpa dados: sai antes da limpeza, usa comando MySQL num banco PostgreSQL e chama uma função inexistente.
  - A página `/app/admin` permite a **qualquer lojista** enviar e-mail para **todas** as lojas.
  - Ela pede permissões (escopos) demais: clientes, pedidos, descontos etc.
  - O nome "LaunchQuik", o texto "GR: Delivery date + Pickup" e um `client_id` de outro app aparecem no código.
  - Há arquivos que não deveriam estar versionados: `dump.rdb` e vários `.DS_Store`.

**Decisão:** substituir tudo pelo **template oficial da Shopify** (Etapa 0). Nada do LaunchQuik será
reaproveitado em código.

---

## 3. Decisões já tomadas pelo responsável

| # | Assunto | Decisão |
|---|---------|---------|
| 1 | Base do código | Começar do **template oficial da Shopify (React Router)**. Remover o LaunchQuik. |
| 2 | Quais produtos | Vídeo **só nos produtos escolhidos**. Produto sem vídeo: o bloco **não aparece** (nem deixa espaço vazio). |
| 3 | Hospedagem do vídeo | **Na própria Shopify** (arquivos da loja). O lojista pode **escolher um vídeo que já está no produto** ou **enviar um novo**. |
| 4 | Quantidade | **Um vídeo por produto** nesta versão. Vários vídeos (carrossel tipo "stories") fica para o futuro. |
| 5 | Aparência | Toca **sozinho, sem som, em loop**, com **botão de som**. Formato vertical/horizontal **segue o próprio vídeo**. Posição: onde o lojista colocar o bloco. |
| 6 | O que é "assistiu" | O vídeo ficou **visível na tela e tocando por pelo menos 3 segundos** (somados). Metade/fim do vídeo: futuro. |
| 7 | Métricas do dashboard | Por produto e por período: **visualizações**, **pessoas diferentes que assistiram**, **compras por quem assistiu**, **taxa de conversão**, **valor vendido**. |
| 8 | Regra de atribuição | Conta como "comprou depois de assistir": **qualquer compra em até 7 dias, no mesmo navegador**, depois de assistir. Mostrar separado **quantos desses pedidos incluíram o próprio produto do vídeo**. |
| 9 | Privacidade | **Respeitar o consentimento de cookies** do visitante automaticamente. Guardar **só dados anônimos** (sem nome, e-mail ou telefone). Aceita-se que os números fiquem um pouco abaixo da realidade. |
| 10 | Cobrança | **Managed Pricing** (a Shopify cuida da tela de planos e da cobrança). **Plano grátis** com até **3 produtos com vídeo** + **plano pago** mensal com **teste grátis de 7 dias**. Preço do plano pago: **a definir pelo responsável**. A versão mínima (MVP) fica **sem cobrança**. |
| 11 | Idiomas | **Inglês e português** no painel e no bloco da loja. |
| 12 | Orçamento de servidor | Começar com opções gratuitas ou de até **~US$ 20/mês**. |
| 13 | Retenção de dados | Guardar eventos por **13 meses**. Depois disso, **apagar automaticamente**. |
| 14 | Conta Shopify | O responsável **já tem conta de Parceiro Shopify**. Ainda é preciso criar a loja de desenvolvimento (ver seção 7). |
| 15 | Nome e qualidade | Nome final **StorySell**. Projetar pensando no selo **"Built for Shopify"**, mas pedir o selo só depois do lançamento. |

---

## 4. Decisões técnicas

Cada decisão traz as opções, os prós e contras e a recomendação. A recomendação é a **decisão
adotada**, salvo se o responsável mudar de ideia.

### D1. Base do código

| Opção | Prós | Contras |
|---|---|---|
| **Template oficial React Router** (`Shopify/shopify-app-template-react-router`) | Gratuito; mantido pela Shopify; já vem com login, sessão, webhooks e Polaris web components | Começa "vazio" |
| Template oficial Remix | Parecido com o atual | A Shopify só dá correções de segurança; caminho de saída |
| Manter LaunchQuik | Já tem telas de planos | Licença restritiva, falhas graves, ferramentas descontinuadas, muito código inútil |

**Recomendação adotada:** template oficial React Router.

### D2. Interface do painel (admin)

| Opção | Prós | Contras |
|---|---|---|
| **Polaris web components** (`<s-page>`, `<s-button>` …) | Padrão atual da Shopify; visual sempre igual ao admin; exigido na prática para "Built for Shopify" | Mais novo, menos exemplos na internet |
| Polaris React | Muitos exemplos antigos | **Descontinuado** pela Shopify |

**Recomendação adotada:** Polaris web components + App Bridge. O App Bridge é a ponte com o admin, e
o seletor de produtos dele é o `shopify.resourcePicker`.

### D3. Onde o vídeo fica hospedado

| Opção | Prós | Contras |
|---|---|---|
| **Arquivos da Shopify** (vídeos do produto ou aba "Arquivos" da loja) | Sem custo para nós; entrega rápida (CDN da Shopify); o lojista já conhece; aparece no Liquid com `video_tag` | Limites de tamanho/duração da Shopify; processamento leva alguns minutos |
| YouTube/Vimeo (link) | Fácil para o lojista | Marca e anúncios de terceiros; medir é difícil; pior desempenho |
| Serviço pago (Mux, Cloudflare Stream, Bunny) | Controle total e estatísticas próprias | Custo mensal por uso; integração externa (contra a decisão de "sem integrações") |

**Recomendação adotada:** arquivos da Shopify.

### D4. Onde guardar o vínculo produto → vídeo

| Opção | Prós | Contras |
|---|---|---|
| **Metafield do produto, "de propriedade do app"** (namespace reservado `$app:storysell`, chave `video`, tipo `file_reference` só para vídeo, leitura pública na vitrine) | O tema lê direto no Liquid, sem chamar nosso servidor (rápido e funciona mesmo se o servidor cair); outros apps não alteram | Sintaxe de leitura no Liquid precisa ser confirmada (ver Risco R4) |
| Metafield comum (namespace `storysell`) | Leitura simples no Liquid | Lojista e outros apps podem alterar sem querer |
| Só no banco do app (tema busca via "app proxy") | Controle total | Mais lento; se o servidor cair, o vídeo some da loja |

**Recomendação adotada:** metafield de propriedade do app **+ uma cópia no banco do app** (tabela
`ProductVideo`). A cópia serve para listar rápido, contar o limite do plano grátis e montar o dashboard.
O metafield é a "fonte da verdade" para a vitrine.

### D5. Como medir as visualizações

| Opção | Prós | Contras |
|---|---|---|
| **Bloco publica evento → web pixel do app recebe → envia ao nosso servidor** (`Shopify.analytics.publish("storysell:video_viewed", …)`) | Respeita o consentimento automaticamente; um único canal para views e compras; o pixel conhece o mesmo `clientId` (identificador anônimo do navegador) no checkout | Depende de o pixel estar ativado; bloqueadores de anúncio podem cortar |
| Bloco envia direto ao servidor (via app proxy) | Independe do pixel | Teríamos de tratar consentimento manualmente; não liga ao checkout sozinho |

**Recomendação adotada:** bloco → `Shopify.analytics.publish` → web pixel → servidor do app.

### D6. Como saber que houve compra

| Opção | Prós | Contras |
|---|---|---|
| **Evento `checkout_completed` no web pixel** | Mesmo `clientId` da visualização; não precisa de permissão de ler pedidos | Sujeito a consentimento e bloqueadores; o valor pode estar na moeda do comprador |
| Webhook `orders/create` + atributo no carrinho gravado pelo bloco | Funciona no servidor e é mais "garantido" | Exige permissão de pedidos (dados protegidos de clientes), mexe no carrinho (pode conflitar com temas) |

**Recomendação adotada:** `checkout_completed` no web pixel. A segunda opção fica como **plano B**
caso o teste da Etapa 8 mostre que o `clientId` não bate (Risco R1).

### D7. Banco de dados (desenvolvimento e produção)

| Opção | Prós | Contras |
|---|---|---|
| **PostgreSQL no Neon** (um banco para desenvolvimento e outro para produção) | Plano gratuito; nada para instalar no computador; desenvolvimento igual à produção | Precisa de internet; o plano grátis tem limite de espaço (~0,5 GB) e "adormece" quando ocioso |
| SQLite no desenvolvimento + PostgreSQL na produção | Zero configuração no início | Diferenças entre os dois causam erros que só aparecem na produção |
| Supabase / Render Postgres | Bons também | Render Postgres grátis expira; Supabase traz muita coisa que não usaremos |

**Recomendação adotada:** Neon PostgreSQL nos dois ambientes, em bancos separados. Ferramenta de
acesso: Prisma, que já vem no template.

### D8. Servidor do app (produção)

| Opção | Custo aproximado | Prós | Contras |
|---|---|---|---|
| **Render (plano Starter)** | ~US$ 7/mês | Painel web simples; publica sozinho a cada mudança na branch `main`; não "dorme" | Menos flexível |
| Fly.io | ~US$ 5–10/mês | Rápido, várias regiões | Configuração por linha de comando, mais técnica |
| Railway | ~US$ 5+/mês por uso | Simples | Custo menos previsível |
| Google Cloud Run | variável | Escala muito | Complexo para iniciante |

**Recomendação adotada:** Render Starter + Neon (grátis no início). Custo inicial estimado de
**~US$ 7/mês**. Os preços são de referência e devem ser confirmados no site de cada serviço.
Planos gratuitos do Render "dormem" e deixam o painel lento; **não usar plano grátis em produção**.

### D9. Cobrança

| Opção | Prós | Contras |
|---|---|---|
| **Managed Pricing** (planos configurados no painel de parceiro; a Shopify mostra a página de planos) | Menos código; menos erros; aprovado pela Shopify | Menos flexível (ex.: cobranças por uso complexas) |
| Billing API manual | Flexível | Mais código e mais pontos de reprovação |

**Recomendação adotada:** Managed Pricing. Nosso código só **consulta** o plano ativo e **aplica o
limite** de 3 produtos no plano grátis.

### D10. Onde rodar o app durante o desenvolvimento

| Opção | Prós | Contras |
|---|---|---|
| **No computador do responsável** (`shopify app dev`) | Caminho oficial; a Shopify cria o túnel e a configuração sozinha | Precisa instalar Node.js, Git e Shopify CLI (com guia passo a passo) |
| Só na nuvem (servidor de testes + deploy automático) | Nada a instalar | Publicar extensões exige login no Shopify CLI dentro do servidor de automação; mais configuração e mais pontos de falha |

**Recomendação adotada:** no computador do responsável, com guia passo a passo (Etapa 1). As sessões
do Claude escrevem o código e enviam ao GitHub. O responsável baixa (`git pull`) e testa.

### D11. Armazenamento dos eventos

| Opção | Prós | Contras |
|---|---|---|
| **Eventos "crus" com índices; somar na hora de mostrar** | Simples; flexível para novas métricas | Pode ficar lento em lojas muito grandes |
| Tabela de resumo diário além dos eventos | Dashboard rápido sempre | Mais código; risco de números divergentes |

**Recomendação adotada:** eventos crus com índices no início. Tabela de resumo diário apenas se o
dashboard ficar lento (Risco R14).

### D12. Versão da API da Shopify

Usar **uma única versão** em todo o projeto: a **mais recente estável** no momento da execução.
Em 03/10/2026, ela é a **2026-10** (lançada em 01/10/2026; a anterior é a 2026-07). Definir em um
só lugar e repetir no `shopify.app.toml` e em cada `shopify.extension.toml`. Revisar a cada 6 meses,
porque cada versão tem suporte de cerca de 12 meses.

---

## 5. Arquitetura final

```
ADMIN DA SHOPIFY                         LOJA (vitrine)
┌──────────────────────────┐            ┌────────────────────────────────┐
│ Painel StorySell          │            │ Página do produto              │
│ (React Router + Polaris   │            │  └ Bloco "StorySell vídeo"     │
│  web components)          │            │     (theme app extension)      │
│  - Lista de produtos      │            │     lê o metafield do produto  │
│  - Escolher/enviar vídeo  │            │     e mostra o vídeo           │
│  - Dashboard              │            │     após 3s visível → publica  │
└───────────┬──────────────┘            │     "storysell:video_viewed"   │
            │ GraphQL Admin API          └──────────────┬─────────────────┘
            ▼                                           │ (só com consentimento)
┌──────────────────────────┐            ┌──────────────▼─────────────────┐
│ Shopify                   │            │ Web pixel StorySell            │
│  - Metafield do produto   │            │  - recebe video_viewed         │
│    $app:storysell.video   │            │  - recebe checkout_completed   │
│  - Arquivos de vídeo      │            │  - envia ao servidor do app    │
│  - Managed Pricing        │            └──────────────┬─────────────────┘
└──────────────────────────┘                           │ HTTPS (POST /api/pixel)
            ▲                                           ▼
            │ webhooks (desinstalação, privacidade)    ┌─────────────────────────┐
            └──────────────────────────────────────────│ Servidor do app (Render) │
                                                       │  + PostgreSQL (Neon)      │
                                                       │  Tabelas: Session, Shop,  │
                                                       │  ProductVideo, VideoView, │
                                                       │  Purchase                 │
                                                       └─────────────────────────┘
```

### Modelo de dados (Prisma) previsto

Os nomes são orientativos. Ajustar se necessário, mantendo o sentido.

- `Session`: vem do template (login do lojista).
- `Shop`: `shop` (domínio myshopify, único), `installedAt`, `uninstalledAt?`, `ianaTimezone`,
  `currencyCode`, `pixelId?`.
- `ProductVideo`: `id`, `shop`, `productId` (GID), `productTitle`, `videoId` (GID do arquivo de vídeo),
  `source` (`PRODUCT_MEDIA` | `UPLOAD`), `createdAt`, `updatedAt`. Único por (`shop`, `productId`).
- `VideoView`: `id`, `shop`, `productId`, `videoId`, `clientId` (anônimo), `occurredAt`.
  Índices: (`shop`, `occurredAt`), (`shop`, `clientId`, `occurredAt`), (`shop`, `productId`, `occurredAt`).
- `Purchase`: `id`, `shop`, `orderId` (único por loja), `checkoutToken?`, `clientId`, `totalAmount`
  (decimal), `currencyCode`, `productIds` (lista de GIDs), `occurredAt`.
  Índices: (`shop`, `occurredAt`), (`shop`, `clientId`).
- `PrivacyRequest` (opcional): registro dos webhooks de privacidade recebidos.

**Não guardar** nome, e-mail, telefone, endereço, IP nem ID de cliente.

### Escopos (permissões) previstos — o mínimo necessário

| Escopo | Para quê | Etapa |
|---|---|---|
| `read_products` | Listar produtos e seus vídeos | 3 |
| `write_products` | Gravar o metafield no produto | 3 |
| `write_files` | Enviar vídeo novo para a loja | 5 |
| `write_pixels` | Ativar o web pixel do app | 7 |
| `read_customer_events` | Receber eventos (visualização, compra) no pixel | 7 |

Não pedir `read_orders`, `read_customers`, `read_themes` nem nenhum outro, salvo decisão registrada
neste arquivo. Se o plano B do Risco R1 for adotado, `read_orders` passa a ser necessário.

---

## 6. Etapas de execução

Formato de cada etapa: **Objetivo**, **Tarefas**, **Pronto quando**, **Como o responsável testa**,
**Fora do escopo**.

As etapas 0 a 6 formam o **MVP**: o lojista escolhe um vídeo para um produto e ele aparece na vitrine.

---

### Etapa 0 — Trocar o LaunchQuik pelo template oficial

**Objetivo:** ter uma base limpa, atual e com licença livre.

**Tarefas:**
1. Criar uma branch nova a partir da `main`.
2. Apagar **todo** o conteúdo do LaunchQuik, **exceto** `PLANO.md` e a pasta `.git`. Isso inclui
   `LICENSE.txt`, `dump.rdb`, `.DS_Store`, `extensions/*`, `app/*`, `prisma/*`, `graphql_examples/*`,
   `.env.*`, `shopify.app.boilerplate-final.toml`, `app.config.cjs`, `remix.config.js` e o restante.
3. Copiar os arquivos do template oficial
   <https://github.com/Shopify/shopify-app-template-react-router>, versão mais recente, para a raiz.
   Copiar os arquivos (sem o `.git` do template). O comando
   `shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router` também
   serve, mas pede login.
4. Trocar o Prisma de SQLite para **PostgreSQL** (`provider = "postgresql"`, `url = env("DATABASE_URL")`)
   e recriar a migração inicial.
5. Nome do pacote: `storysell`. Remover do código qualquer menção a "LaunchQuik", "boilerplate", "GR".
6. Fixar a versão da API (D12) no `shopify.app.toml` e no código do servidor.
7. Deixar os escopos **vazios ou mínimos**. Eles serão adicionados nas etapas seguintes.
8. Criar `.env.example` com as variáveis necessárias e comentários em português. **Nunca** commitar `.env`.
9. Garantir que `.gitignore` inclui `.env`, `node_modules`, `build`, `.DS_Store`, `.shopify`.
10. Não ignorar o `shopify.app.toml`: o `client_id` não é segredo, e o template versiona esse arquivo.
11. Criar `CLAUDE.md` curto: "Leia o PLANO.md antes de qualquer tarefa; siga a seção 11."
12. Reescrever o `README.md` em português simples: o que é o app e como rodar (apontando para a Etapa 1).
13. Rodar `npm install`, `npm run build`, `npm run lint` (e `npm run typecheck`, se existir) e corrigir erros.

**Pronto quando:** o build e o lint passam, e nenhum arquivo do LaunchQuik permanece (`grep -ri launchquik`
vazio).

**Como o responsável testa:** nada visível ainda. A sessão deve mostrar o resultado do build.

**Fora do escopo:** qualquer funcionalidade de vídeo.

**Observação:** o histórico do Git continua contendo o código do LaunchQuik. **Manter o repositório
privado** (Risco R17).

---

### Etapa 1 — Ambiente de teste do responsável (guiado)

**Objetivo:** o responsável consegue abrir o app vazio dentro da sua loja de desenvolvimento.

**Tarefas (a sessão escreve o guia; o responsável executa):**
1. Escrever `docs/COMO-TESTAR.md` em português simples, com passos numerados e prints sugeridos:
   1. Instalar Node.js LTS, Git e Shopify CLI (Windows e Mac).
   2. Criar a **loja de desenvolvimento** no painel de parceiro, com alguns produtos de teste e um
      tema Online Store 2.0 (ex.: Dawn ou Horizon).
   3. Criar conta no **Neon**, criar o projeto `storysell` e copiar a URL do banco `dev` para o `.env`.
   4. `git clone` do repositório, `npm install`, `npm run dev`.
   5. Na primeira vez, o CLI pergunta se quer criar um app novo: responder **sim** e dar o nome
      **StorySell**. O CLI atualiza o `shopify.app.toml` com o `client_id`.
   6. Abrir o link de instalação e instalar na loja de desenvolvimento.
   7. Como baixar atualizações das próximas etapas (`git pull` + `npm install` + `npm run dev`).
   8. Seção "deu erro, e agora?" com os erros mais comuns.
2. Pedir ao responsável que faça commit do `shopify.app.toml` atualizado pelo CLI, ou que cole o
   `client_id` para a sessão fazer.

**Pronto quando:** o responsável vê a página inicial do template dentro do admin da loja de teste.

**Como o responsável testa:** seguindo `docs/COMO-TESTAR.md`.

**Fora do escopo:** produção.

---

### Etapa 2 — Base obrigatória: loja, desinstalação e webhooks de privacidade

**Objetivo:** cumprir desde já as regras de privacidade e de desinstalação da App Store.

**Tarefas:**
1. Criar o modelo `Shop` (seção 5) e gravar/atualizar a loja quando o lojista abre o app. Buscar
   `ianaTimezone` e `currencyCode` via GraphQL.
2. Webhook `app/uninstalled`: apagar sessões e marcar `uninstalledAt`. Manter os demais dados até o
   `shop/redact`.
3. Webhooks obrigatórios declarados no `shopify.app.toml` (`compliance_topics`):
   - `customers/data_request`: responder **200**. O app não guarda dados pessoais. Registrar o pedido
     e, se houver `Purchase` dos pedidos listados (`orders_requested`), registrar quais são, para
     entrega ao lojista se ele pedir.
   - `customers/redact`: responder **200** e apagar `Purchase` cujos `orderId` estejam em
     `orders_to_redact`.
   - `shop/redact`: responder **200** e apagar **todos** os dados da loja em todas as tabelas.
4. Usar `authenticate.webhook` do template, que já valida a assinatura (HMAC). **Não** reescrever a
   validação à mão.
5. Testes automatizados (Vitest) para os três webhooks de privacidade e para a desinstalação.

**Pronto quando:** os testes passam, e `shopify app webhook trigger` para cada tópico retorna 200 no
`npm run dev`.

**Como o responsável testa:** a sessão escreve em `docs/COMO-TESTAR.md` como disparar os webhooks de
teste pelo CLI e o que deve aparecer.

**Fora do escopo:** telas.

---

### Etapa 3 — Painel: escolher um vídeo que já está no produto

**Objetivo:** o lojista associa a um produto um vídeo que já existe na mídia daquele produto.

**Tarefas:**
1. Escopos: `read_products`, `write_products`.
2. Criar a **definição do metafield** de propriedade do app:
   - namespace `$app:storysell`, chave `video`;
   - tipo `file_reference`, com validação para aceitar só vídeo;
   - acesso de leitura pública na vitrine (`PUBLIC_READ`).
   - De preferência declarar no `shopify.app.toml` (definições declarativas). Se não for suportado,
     criar via `metafieldDefinitionCreate` na primeira abertura do app, de forma idempotente (sem
     duplicar).
3. Modelo `ProductVideo` (seção 5).
4. Página inicial do painel (Polaris web components), com:
   - lista dos produtos que têm vídeo (miniatura, título, botão "Trocar" e "Remover");
   - botão "Adicionar vídeo a um produto": abre o **seletor de produtos** do App Bridge
     (`shopify.resourcePicker({ type: 'product' })`), mostra os **vídeos da mídia** daquele produto
     (tipo `Video`) e o lojista escolhe um;
   - se o produto não tiver vídeo na mídia: mensagem explicando que o envio de vídeo novo vem na
     Etapa 5. Até lá, orientar a adicionar o vídeo na página do produto no admin.
5. Ao salvar: `metafieldsSet` no produto + gravar/atualizar `ProductVideo`. Ao remover: `metafieldsDelete`
   + apagar `ProductVideo`.
6. **Verificar logo no início** (Risco R5) se o `id` de um vídeo da mídia do produto é aceito em um
   metafield `file_reference`. Se não for, registrar aqui a alternativa adotada.
7. Textos da interface em inglês e português, conforme o idioma do admin do lojista. Usar um arquivo
   de traduções simples (`app/i18n/en.json`, `app/i18n/pt-BR.json`).

**Pronto quando:** escolher, trocar e remover funcionam, e o metafield aparece correto na consulta
GraphQL.

**Como o responsável testa:** adicionar um vídeo a um produto de teste pelo admin da Shopify. Depois,
no app, associar o vídeo e ver o produto na lista. Trocar e remover.

**Fora do escopo:** mostrar na loja (Etapa 4) e enviar vídeo novo (Etapa 5).

---

### Etapa 4 — Bloco de tema: o vídeo aparece na página do produto

**Objetivo:** o vídeo escolhido aparece na loja. **Este é o primeiro marco testável de ponta a ponta.**

**Tarefas:**
1. Criar a extensão de tema (`shopify app generate extension`, tipo *Theme app extension*), handle
   `storysell-video`.
2. Bloco `blocks/product-video.liquid`:
   - schema com `"target": "section"` e `"enabled_on": { "templates": ["product"] }`;
   - ler o metafield do produto (Risco R4: confirmar a sintaxe exata para metafield `$app` dentro da
     extensão);
   - se não houver vídeo: **não renderizar nada** (nem margem/espaço);
   - se houver: usar `video_tag` com `autoplay`, `muted`, `loop`, `playsinline` e imagem de capa
     (`preview_image`);
   - proporção do container = proporção do vídeo (`aspect_ratio`);
   - botão de som acessível (rótulo para leitor de tela);
   - **carregamento preguiçoso**: só baixar o vídeo quando ele estiver perto de aparecer na tela
     (IntersectionObserver). Pausar quando sair da tela.
3. Configurações do bloco no editor de temas: largura máxima, cantos arredondados, mostrar/ocultar
   botão de som, alinhamento.
4. CSS e JS pequenos, em `assets/`, sem bibliotecas externas. Não poluir estilos do tema (prefixo `storysell-`).
5. Traduções: `locales/en.default.json`, `locales/pt-BR.json` e os arquivos `.schema.json`
   correspondentes (textos do editor de temas).

**Pronto quando:** o vídeo toca sozinho, sem som e em loop na página do produto escolhido, e não
aparece nada nos outros produtos.

**Como o responsável testa:** Loja online → Temas → Personalizar → página de produto → "Adicionar
bloco" → Apps → StorySell. Abrir na loja um produto com vídeo e um sem vídeo. Testar no celular.

**Fora do escopo:** medição.

---

### Etapa 5 — Enviar um vídeo novo pelo app

**Objetivo:** o lojista envia um vídeo do computador sem sair do app.

**Tarefas:**
1. Escopo: `write_files`.
2. Fluxo:
   1. O servidor chama `stagedUploadsCreate` (recurso `VIDEO`).
   2. O navegador envia o arquivo **direto para a Shopify**, sem passar pelo nosso servidor.
   3. O servidor chama `fileCreate` (`contentType: VIDEO`).
   4. O app consulta o status até ficar `READY`.
   5. Grava o metafield + `ProductVideo` com `source = UPLOAD`.
3. Mostrar barra de progresso e o estado "processando…". Mensagens claras para formato inválido,
   arquivo grande demais (limites da Shopify, Risco R6) ou falha.
4. Validar tipo do arquivo no navegador (mp4, mov, webm) antes de enviar.

**Pronto quando:** enviar um mp4 pelo app faz o vídeo aparecer na loja (Etapa 4) sem passos extras.

**Como o responsável testa:** enviar um vídeo curto de celular para um produto sem vídeo e conferir na loja.

**Fora do escopo:** edição/corte de vídeo.

---

### Etapa 6 — Acabamento do MVP: primeiros passos, estados vazios e idiomas

**Objetivo:** um lojista novo entende sozinho o que fazer.

**Tarefas:**
1. Guia de "primeiros passos" na página inicial, com 3 passos e marcação de feito:
   (1) escolha um vídeo, (2) adicione o bloco ao tema, (3) veja na loja.
2. Botão "Adicionar bloco ao tema", com link direto para o editor de temas já adicionando o bloco:
   `https://{shop}/admin/themes/current/editor?template=product&addAppBlockId={api_key}/product-video&target=mainSection`.
   Confirmar o formato atual na documentação.
3. Estados vazios, mensagens de erro amigáveis e confirmação antes de remover.
4. Revisar todas as traduções (en / pt-BR).
5. Aviso de que temas antigos ("vintage", não Online Store 2.0) não suportam blocos (Risco R8).

**Pronto quando:** uma pessoa que nunca viu o app consegue configurar um vídeo seguindo só a tela.

**Como o responsável testa:** pedir a alguém que configure sem ajuda.

🎯 **Fim do MVP.** Recomenda-se o responsável usar o app por alguns dias antes de seguir.

---

### Etapa 7 — Medir visualizações (web pixel)

**Objetivo:** registrar no banco cada "assistiu" (3 s visível tocando), respeitando o consentimento.

**Tarefas:**
1. Escopos: `write_pixels`, `read_customer_events`.
2. Criar a extensão **web pixel** (`shopify app generate extension`, tipo *Web pixel*), handle
   `storysell-pixel`:
   - configurar as exigências de privacidade no `shopify.extension.toml` (`[customer_privacy]`,
     analytics = true) para só rodar com consentimento;
   - assinar o evento personalizado `storysell:video_viewed`;
   - enviar `{ shop, productId, videoId, clientId, timestamp }` ao servidor
     (`POST {APP_URL}/api/pixel`) com `fetch` (keepalive) ou `browser.sendBeacon`.
3. Ativar o pixel na loja via `webPixelCreate` na abertura do app, e `webPixelUpdate` se já existir.
   Guardar `pixelId` em `Shop`.
4. No bloco (Etapa 4): somar o tempo em que o vídeo está **≥ 50% visível e tocando**. Ao chegar a 3 s,
   chamar **uma vez por carregamento de página**
   `Shopify.analytics.publish("storysell:video_viewed", { productId, videoId })`.
5. Rota pública `POST /api/pixel`:
   - responder a CORS;
   - aceitar só lojas instaladas (`Shop` sem `uninstalledAt`);
   - validar formato e tamanho;
   - limite simples de taxa por `clientId`/IP, sem guardar o IP;
   - gravar `VideoView`;
   - responder rápido (204).
6. Testes automatizados da rota (válido, loja desconhecida, payload inválido).

**Pronto quando:** assistir 3 s na loja cria **um** registro `VideoView`, e recusar os cookies não cria
nenhum (em região que exige consentimento).

**Como o responsável testa:** abrir o produto na loja (aba anônima), assistir e ver o contador na
página temporária "Diagnóstico" do app, que mostra as últimas visualizações. Remover essa página na
Etapa 9.

**Fora do escopo:** compras.

---

### Etapa 8 — Registrar compras e ligar à visualização (atribuição)

**Objetivo:** saber quais compras vieram de quem assistiu, pela regra de 7 dias.

**Tarefas:**
1. **Primeiro, uma verificação rápida (Risco R1):** confirmar com um pedido de teste que o `clientId`
   no `checkout_completed` é **o mesmo** da visualização na página do produto. Se não for, parar e
   registrar aqui. Avaliar o plano B da D6 com o responsável antes de continuar.
2. Pixel assina `checkout_completed` e envia
   `{ shop, orderId, checkoutToken, clientId, totalAmount, currencyCode, productIds, timestamp }`.
   **Sem** e-mail, nome ou endereço.
3. Rota grava `Purchase`, sem duplicar o mesmo `orderId`.
4. Lógica de atribuição em um módulo isolado e testado (`app/lib/attribution.server.ts`):
   - uma compra é **atribuída** se houver `VideoView` do mesmo `shop` + `clientId` com
     `occurredAt` entre `compra − 7 dias` e `compra`;
   - por produto do vídeo P: a compra conta para P se o comprador viu o vídeo de P na janela;
     `incluiuProduto = productIds contém P`;
   - no total geral, **cada compra conta uma vez só**, mesmo que a pessoa tenha visto vários vídeos.
5. Testes unitários cobrindo: dentro/fora da janela, vários vídeos, compra sem visualização,
   visualização depois da compra (não conta), pedido duplicado.

**Pronto quando:** um pedido de teste depois de assistir aparece como atribuído, e um pedido sem assistir não.

**Como o responsável testa:** com o "pagamento de teste" (Bogus Gateway) da loja de desenvolvimento:
assistir, comprar e ver na página Diagnóstico.

**Fora do escopo:** telas bonitas (Etapa 9).

---

### Etapa 9 — Dashboard

**Objetivo:** o lojista vê os números de forma clara.

**Tarefas:**
1. Página "Dashboard" no menu do app. Seletor de período: últimos 7, 30 e 90 dias e personalizado.
   Usar o **fuso horário da loja**.
2. Cartões de resumo:
   - visualizações;
   - pessoas que assistiram (`clientId` distintos);
   - compras de quem assistiu;
   - taxa de conversão = compras atribuídas ÷ pessoas que assistiram;
   - valor vendido.
3. Tabela por produto com as mesmas colunas + "pedidos que incluíram este produto". Ordenável.
4. Gráfico simples de visualizações por dia (opcional nesta etapa). Escolher biblioteca leve e
   registrar a escolha aqui.
5. Texto explicativo curto: "compras feitas por quem assistiu em até 7 dias — não significa que o vídeo
   causou a compra" e "visitantes que recusaram cookies não são contados".
6. Valores em mais de uma moeda: mostrar separados por moeda (Risco R9).
7. Remover a página "Diagnóstico".
8. Consultas com índices; medir o tempo com dados de teste volumosos (ex.: 500 mil views).

**Pronto quando:** os números do dashboard batem com os registros de teste.

**Como o responsável testa:** comparar com o que fez manualmente nas Etapas 7 e 8.

---

### Etapa 10 — Retenção de 13 meses

**Objetivo:** apagar automaticamente dados antigos.

**Tarefas:**
1. Rotina diária que apaga `VideoView` e `Purchase` com mais de 13 meses. Pode ser um Cron Job do
   Render ou um agendamento interno com proteção para não rodar duas vezes.
2. Apagar lojas desinstaladas há mais de 48 h sem `shop/redact` recebido, como garantia extra
   (confirmar a regra com o responsável).
3. Testes.

**Pronto quando:** dados de teste com 14 meses somem após a rotina.

---

### Etapa 11 — Cobrança (Managed Pricing)

**Objetivo:** plano grátis (até 3 produtos com vídeo) e plano pago (ilimitado, 7 dias grátis).

**Tarefas:**
1. O **responsável** configura os planos no painel de parceiro: app → Distribuição/Pricing →
   Managed pricing. A sessão escreve um guia passo a passo em `docs/COBRANCA.md`.
2. O app consulta a assinatura ativa (`currentAppInstallation.activeSubscriptions`) e decide o plano.
3. Ao tentar adicionar o 4º produto no plano grátis: bloquear com mensagem e botão "Ver planos", que
   leva a `https://admin.shopify.com/store/{store}/charges/{app_handle}/pricing_plans`.
4. Se o lojista voltar ao plano grátis tendo mais de 3 vídeos: **não apagar nada**. Definir com o
   responsável o comportamento (sugestão: manter os 3 mais antigos visíveis na loja e avisar no painel).
   Registrar a decisão aqui.
5. Testes com lojas de desenvolvimento, que não são cobradas de verdade.

**Pronto quando:** o limite funciona e a assinatura do plano pago libera tudo.

---

### Etapa 12 — Publicar em produção

**Objetivo:** app rodando em servidor real, pronto para revisão.

**Tarefas:**
1. Neon: criar o banco `prod`.
2. Render: criar o Web Service ligado ao GitHub (branch `main`):
   - comando de build: `npm ci && npm run build`;
   - comando de start: rodar migrações (`prisma migrate deploy`) e iniciar;
   - variáveis de ambiente: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`,
     `DATABASE_URL`, `SCOPES`, `NODE_ENV=production`;
   - verificação de saúde (`/healthz`).
3. Criar no painel de parceiro uma configuração de produção separada (`shopify.app.production.toml`,
   via `shopify app config link`) apontando para a URL do Render. Manter a de desenvolvimento.
4. `shopify app deploy --config production`, feito pelo responsável, com guia passo a passo.
   Publica as extensões (bloco e pixel) e a configuração.
5. Registro de erros (logs do Render; opcional Sentry no plano gratuito).
6. Teste completo numa loja de desenvolvimento nova usando a versão de produção.

**Pronto quando:** o app instala e funciona a partir da URL de produção.

---

### Etapa 13 — Preparar e enviar para a App Store

**Objetivo:** passar na revisão.

**Tarefas:**
1. Percorrer a seção 8 item por item e marcar.
2. Escrever (rascunho para o responsável aprovar), em inglês e português:
   - descrição curta e longa;
   - perguntas frequentes;
   - texto da política de privacidade;
   - instruções de teste para o revisor.
3. Testar em pelo menos 3 temas gratuitos atuais (ex.: Dawn, Horizon e outro) e no celular.
4. Medir impacto no Lighthouse da página de produto, com e sem o bloco (Risco R7).
5. O responsável grava o vídeo de demonstração, faz as capturas de tela e envia o app para revisão.
6. Depois da aprovação: considerar pedir o selo "Built for Shopify".

---

## 7. O que o responsável precisa providenciar

**Já tem:** conta de Parceiro Shopify e GitHub.

| Quando | Item | Observação |
|---|---|---|
| Etapa 1 | **Loja de desenvolvimento** no painel de parceiro | Gratuita. Colocar 3–5 produtos e 1–2 vídeos curtos de teste. Usar tema Online Store 2.0. |
| Etapa 1 | **Computador** com Node.js LTS, Git e Shopify CLI | Guia em `docs/COMO-TESTAR.md`. |
| Etapa 1 | **Conta no Neon** (banco de dados) | Gratuita. |
| Etapa 1 | Vídeos de teste (vertical e horizontal, curtos) | Celular serve. |
| Etapa 11 | **Preço do plano pago** e nome dos planos | Ex.: "Free" e "Pro". |
| Etapa 12 | **Conta no Render** ligada ao GitHub | ~US$ 7/mês. Cartão de crédito. |
| Etapa 12/13 | **E-mail de suporte** | Exibido na App Store. |
| Etapa 13 | **Política de privacidade publicada** em uma URL | A sessão escreve o texto; pode ser publicada pelo próprio app (rota `/privacy`) ou num site. |
| Etapa 13 | **Ícone do app** 1200×1200 px | Sem texto pequeno; fundo não transparente. |
| Etapa 13 | **Capturas de tela** (1600×900) e **vídeo de demonstração** (screencast) | Do painel e da loja. |
| Etapa 13 | **Dados fiscais/pagamento** no painel de parceiro | Para receber da Shopify. |
| Antes de publicar | Conferir se o nome "StorySell" está livre na App Store e sem conflito de marca | Ver Risco R19. |
| Contínuo | Manter o repositório **privado** | Ver Risco R17. |

---

## 8. Exigências para aprovação na Shopify App Store

Lista de referência. **Antes de enviar, conferir o checklist oficial atual** ("App Store requirements"
na documentação da Shopify), porque ele muda com frequência.

**Segurança e autenticação**
- [ ] App embutido no admin, usando token de sessão do App Bridge (o template já faz isso).
- [ ] Usar a **GraphQL Admin API**. A REST Admin API é legado e não é aceita para apps públicos novos.
- [ ] Validar a assinatura (HMAC) de todos os webhooks (o template já faz isso).
- [ ] HTTPS em tudo; segredos só em variáveis de ambiente.

**Privacidade (obrigatório)**
- [ ] Webhooks `customers/data_request`, `customers/redact` e `shop/redact` respondendo **200** e
      cumprindo o que pedem (Etapa 2).
- [ ] Webhook `app/uninstalled` tratado.
- [ ] Política de privacidade publicada e informada no anúncio.
- [ ] Pixel respeitando consentimento (Etapa 7).
- [ ] Verificar se o uso de `checkout_completed` exige pedido de acesso a **dados protegidos de
      clientes** no painel de parceiro (Risco R11). Se exigir, preencher o formulário justificando o
      uso mínimo.

**Permissões**
- [ ] Pedir **somente** os escopos da seção 5. Cada escopo deve ter justificativa clara no envio.

**Cobrança**
- [ ] Toda cobrança pela Shopify (Managed Pricing). Nunca cobrar por fora.
- [ ] Preços no anúncio iguais aos configurados.
- [ ] Trocar de plano, cancelar e reinstalar funcionando.

**Loja / tema**
- [ ] Integração com a loja **apenas por extensão de tema** (bloco). Nunca editar arquivos do tema do lojista.
- [ ] Ao desinstalar, nada quebrado fica na loja. Blocos de extensão somem sozinhos.
- [ ] Impacto pequeno no desempenho da loja: medir com Lighthouse (referência da Shopify: não
      reduzir mais que ~10 pontos).
- [ ] Funcionar bem no celular.

**Experiência do lojista**
- [ ] Instalação sem erro e sem tela em branco; onboarding claro (Etapa 6).
- [ ] Interface com Polaris; textos sem erros; app funcional sem configuração externa.
- [ ] Instruções de teste para o revisor (passo a passo + loja/produto de exemplo).

**Anúncio na App Store**
- [ ] Nome, ícone, descrição, capturas, vídeo de demonstração, e-mail de suporte, URL de privacidade,
      planos e preços, idiomas suportados.
- [ ] Não mencionar resultados garantidos de vendas ("aumenta suas vendas em X%").

---

## 9. Lista de progresso

Atualize ao concluir cada etapa (data + commit).

- [ ] Etapa 0 — Trocar LaunchQuik pelo template oficial
- [ ] Etapa 1 — Ambiente de teste do responsável
- [ ] Etapa 2 — Loja, desinstalação e webhooks de privacidade
- [ ] Etapa 3 — Painel: escolher vídeo do produto
- [ ] Etapa 4 — Bloco de tema mostra o vídeo
- [ ] Etapa 5 — Enviar vídeo novo
- [ ] Etapa 6 — Acabamento do MVP  ← **fim do MVP**
- [ ] Etapa 7 — Medir visualizações (pixel)
- [ ] Etapa 8 — Compras e atribuição
- [ ] Etapa 9 — Dashboard
- [ ] Etapa 10 — Retenção de 13 meses
- [ ] Etapa 11 — Cobrança
- [ ] Etapa 12 — Produção
- [ ] Etapa 13 — Envio para a App Store

### Registro de decisões tomadas durante a execução

(As sessões devem anotar aqui qualquer decisão nova ou mudança, com data.)

- 03/10/2026 — Plano criado. Todas as sugestões da seção 3 aceitas pelo responsável.

---

## 10. Riscos e pontos em aberto

Não assumir nada destes pontos: **verificar** na etapa indicada e registrar o resultado na seção 9.

| # | Risco / dúvida | Impacto | O que fazer | Etapa |
|---|---|---|---|---|
| R1 | O `clientId` do checkout pode não ser igual ao da página de produto (ex.: checkout em outro domínio, troca de navegador) | Atribuição de compras não funciona | Testar primeiro; se falhar, plano B da D6 (atributo no carrinho + webhook de pedidos, exige `read_orders`) | 8 |
| R2 | Visitantes que recusam cookies não são contados | Números abaixo do real (especialmente Europa) | Aceito pelo responsável; explicar no dashboard | 7, 9 |
| R3 | Bloqueadores de anúncio podem impedir o pixel | Números abaixo do real | Explicar no dashboard | 7 |
| R4 | Sintaxe exata para ler metafield `$app` dentro da extensão de tema (ex.: `app--<id>--storysell`) | Vídeo não aparece | Testar no início da Etapa 4; alternativa: namespace comum `storysell` | 4 |
| R5 | Vídeo da mídia do produto pode não ser aceito como `file_reference` | Fluxo "escolher vídeo existente" muda | Testar no início da Etapa 3 | 3 |
| R6 | Limites de tamanho/duração de vídeo da Shopify e tempo de processamento | Lojista frustrado com erro | Conferir limites atuais e mostrá-los na tela | 5 |
| R7 | Vídeo com autoplay pode pesar na velocidade da loja | Reprovação ou lojas lentas | Carregamento preguiçoso, capa leve, medir Lighthouse | 4, 13 |
| R8 | Temas antigos ("vintage") não aceitam blocos de app | Alguns lojistas não conseguem usar | Avisar no app e no anúncio | 6, 13 |
| R9 | Compras em várias moedas | Soma de valores errada | Mostrar por moeda; avaliar conversão no futuro | 9 |
| R10 | A rota pública `/api/pixel` pode receber dados falsos ou em excesso | Números inflados, custo | Validação, limite de taxa, só lojas instaladas | 7 |
| R11 | Uso de `checkout_completed` no pixel pode exigir aprovação de "dados protegidos de clientes" | Atraso na aprovação | Verificar no painel de parceiro antes da Etapa 8 | 8, 13 |
| R12 | Publicar extensões exige login no Shopify CLI; em automação (CI) o método de token pode ter mudado | Deploy manual | Deploy feito pelo responsável com guia | 12 |
| R13 | Plano grátis do Neon tem limite de espaço e "adormece" | Lentidão/limite em lojas grandes | Monitorar; migrar para plano pago (~US$ 19/mês) quando necessário | 9, 12 |
| R14 | Muitas visualizações em lojas grandes deixam o dashboard lento | Experiência ruim | Índices; tabela de resumo diário se preciso (D11) | 9 |
| R15 | "Comprou depois de assistir" não prova que o vídeo causou a compra | Expectativa errada do lojista | Texto explicativo no dashboard e no anúncio | 9, 13 |
| R16 | Polaris web components não têm gráfico pronto | Precisa de outra biblioteca | Escolher biblioteca leve ou usar só tabela e cartões | 9 |
| R17 | O histórico do Git contém o código proprietário do LaunchQuik | Questão de licença se o repositório ficar público | Manter privado; se precisar torná-lo público, criar repositório novo sem histórico | 0 |
| R18 | Versões da API expiram a cada ~12 meses | App quebra com o tempo | Revisar a versão a cada 6 meses | contínuo |
| R19 | Nome "StorySell" pode já existir na App Store ou ser marca de alguém | Troca de nome tardia | Pesquisar antes da Etapa 13 | 13 |
| R20 | Comportamento ao rebaixar do plano pago para o grátis com mais de 3 vídeos | Indefinido | Decidir com o responsável | 11 |
| R21 | Preço do plano pago ainda não definido | Bloqueia Etapa 11 | Responsável decide | 11 |

---

## 11. Regras para as sessões que executarem este plano

1. **Leia este arquivo inteiro antes de começar.** Execute só a próxima etapa não concluída, salvo pedido diferente.
2. Fale com o responsável **em português simples**. Explique termos técnicos na primeira vez que aparecerem.
3. Código, nomes de variáveis e comentários de código em **inglês**. Documentação para o responsável em **português**.
4. Não adicione bibliotecas sem necessidade. Prefira o que o template e a Shopify já oferecem.
5. Não peça escopos além da seção 5 sem registrar a decisão na seção 9.
6. Use **uma única versão da API** (D12) em todo o projeto.
7. Antes de cada commit: `npm run build`, `npm run lint` e os testes precisam passar.
8. Nunca commitar `.env`, chaves ou segredos.
9. Ao terminar uma etapa: marque na seção 9 (data + commit), escreva em `docs/COMO-TESTAR.md` como
   testar e diga ao responsável, em passos simples, como testar.
10. Se algo do plano se mostrar errado ou impossível, **pare e pergunte** ao responsável. Registre a
    nova decisão na seção 9. Não improvise silenciosamente.
11. Ao verificar um item da seção 10, registre o resultado na seção 9.

---

## 12. Glossário

- **Admin / painel:** área onde o lojista administra a loja Shopify.
- **App embarcado:** app que abre dentro do admin da Shopify.
- **Vitrine / loja:** o site que o cliente final vê.
- **Extensão de tema / bloco de app:** peça que o app oferece e o lojista arrasta no editor de temas.
- **Metafield:** "campo extra" que se pode guardar em um produto. Aqui, guarda qual vídeo é daquele produto.
- **Web pixel:** pequeno programa que roda na loja de forma isolada e recebe eventos (visualizou,
  comprou), respeitando o consentimento de cookies.
- **clientId:** número anônimo que identifica um navegador, não uma pessoa.
- **Webhook:** aviso automático que a Shopify envia ao nosso servidor quando algo acontece.
- **Escopo:** permissão que o app pede ao lojista.
- **Atribuição:** regra que decide se uma compra "conta" como vinda de quem assistiu ao vídeo.
- **MVP:** versão mínima que já funciona e pode ser testada.
- **Managed Pricing:** cobrança em que a própria Shopify mostra os planos e cobra o lojista.
- **Deploy:** publicar uma nova versão do app no servidor.
- **GID:** identificador de objetos da Shopify, ex.: `gid://shopify/Product/123`.
