"use client";

import { AnimatePresence, motion } from "motion/react";
import Numero from "./Numero";
import { item } from "./movimento";

export default function Kpi({ rotulo, valor, detalhe, destaque = false, onClick, ativo = false }) {
  const Raiz = onClick ? motion.button : motion.div;
  const numerico = typeof valor === "number";

  return (
    <Raiz
      variants={item}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      aria-pressed={onClick ? ativo : undefined}
      className={`${destaque ? "bg-maceio-navy text-white" : "bg-white text-maceio-ink"} ${ativo ? "ring-4 ring-maceio-orange" : ""} rounded-2xl shadow-card p-5 text-left overflow-hidden relative`}
    >
      <p className={`text-sm font-semibold ${destaque ? "text-white/75" : "text-maceio-muted"}`}>{rotulo}</p>
      <div className="mt-1 text-3xl font-extrabold leading-tight break-words">
        {numerico ? (
          <Numero valor={valor} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={valor}
              className="block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
            >
              {valor}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
      <p className={`mt-1 text-sm min-h-5 ${destaque ? "text-white/70" : "text-maceio-muted"}`}>{detalhe}</p>
    </Raiz>
  );
}
