import { readFileSync, writeFileSync } from "node:fs";

const ORIGEM = new URL("../data/glossario-maceio.csv", import.meta.url);
const DESTINO = new URL("../lib/server/glossario-dados.js", import.meta.url);

const lerCsv = (texto) => {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some((v) => v.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
};

const [, ...linhas] = lerCsv(readFileSync(ORIGEM, "utf8").replace(/^﻿/, ""));
const entradas = linhas.map(([categoria, termo, oficial, sinonimo, descricao]) => ({
  categoria: categoria.trim(),
  termo: termo.trim(),
  oficial: oficial.trim(),
  sinonimo: sinonimo.trim(),
  descricao: descricao.trim(),
}));

writeFileSync(
  DESTINO,
  `// Gerado por scripts/gerar-glossario.mjs a partir de data/glossario-maceio.csv. Não edite à mão.\nexport const GLOSSARIO = ${JSON.stringify(entradas, null, 2)};\n`,
);
console.log(`${entradas.length} termos gravados em lib/server/glossario-dados.js`);
