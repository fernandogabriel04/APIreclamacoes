"use client";

import { motion } from "motion/react";
import { item } from "./movimento";

export default function Card({ titulo, subtitulo, acao, children, className = "" }) {
  return (
    <motion.section
      variants={item}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`bg-white rounded-2xl shadow-card p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-maceio-navy">{titulo}</h2>
          {subtitulo && <p className="text-sm text-maceio-muted">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

export function Vazio() {
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-maceio-muted">
      Sem dados para os filtros selecionados.
    </motion.p>
  );
}
