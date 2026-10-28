"use client";

import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import Numero from "./Numero";
import { mola, molaSuave } from "./movimento";

export default function TopBairros({ dados, selecionado, onSelecionar }) {
  const top = dados.slice(0, 5);
  const max = top[0]?.total ?? 1;

  return (
    <Card titulo="Top 5 bairros" subtitulo="Onde mais se fala. Clique para filtrar.">
      {top.length === 0 ? <Vazio /> : (
        <ol className="space-y-2">
          <AnimatePresence mode="popLayout">
            {top.map((d, i) => {
              const ativo = selecionado === d.nome;
              return (
                <motion.li key={d.nome} layout transition={mola} initial={{ opacity: 0, x: -16 }} animate={{ opacity: selecionado && !ativo ? 0.45 : 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <button
                    onClick={() => onSelecionar(d.nome)}
                    aria-pressed={ativo}
                    className={`${ativo ? "bg-orange-50" : "hover:bg-maceio-mist"} w-full rounded-xl px-3 py-2 text-left transition-colors`}
                  >
                    <span className="flex justify-between text-sm font-bold">
                      <span><span className="text-maceio-orange">{i + 1}.</span> {d.nome}</span>
                      <Numero valor={d.total} className="tabular-nums" />
                    </span>
                    <span className="mt-1.5 block h-3 rounded-full bg-maceio-sky">
                      <motion.span
                        className="block h-full rounded-full bg-maceio-orange"
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.total / max) * 100}%` }}
                        transition={molaSuave}
                      />
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </Card>
  );
}
