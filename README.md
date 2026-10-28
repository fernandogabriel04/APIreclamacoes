# Ouvidoria Inteligente | Prefeitura de Maceió

Aplicação Next.js (em `frontend/`) que recebe relatos de munícipes por áudio, transcreve, classifica
e exibe tudo em um painel interativo. Não há mais API separada: o Next faz o papel de backend.

## Rotas

| Rota | O que é |
|---|---|
| `/` | Detecta o bairro (ou pergunta) e leva para `/relato/<bairro>` |
| `/relato/<bairro>` | Gravação do áudio (server action `enviarRelato`) |
| `dashboard.<domínio>/` | Painel da Ouvidoria (reescrito para `/painel` pelo `proxy.js`) |
| `POST /api/reclamacoes` | Integração (WhatsApp). Exige header `X-Api-Key` |

## Rodando localmente

```bash
cd frontend
cp .env.example .env.local   # preencha GROQ_API_KEY, ACCESS_KEY, AUTH_SECRET e WHATSAPP_API_KEY
npm install
npm run dev
```

- Site: http://localhost:3000
- Painel: http://dashboard.localhost:3000
- Com `DB_URL=pglite:./.data/local` o banco é um Postgres embutido (sem instalar nada).
  Em produção use a URL do Postgres; a tabela `registros` existente é reaproveitada.

## Integração (WhatsApp)

Mesmo contrato da API anterior, agora com chave obrigatória:

```bash
curl -X POST https://<dominio>/api/reclamacoes \
  -H "X-Api-Key: $WHATSAPP_API_KEY" -H "Content-Type: application/json" \
  -d '{"tipo":"audio","localizacao":"Centro","origem":"Whatsapp","audio_url":"https://..."}'
```

`audio_url` precisa ser HTTPS e público. Defina `AUDIO_URL_HOSTS` para limitar os domínios aceitos.
Também aceita `multipart/form-data` com o campo `file`.

## Segurança

- Segredos apenas no servidor (`server-only`); nada de `NEXT_PUBLIC_`.
- O envio pelo site é limitado a 10 relatos por hora por IP (tabela `limites`).
- Áudio validado pelo conteúdo (não pelo tipo informado), máximo de 5 MB e 1 minuto.
- `audio_url` bloqueia IPs internos, redirecionamentos e http (proteção contra SSRF).
- O painel confere a sessão no servidor em toda leitura de dados.
