"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import { buscarTranscricao } from "../actions";
import { dataBR } from "../../../lib/analise";
import { mola } from "./movimento";

const POR_PAGINA = 10;

function Transcricao({ id }) {
  const [texto, setTexto] = useState(null);

  useEffect(() => {
    let vivo = true;
    buscarTranscricao(id).then((t) => vivo && setTexto(t));
    return () => { vivo = false; };
  }, [id]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      transition={mola} className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl bg-maceio-sky p-3 text-maceio-ink">
        <p className="text-xs font-extrabold uppercase tracking-wide text-maceio-blue">O que o cidadão disse</p>
        {texto === null ? (
          <div className="mt-2 space-y-2" aria-busy="true">
            {[100, 90, 60].map((w) => (
              <motion.div key={w} className="h-3 rounded bg-maceio-line" style={{ width: `${w}%` }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />
            ))}
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap">{texto || "Transcrição indisponível."}</p>
        )}
      </div>
    </motion.div>
  );
}

function Chip({ children, ativo, onClick, tom = "sky" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      onClick={onClick} aria-pressed={ativo}
      className={`${ativo ? "bg-maceio-orange text-white" : tom === "sky" ? "bg-maceio-sky text-maceio-navy" : "bg-maceio-mist text-maceio-muted"} rounded-full px-2.5 py-1 text-xs font-bold`}
    >
      {children}
    </motion.button>
  );
}

export default function Tabela({ linhas, filtros, onFiltro }) {
  const [pagina, setPagina] = useState(1);
  const [abertos, setAbertos] = useState(() => new Set());

  useEffect(() => setPagina(1), [linhas]);

  const paginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const atual = Math.min(pagina, paginas);
  const visiveis = linhas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);

  const alternar = (id) =>
    setAbertos((s) => {
      const novo = new Set(s);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });

  return (
    <Card titulo="Relatos recebidos" subtitulo={`${linhas.length} resultado(s). Clique nas etiquetas para filtrar e abra a linha para ver a fala original.`}>
      {linhas.length === 0 ? <Vazio /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-maceio-line text-maceio-navy">
                  {["#", "Data", "Categoria", "Bairro", "Resumo", "Telefone"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 font-extrabold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout" initial={false}>
                  {visiveis.map((r, i) => (
                    <motion.tr
                      key={r.id} layout
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ ...mola, delay: i * 0.025 }}
                      className="border-b border-maceio-line align-top hover:bg-maceio-mist"
                    >
                      <td className="px-3 py-3 tabular-nums text-maceio-muted">{r.id}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{dataBR(r.data_hora)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Chip ativo={filtros.categoria === r.categoria} onClick={() => onFiltro("categoria", r.categoria)}>{r.categoria}</Chip>
                          <Chip tom="mist" ativo={filtros.subcategoria === r.subcategoria} onClick={() => onFiltro("subcategoria", r.subcategoria)}>{r.subcategoria}</Chip>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Chip ativo={filtros.bairro === r.bairro} onClick={() => onFiltro("bairro", r.bairro)}>{r.bairro}</Chip>
                      </td>
                      <td className="px-3 py-3 max-w-md">
                        <p>{r.resumo}</p>
                        <button onClick={() => alternar(r.id)} aria-expanded={abertos.has(r.id)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-maceio-blue hover:underline">
                          <motion.span animate={{ rotate: abertos.has(r.id) ? 90 : 0 }} className="inline-block">▸</motion.span>
                          {abertos.has(r.id) ? "Ocultar transcrição" : "Ver transcrição original"}
                        </button>
                        <AnimatePresence initial={false}>{abertos.has(r.id) && <Transcricao id={r.id} />}</AnimatePresence>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{r.telefone || "-"}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <nav className="mt-4 flex items-center justify-between text-sm font-bold" aria-label="Paginação">
            <button onClick={() => setPagina(atual - 1)} disabled={atual === 1} className="rounded-lg px-3 py-1.5 text-maceio-blue hover:bg-maceio-sky disabled:opacity-30 disabled:hover:bg-transparent">← Anterior</button>
            <span className="text-maceio-muted">Página {atual} de {paginas}</span>
            <button onClick={() => setPagina(atual + 1)} disabled={atual === paginas} className="rounded-lg px-3 py-1.5 text-maceio-blue hover:bg-maceio-sky disabled:opacity-30 disabled:hover:bg-transparent">Próxima →</button>
          </nav>
        </>
      )}
    </Card>
  );
}
