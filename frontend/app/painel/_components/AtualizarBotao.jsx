"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { atualizarDados } from "../actions";

export default function AtualizarBotao() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
      disabled={pendente}
      onClick={() => iniciar(async () => { await atualizarDados(); router.refresh(); })}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-maceio-line bg-white px-3 py-1.5 text-sm font-bold text-maceio-navy hover:bg-maceio-sky disabled:opacity-60"
    >
      <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        animate={{ rotate: pendente ? 360 : 0 }} transition={pendente ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }} aria-hidden>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
      </motion.svg>
      {pendente ? "Atualizando…" : "Atualizar dados"}
    </motion.button>
  );
}
