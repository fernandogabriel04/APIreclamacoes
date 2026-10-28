"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import { molaSuave } from "./movimento";
import { rotuloMes } from "../../../lib/analise";

const ALTURA = 170;

export default function BarrasMensais({ dados, selecionado, onSelecionar }) {
  const [foco, setFoco] = useState(null);
  const max = Math.max(1, ...dados.map((d) => d.total));

  return (
    <Card titulo="Feedback por mês" subtitulo="Clique em uma barra para filtrar o mês">
      {dados.length === 0 ? <Vazio /> : (
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-end gap-2 px-1" style={{ height: ALTURA + 56 }}>
            {dados.map((d) => {
              const ativo = selecionado === d.mes;
              const esmaecido = selecionado && !ativo;
              return (
                <button
                  key={d.mes}
                  onClick={() => onSelecionar(d.mes)}
                  onMouseEnter={() => setFoco(d.mes)}
                  onMouseLeave={() => setFoco(null)}
                  onFocus={() => setFoco(d.mes)}
                  onBlur={() => setFoco(null)}
                  aria-pressed={ativo}
                  aria-label={`${rotuloMes(d.mes, false)}: ${d.total} relatos`}
                  className="group flex w-14 flex-col items-center justify-end gap-1.5 rounded-lg"
                >
                  <span className="relative h-5 w-full text-center">
                    <AnimatePresence>
                      {(foco === d.mes || ativo || dados.length <= 8) && (
                        <motion.span
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                          className="absolute inset-x-0 bottom-0 text-sm font-extrabold text-maceio-ink tabular-nums"
                        >
                          {d.total}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <motion.span
                    className="block w-9 rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{
                      height: Math.max(4, (d.total / max) * ALTURA),
                      backgroundColor: ativo ? "#F7941D" : foco === d.mes ? "#14467C" : "#047BC1",
                      opacity: esmaecido ? 0.35 : 1,
                    }}
                    whileTap={{ scaleY: 0.96 }}
                    transition={molaSuave}
                    style={{ originY: 1 }}
                  />
                  <span className={`${ativo ? "text-maceio-orange" : "text-maceio-muted"} text-xs font-bold`}>{rotuloMes(d.mes)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
