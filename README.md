# Ticket Manager

MVP de gerenciamento de tickets.

## Dev local

```bash
npm install
npm run dev
```

## Deploy no EasyPanel

1. Faça push do projeto para um repositório Git
2. No EasyPanel, crie um novo serviço → **App**
3. Selecione o repositório e branch
4. EasyPanel detecta o `Dockerfile` automaticamente
5. Defina a porta como **80**
6. Deploy!

## Build manual com Docker

```bash
docker build -t ticket-app .
docker run -p 3000:80 ticket-app
```
