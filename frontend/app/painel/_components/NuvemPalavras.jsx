"use client";

import { AnimatePresence, motion } from "motion/react";
import Card, { Vazio } from "./Card";
import { mola } from "./movimento";

const CORES = ["#14467C", "#047BC1", "#F7941D", "#2A9D8F"];

export default function NuvemPalavras({ dados, selecionada, onSelecionar }) {
  const max = dados[0]?.total ?? 1;
  const min = dados.at(-1)?.total ?? 1;
  const tamanho = (t) => 15 + (max === min ? 0.5 : (t - min) / (max - min)) * 29;

  return (
    <Card titulo="Nuvem de palavras" subtitulo="Clique em uma palavra para buscar relatos que a citam">
      {dados.length === 0 ? <Vazio /> : (
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-3">
          <AnimatePresence>
            {[...dados].sort((a, b) => a.palavra.localeCompare(b.palavra)).map((d, i) => {
              const ativa = selecionada === d.palavra;
              return (
                <motion.li key={d.palavra} layout transition={mola} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: selecionada && !ativa ? 0.4 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelecionar(d.palavra)}
                    aria-pressed={ativa}
                    title={`${d.total} ocorrências`}
                    className={`${ativa ? "bg-maceio-orange !text-white" : ""} rounded-lg px-1.5 font-extrabold leading-tight`}
                    style={{ fontSize: tamanho(d.total), color: CORES[(d.palavra.length + i) % CORES.length] }}
                  >
                    {d.palavra}
                  </motion.button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
