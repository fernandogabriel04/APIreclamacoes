# Ouvidoria JHC — Frontend

Canal de escuta para o povo de Alagoas falar diretamente com JHC, candidato a
Governador do Estado. O cidadão confirma seu **município** (dos 102 de Alagoas),
informa o **bairro / povoado**, grava um áudio de até 1 minuto e envia. O áudio
vai **direto para a API** (`app/APIREST.py`) por `multipart/form-data` — sem
hosts intermediários — e lá é transcrito (`gpt-4o-transcribe`) e classificado
(`gpt-4o-mini`, Structured Outputs) em `municipio` + `bairro` + categoria/resumo.

O gravador escolhe um formato real que o navegador suporta (WebM/Opus, MP4…) —
o `Content-Type` `audio/wav` fixo de antes gerava arquivos corrompidos.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS 3
- Fontes: Anton (display) + Barlow (texto), via `next/font`

## Design system

Extraído do material de campanha (`image.png`):

| Token | Valor | Uso |
| --- | --- | --- |
| `azul-900` | `#06215C` | fundo principal |
| `azul-700` | `#0C3AA0` | azul primário |
| `amarelo` | `#FFCC00` | destaques, títulos vazados |
| `laranja` | `#F26522` | chamada para ação, botão de gravar |

Utilitários em `styles/globals.css`: `.titulo-cartaz`, `.texto-vazado`,
`.faixa-cta`, `.legal-vertical`, `.corte-diagonal`.

## Rodando

```bash
cp .env.example .env.local   # ajuste NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Abra http://localhost:3000.

## Foto do candidato

O hero usa `public/jhc.png` como imagem de fundo (recorte vertical ~3:4).
Sem o arquivo, o bloco aparece com o fundo azul do design system.

## Municípios

`app/lib/municipios.js` lista os 102 municípios de Alagoas e deve espelhar
`MUNICIPIOS_ALAGOAS` em `app/APIREST.py`.

## Modo cabine física — `/cabine`

Para totens/cabines instalados presencialmente. Município, bairro e a
identificação da cabine vêm da URL:

```
/cabine?municipio=Arapiraca&bairro=Centro&cabine=Praça da Matriz
```

A tela mostra só gravar / reproduzir / regravar / enviar (sem seletores). A
`origem` gravada fica `Cabine <nome>`. A página recarrega 7s após o envio para
ficar pronta para a próxima pessoa.

A captação de áudio é compartilhada em `app/components/GravadorAudio.jsx` (usada
pela home e pela cabine).

## Painel de acompanhamento — `/painel`

Área restrita com KPIs, gráficos (por mês, por categoria, top municípios) e
tabela filtrável das manifestações recebidas.

- O navegador nunca fala direto com a API Python: `app/painel/dados/route.js`
  roda no servidor do Next, valida `PAINEL_SENHA` e busca
  `GET {OUVIDORIA_API_URL}/api/registros` enviando o header
  `X-Access-Key: {OUVIDORIA_ACCESS_KEY}` (= `ACCESS_KEY` do `app/.env`).
- Configure `OUVIDORIA_API_URL`, `OUVIDORIA_ACCESS_KEY` e `PAINEL_SENHA` no
  `.env.local` (veja `.env.example`).
