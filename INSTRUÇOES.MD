# Fluxo De `account_id`, `conversation_id`, Nome Do Cliente E Link Da Conversa

## Objetivo

Este documento explica, no estado atual do projeto, como o sistema:

- identifica a `account_id`
- captura `conversation_id`
- obtém o nome do cliente
- pode montar o link da conversa no Chatwoot

## 1) Como A `account_id` É Obtida

### 1.1 Pela rota da aplicação

A base principal da conta vem da URL via `useParams()`:

- padrão de rota: `/:accountId/...`
- arquivos que usam isso: páginas como `Agendamento`, `Dashboard`, `Configuracoes`, `Acompanhamento`, `BasePage`

Fluxo típico:

1. `const { accountId } = useParams<{ accountId: string }>()`
2. `const numericAccountId = Number(accountId)`
3. consultas Supabase filtram por `.eq("account_id", numericAccountId)`

### 1.2 Pelo contexto do Chatwoot (embed)

Quando está embedado, o app também tenta capturar o contexto enviado pela janela pai:

- em `ChooseAccount` e `AppLayout`, o app escuta `window.postMessage`
- ao receber evento `appContext`, extrai conta por esta ordem:
  - `currentAccount.id`
  - `conversation.account_id`
  - `currentAgent.account_id`
  - `account.id`
  - `payload.accountId`

Depois salva em `sessionStorage`:

- chave: `chatwoot.context`
- campos: `accountId`, `conversationId`, `agentId`, `agentName`, `agentEmail`

Se a conta extraída for diferente da rota atual, o app navega automaticamente para `/${accountIdExtraido}`.

### 1.3 Pelo query string (fallback)

Em `ChooseAccount`, antes do `postMessage`, também tenta pegar conta por query string:

- `?accountId=...`
- `?account_id=...`
- `?account=...`

## 2) Como O `conversation_id` É Capturado

## 2.1 Contexto de sessão (Chatwoot)

O `conversationId` é capturado do payload do `appContext`:

- origem: `conversation.id`
- persistência: `sessionStorage["chatwoot.context"].conversationId`

Isso ocorre em:

- `src/pages/ChooseAccount.tsx`
- `src/components/AppLayout.tsx`

## 2.2 Dados de integração (Acompanhamento)

Na tela `Acompanhamento`, o retorno da function `mensagens-integracoes` traz `conversation_id` por linha:

- tipo `MensagemIntegracao` já possui `conversation_id: number | null`
- atualmente esse campo existe no dado, mas não está exibido na tabela principal nem no modal de detalhes

## 3) Como O Nome Do Cliente É Obtido

Hoje o nome do cliente aparece principalmente na tela `Acompanhamento`:

- campo: `nome`
- fonte: cada linha retornada pela function `mensagens-integracoes`
- exibição:
  - coluna "Nome" da tabela
  - card "Nome" no modal de detalhes

Observação:

- em outras partes do sistema, "nome" pode representar nome da unidade/empresa (ex.: em `mensagens_programadas.nome`), não necessariamente o cliente.
- para cliente, o campo de interesse no acompanhamento é `rows[].nome`.

## 4) Como Montar O Link Da Conversa

## 4.1 Regra de montagem

Com os dados já disponíveis, o link da conversa pode ser montado por:

- host Chatwoot (ex.: `https://chat.izzy.app.br`)
- `accountId`
- `conversationId`

Formato recomendado:

```txt
https://chat.izzy.app.br/app/accounts/{accountId}/conversations/{conversationId}
```

Exemplo:

```txt
https://chat.izzy.app.br/app/accounts/272/conversations/123456
```

## 4.2 Fontes para montar o link

Você pode montar o link em 2 cenários:

1. **Contexto atual da conversa aberta no Chatwoot**
   - `accountId` e `conversationId` de `sessionStorage["chatwoot.context"]`

2. **Lista de mensagens no Acompanhamento**
   - `accountId`: rota atual (`numericAccountId`)
   - `conversationId`: `row.conversation_id`

## 4.3 Situação atual no projeto

Atualmente o projeto:

- **já captura** `conversationId`
- **já possui** `conversation_id` nos dados de acompanhamento
- **ainda não renderiza** um botão/link explícito para abrir a conversa no Chatwoot

Ou seja: os dados necessários existem, falta apenas a renderização do link na UI.

## 5) Resumo Rápido

- `account_id`:
  - principal: rota (`useParams`)
  - fallback: query string e `appContext` via `postMessage`
- `conversation_id`:
  - capturado no `appContext`
  - também presente em `Acompanhamento.rows[].conversation_id`
- nome do cliente:
  - `Acompanhamento.rows[].nome`
- link da conversa:
  - regra: `https://chat.izzy.app.br/app/accounts/{accountId}/conversations/{conversationId}`
  - ainda não exibido hoje, mas já pode ser implementado sem mudar backend

