"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

export default function Numero({ valor, className }) {
  const mv = useMotionValue(0);
  const texto = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR"));

  useEffect(() => {
    const controle = animate(mv, valor, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controle.stop();
  }, [valor, mv]);

  return <motion.span className={className}>{texto}</motion.span>;
}
