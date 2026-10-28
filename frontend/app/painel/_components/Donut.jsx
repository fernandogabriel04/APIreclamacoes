"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import Numero from "./Numero";
import { mola, molaSuave } from "./movimento";

const R = 70;
const C = 2 * Math.PI * R;

export default function Donut({ dados, selecionado, onSelecionar, cor, subcategorias, subSelecionada, onSubcategoria }) {
  const [foco, setFoco] = useState(null);
  const total = dados.reduce((s, d) => s + d.total, 0);
  const emDestaque = foco ?? selecionado;
  const itemDestaque = dados.find((d) => d.nome === emDestaque);
  const subMax = subcategorias[0]?.total ?? 1;
  let acumulado = 0;

  return (
    <Card titulo="Feedback por categoria" subtitulo="Clique em uma categoria para filtrar todo o painel">
      {total === 0 ? <Vazio /> : (
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] items-center">
          <div className="relative mx-auto h-52 w-52">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="group" aria-label="Rosca por categoria">
              <circle cx="100" cy="100" r={R} fill="none" stroke="#EAF3FB" strokeWidth="32" />
              {dados.map((d) => {
                const parte = (d.total / total) * C;
                const traco = Math.max(0, parte - (dados.length > 1 ? 3 : 0));
                const deslocamento = -acumulado;
                acumulado += parte;
                const ativo = emDestaque === d.nome;
                return (
                  <motion.circle
                    key={d.nome}
                    cx="100" cy="100" r={R} fill="none" stroke={cor(d.nome)}
                    role="button" tabIndex={0} aria-pressed={selecionado === d.nome}
                    aria-label={`${d.nome}: ${d.total} relatos`}
                    initial={{ strokeDasharray: `0 ${C}`, strokeDashoffset: deslocamento, strokeWidth: 32 }}
                    animate={{
                      strokeDasharray: `${traco} ${C - traco}`,
                      strokeDashoffset: deslocamento,
                      strokeWidth: ativo ? 40 : 32,
                      opacity: emDestaque && !ativo ? 0.3 : 1,
                    }}
                    transition={molaSuave}
                    className="cursor-pointer"
                    onMouseEnter={() => setFoco(d.nome)}
                    onMouseLeave={() => setFoco(null)}
                    onFocus={() => setFoco(d.nome)}
                    onBlur={() => setFoco(null)}
                    onClick={() => onSelecionar(d.nome)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelecionar(d.nome))}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={emDestaque ?? "todos"}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-bold text-maceio-muted leading-tight"
                >
                  {emDestaque ?? "Total"}
                </motion.p>
              </AnimatePresence>
              <Numero valor={itemDestaque?.total ?? total} className="text-4xl font-extrabold text-maceio-navy" />
              {itemDestaque && <p className="text-xs font-semibold text-maceio-muted">{Math.round((itemDestaque.total / total) * 100)}%</p>}
            </div>
          </div>

          <ul className="space-y-1.5">
            {dados.map((d) => {
              const ativo = selecionado === d.nome;
              return (
                <motion.li layout transition={mola} key={d.nome}>
                  <button
                    onClick={() => onSelecionar(d.nome)}
                    onMouseEnter={() => setFoco(d.nome)}
                    onMouseLeave={() => setFoco(null)}
                    aria-pressed={ativo}
                    className={`${ativo ? "bg-maceio-sky" : "hover:bg-maceio-mist"} w-full rounded-xl px-3 py-2 text-left transition-colors`}
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: cor(d.nome) }} aria-hidden />
                      <span className="flex-1 font-bold">{d.nome}</span>
                      <span className="tabular-nums text-maceio-muted">{d.total} · {Math.round((d.total / total) * 100)}%</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-maceio-line/60">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: cor(d.nome) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.total / dados[0].total) * 100}%` }}
                        transition={molaSuave}
                      />
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}

      <AnimatePresence initial={false}>
        {selecionado && subcategorias.length > 0 && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={mola}
            className="overflow-hidden"
          >
            <div className="mt-5 border-t border-maceio-line pt-4">
              <p className="text-sm font-extrabold text-maceio-navy">Subcategorias de {selecionado}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {subcategorias.map((s) => {
                  const ativo = subSelecionada === s.nome;
                  return (
                    <motion.li key={s.nome} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <button
                        onClick={() => onSubcategoria(s.nome)}
                        aria-pressed={ativo}
                        className={`${ativo ? "bg-maceio-navy text-white" : "bg-maceio-sky text-maceio-navy hover:bg-maceio-line"} relative overflow-hidden rounded-full px-3 py-1.5 text-sm font-bold transition-colors`}
                      >
                        {s.nome} <span className="opacity-70">· {s.total}</span>
                        <span className="absolute bottom-0 left-0 h-0.5 bg-maceio-orange" style={{ width: `${(s.total / subMax) * 100}%` }} />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
