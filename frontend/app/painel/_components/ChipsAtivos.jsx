"use client";

import { AnimatePresence, motion } from "motion/react";
import Numero from "./Numero";
import { mola } from "./movimento";
import { rotuloMes } from "../../../lib/analise";

const ROTULOS = { ano: "Ano", origem: "Origem", categoria: "Categoria", subcategoria: "Subcategoria", bairro: "Bairro", mes: "Mês", q: "Busca" };

export default function ChipsAtivos({ filtros, mostrando, total, onRemover, onLimpar }) {
  const ativos = Object.entries(filtros).filter(([, v]) => v);

  return (
    <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-2xl bg-white/85 px-4 py-3 shadow-card backdrop-blur">
      <p className="text-sm font-bold text-maceio-navy">
        Mostrando <Numero valor={mostrando} /> de {total} relatos
      </p>
      <AnimatePresence mode="popLayout">
        {ativos.map(([campo, valor]) => (
          <motion.button
            key={campo} layout transition={mola}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onRemover(campo)}
            aria-label={`Remover filtro ${ROTULOS[campo]}: ${valor}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-maceio-navy px-3 py-1 text-sm font-bold text-white"
          >
            <span className="text-white/70">{ROTULOS[campo]}:</span> {campo === "mes" ? rotuloMes(valor, false) : valor}
            <span aria-hidden className="ml-0.5 text-maceio-orange">✕</span>
          </motion.button>
        ))}
        {ativos.length > 1 && (
          <motion.button
            key="limpar" layout transition={mola}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onLimpar} className="text-sm font-bold text-maceio-blue hover:underline"
          >
            Limpar tudo
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
