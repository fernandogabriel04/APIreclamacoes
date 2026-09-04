"use client";

import React, { useMemo } from "react";

// Palavras sem valor analítico (artigos, preposições, verbos genéricos, ruído do domínio)
const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "por", "para", "pra", "com", "sem", "sob", "sobre",
  "e", "ou", "que", "se", "nao", "sim", "ao", "aos", "pelo", "pela", "pelos", "pelas",
  "este", "esta", "isto", "esse", "essa", "isso", "aquele", "aquela", "aquilo",
  "seu", "sua", "seus", "suas", "meu", "minha", "dele", "dela", "deles", "delas",
  "como", "mais", "menos", "muito", "muita", "muitos", "muitas", "jah", "ainda",
  "tambem", "entre", "ateh", "apos", "antes", "depois", "onde", "quando", "quem",
  "qual", "quais", "cada", "todo", "toda", "todos", "todas", "algum", "alguma",
  "alguns", "algumas", "nenhum", "nenhuma", "ser", "estar", "ter", "haver", "foi",
  "sao", "esta", "estao", "tem", "tinha", "havia", "era", "eram", "sendo", "feito",
  "feita", "mesmo", "mesma", "assim", "entao", "porque", "pois", "mas", "porem",
  "contudo", "embora", "las", "los", "lhe", "lhes",
  // ruído recorrente das manifestações
  "morador", "moradores", "municipe", "municipes", "relata", "relatam", "solicita",
  "solicitam", "pede", "pedem", "informa", "conta", "causando", "gerando", "afeta",
  "afetando", "prejudicando", "dias", "semanas", "meses", "anos", "vez", "vezes",
  "area", "areas", "local", "locais", "parte", "trecho", "frente", "lado", "forma",
  "situacao", "problema", "problemas", "questao", "caso", "ponto", "coisa",
  "buscar", "conseguir", "chegar", "ficar", "fazer",
]);

const semAcento = (s) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function extrairPalavras(registros) {
  const contagem = new Map(); // chave normalizada -> { termo, total }
  for (const r of registros) {
    const texto = `${r.resumo || ""} ${r.tema || ""}`;
    const tokens = texto.match(/[\p{L}]+/gu) || [];
    for (const bruto of tokens) {
      const chave = semAcento(bruto);
      if (chave.length < 4) continue;
      if (STOPWORDS.has(chave)) continue;
      const atual = contagem.get(chave);
      if (atual) atual.total += 1;
      else contagem.set(chave, { termo: bruto.toLowerCase(), total: 1 });
    }
  }

  const ordenadas = [...contagem.values()]
    .filter((p) => p.total >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 45);

  // ordem "embaralhada" determinística para o visual de nuvem
  const nuvem = ordenadas
    .map((p, i) => ({ p, k: ((i * 2654435761) % 4294967296) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.p);

  return { ordenadas, nuvem };
}

export default function NuvemPalavras({ registros }) {
  const { ordenadas, nuvem } = useMemo(
    () => extrairPalavras(registros),
    [registros]
  );

  if (ordenadas.length === 0) {
    return (
      <p className="text-sm font-semibold text-slate-400">
        Sem texto suficiente para gerar a nuvem de palavras.
      </p>
    );
  }

  const max = ordenadas[0].total;
  const min = ordenadas[ordenadas.length - 1].total;
  const tamanho = (t) =>
    max === min ? 24 : 14 + ((t - min) / (max - min)) * 30; // 14px .. 44px
  const limiteForte = min + (max - min) * 0.6;

  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 py-2">
      {nuvem.map((p, i) => (
        <span
          key={p.termo}
          title={`${p.total} ocorrência${p.total === 1 ? "" : "s"}`}
          className={`titulo-cartaz leading-tight ${
            p.total >= limiteForte
              ? "text-laranja"
              : i % 3 === 0
              ? "text-azul-500"
              : "text-azul-900"
          }`}
          style={{ fontSize: `${tamanho(p.total).toFixed(1)}px` }}
        >
          {p.termo}
        </span>
      ))}
    </div>
  );
}
