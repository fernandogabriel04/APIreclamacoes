"use client";

import React, { useState } from "react";

// Mostra public/jhc.png quando existir; caso contrário, fica a silhueta do design system.
const FotoCandidato = () => {
  const [temFoto, setTemFoto] = useState(true);

  return (
    <div
      className="absolute inset-0 flex items-end justify-center overflow-hidden rotate-1 rounded-2xl border-4 border-white bg-azul-700 shadow-bloco"
      role="img"
      aria-label="JHC, candidato a Governador de Alagoas"
    >
      <svg
        viewBox="0 0 120 160"
        className="h-[88%] w-auto text-azul-500/60"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="58" cy="34" r="20" />
        <path d="M24 160c0-24 15-44 34-44s34 20 34 44z" />
        <path d="M80 92l7-32 12 4-9 36z" />
        <circle cx="92" cy="50" r="7" />
      </svg>
      {temFoto && (
        <img
          src="/jhc.png"
          alt=""
          onError={() => setTemFoto(false)}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
    </div>
  );
};

export default FotoCandidato;
