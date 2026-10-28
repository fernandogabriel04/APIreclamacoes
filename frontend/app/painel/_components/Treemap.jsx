"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import { molaSuave } from "./movimento";
import { layoutTreemap } from "../../../lib/analise";

export default function Treemap({ dados, selecionado, onSelecionar }) {
  const [foco, setFoco] = useState(null);
  const celulas = useMemo(() => layoutTreemap(dados), [dados]);
  const max = dados[0]?.total ?? 1;

  return (
    <Card titulo="Feedback por bairro" subtitulo="Quanto maior o bloco, mais relatos. Clique para filtrar.">
      {dados.length === 0 ? <Vazio /> : (
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-maceio-sky">
          <AnimatePresence>
            {celulas.map((c) => {
              const ativo = selecionado === c.nome;
              const tom = 0.3 + 0.7 * (c.total / max);
              return (
                <motion.button
                  key={c.nome}
                  onClick={() => onSelecionar(c.nome)}
                  onMouseEnter={() => setFoco(c.nome)}
                  onMouseLeave={() => setFoco(null)}
                  onFocus={() => setFoco(c.nome)}
                  onBlur={() => setFoco(null)}
                  aria-pressed={ativo}
                  aria-label={`${c.nome}: ${c.total} relatos`}
                  initial={{ opacity: 0, left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%` }}
                  animate={{
                    left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%`,
                    opacity: selecionado && !ativo ? 0.4 : 1,
                    backgroundColor: ativo ? "#F7941D" : foco === c.nome ? "#047BC1" : `rgba(20, 70, 124, ${tom.toFixed(2)})`,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={molaSuave}
                  className="absolute overflow-hidden border-2 border-white p-2 text-left text-white"
                  style={{ zIndex: ativo || foco === c.nome ? 2 : 1 }}
                >
                  <span className="block truncate text-xs font-extrabold leading-tight">{c.nome}</span>
                  <span className="block text-xs tabular-nums text-white/85">{c.total}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
