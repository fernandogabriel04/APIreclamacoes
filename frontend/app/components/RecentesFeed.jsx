"use client";

import React, { useEffect, useState } from "react";

const POR_TELA = 4;
const TROCA_MS = 7000;
const ATUALIZA_MS = 60000;

function tempoRelativo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export default function RecentesFeed() {
  const [todas, setTodas] = useState([]);
  const [inicio, setInicio] = useState(0);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    let ativo = true;
    const url = (() => {
      try {
        return new URL("/api/manifestacoes-recentes", process.env.NEXT_PUBLIC_API_URL).toString();
      } catch {
        return null;
      }
    })();
    if (!url) return;

    const buscar = () =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (ativo && Array.isArray(d)) setTodas(d);
        })
        .catch(() => {});

    buscar();
    const t = setInterval(buscar, ATUALIZA_MS);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (todas.length <= POR_TELA) return;
    const t = setInterval(() => {
      setVisivel(false);
      setTimeout(() => {
        setInicio((i) => (i + POR_TELA) % todas.length);
        setVisivel(true);
      }, 320);
    }, TROCA_MS);
    return () => clearInterval(t);
  }, [todas.length]);

  if (todas.length === 0) return null;

  const janela = Array.from(
    { length: Math.min(POR_TELA, todas.length) },
    (_, k) => todas[(inicio + k) % todas.length]
  );

  return (
    <section aria-label="Manifestações recebidas" className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amarelo" />
        <h2 className="titulo-cartaz text-xl text-amarelo">O povo já está falando</h2>
      </div>

      <div
        className={`flex flex-col gap-3 transition-opacity duration-300 ${
          visivel ? "opacity-100" : "opacity-0"
        }`}
      >
        {janela.map((m, i) => (
          <article
            key={`${inicio}-${i}`}
            className="rounded-2xl border-l-4 border-laranja bg-white/95 p-4 shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-azul-50 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-azul-700">
                {m.categoria}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {tempoRelativo(m.data_hora)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm font-medium leading-snug text-slate-700">
              “{m.resumo}”
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-laranja">
              {m.municipio}
              {m.bairro ? ` · ${m.bairro}` : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
