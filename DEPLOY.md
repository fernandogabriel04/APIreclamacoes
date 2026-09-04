# Deploy — Ouvidoria JHC

| Peça | Onde | URL final |
| --- | --- | --- |
| Frontend (Next.js — `/`, `/cabine`, `/painel`) | **Vercel** | `https://<projeto>.vercel.app` |
| Backend (Flask API) | **Railway** (web service) | `https://<servico>.up.railway.app` |
| Banco | **Railway** (PostgreSQL) | interno |
| IA | **OpenAI API** | transcrição + classificação |

O navegador manda o áudio direto para o backend (Railway). O `/painel/dados` do
Next roda no servidor da Vercel e fala com o backend sem CORS.

---

## 0. Preparar o repositório

```bash
git add app/Procfile app/runtime.txt app/APIREST.py app/requirements.txt app/seed.py \
        frontend/package.json frontend/package-lock.json DEPLOY.md
git commit -m "chore: preparar deploy (Railway + Vercel + Postgres)"
git push origin jhc      # ou a branch que for publicar
```

Gere os segredos (guarde num gerenciador de senhas):

```bash
python -c "import secrets; print('ACCESS_KEY =', secrets.token_urlsafe(32))"
python -c "import secrets; print('PAINEL_SENHA =', secrets.token_urlsafe(24))"
```

---

## 1. Banco — PostgreSQL no Railway

1. https://railway.app → **New Project** → **Deploy PostgreSQL**.
2. O serviço `Postgres` já expõe a variável `DATABASE_URL`. Não precisa mexer nela.

---

## 2. Backend — Flask no Railway

1. No mesmo projeto: **New** → **GitHub Repo** → selecione `APIreclamacoes`.
2. **Settings** do serviço:
   - **Root Directory**: `app`  ← **obrigatório**. Sem isso o Railway tenta
     buildar o repositório inteiro (que também tem o frontend Node) e falha.
   - **Healthcheck Path**: `/health`
   - Build: o Railway usa o **`app/Dockerfile`** automaticamente (imagem
     `python:3.11-slim` + gunicorn). O `Procfile`/`runtime.txt` ficam só como
     fallback para outros hosts (Render etc.).
3. **Variables** (aba Variables do serviço):

   | Variável | Valor |
   | --- | --- |
   | `DB_URL` | `${{Postgres.DATABASE_URL}}` (referência ao serviço Postgres) |
   | `OPENAI_API_KEY` | `sk-proj-...` |
   | `ACCESS_KEY` | o gerado no passo 0 |
   | `PORT` | `8080` |
   | `MODELO_TRANSCRICAO` | `gpt-4o-transcribe` (ou `gpt-4o-mini-transcribe` p/ economizar) |
   | `MODELO_CLASSIFICACAO` | `gpt-4o-mini` |
   | `CORS_ORIGINS` | `*` por enquanto (troca no passo 4) |

4. **Settings → Networking → Generate Domain** → quando pedir a porta, informe
   **`8080`** (o Dockerfile faz `EXPOSE 8080` e o gunicorn escuta em `$PORT`).
   Anote `https://<servico>.up.railway.app`.
5. A tabela `registros` é criada sozinha no primeiro boot (`create_all`). Confira:
   `curl https://<servico>.up.railway.app/health` → `{"ok":true}`.
6. *(Opcional)* dados de demonstração:
   `railway run --service <servico-backend> python seed.py`
   Para produção real, **não rode o seed** (ou rode e depois `DELETE FROM registros;`).

---

## 3. Frontend — Next.js na Vercel

1. https://vercel.com → **Add New → Project** → importe `APIreclamacoes`.
2. **Root Directory**: `frontend` (framework detectado: Next.js 16).
   - **Node.js Version** (Settings → General): **20.x ou 22.x** — o Next 16 exige
     Node ≥ 20.9. O padrão da Vercel já é 22.x; só confira se não está travado no 18.
3. **Environment Variables** (Production + Preview):

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://<servico>.up.railway.app/api/reclamacoes` |
   | `OUVIDORIA_API_URL` | `https://<servico>.up.railway.app` |
   | `OUVIDORIA_ACCESS_KEY` | **mesmo valor** de `ACCESS_KEY` do backend |
   | `PAINEL_SENHA` | o gerado no passo 0 |

   `NEXT_PUBLIC_API_URL` fica embutido no bundle (é público, tudo bem). As outras
   três só existem no servidor (route handler `/painel/dados`).
4. **Deploy** → anote `https://<projeto>.vercel.app`.

---

## 4. Fechar o CORS

No Railway, serviço do backend → `CORS_ORIGINS` = `https://<projeto>.vercel.app`
(sem barra no fim; separe por vírgula se tiver mais de um domínio) → **Redeploy**.

---

## 5. Testar em produção

- `/` → escolher município + bairro, gravar áudio, enviar → "Manifestação recebida".
- `/cabine?municipio=Arapiraca&bairro=Centro&cabine=Praça da Matriz` → só o gravador.
- `/painel` → senha (`PAINEL_SENHA`) → KPIs, gráficos, tabela.
- Conferir no Railway (Postgres → Data) se o registro entrou com `municipio`,
  `bairro`, `origem` (`Site` ou `Cabine ...`).

---

## Custos aproximados (mês)

| Item | Custo |
| --- | --- |
| Vercel | Hobby grátis · **Pro US$20** exigido p/ uso comercial |
| Railway (backend + Postgres) | ~US$5–10 (uso) |
| OpenAI | ~R$0,035 por manifestação de áudio |

---

## Domínio próprio (quando tiver)

- `ouvidoria.exemplo.com.br` → Vercel (Project → Domains).
- `api.ouvidoria.exemplo.com.br` → Railway (Service → Networking → Custom Domain).
- Depois atualizar `NEXT_PUBLIC_API_URL`, `OUVIDORIA_API_URL` (Vercel) e
  `CORS_ORIGINS` (Railway).

---

## LGPD / privacidade

- HTTPS ponta a ponta (Vercel e Railway já fornecem).
- O áudio é enviado à OpenAI (EUA) e **não é armazenado** por esta aplicação.
  Isso precisa constar no aviso de privacidade. Pela política padrão da API, a
  OpenAI não usa esses dados para treinar modelos.
- O painel usa uma senha única compartilhada — suficiente para o lançamento;
  evoluir para login por usuário depois.
- `ACCESS_KEY` e `PAINEL_SENHA` devem ser longos e aleatórios (passo 0).
