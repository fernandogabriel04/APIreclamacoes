import React from "react";

// Marca do projeto: número 45 (fonte de campanha, itálico) sobre fundo laranja
const MarcaOuvidoria = ({ className = "h-10 w-10" }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    role="img"
    aria-label="Ouvidoria JHC — 45"
  >
    <circle
      cx="24"
      cy="24"
      r="23"
      fill="#F26522"
      stroke="#06215C"
      strokeWidth="2"
    />
    <text
      x="23"
      y="25"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="21"
      letterSpacing="-1"
      textLength="24"
      lengthAdjust="spacingAndGlyphs"
      fill="#FFFFFF"
      style={{
        fontFamily: "var(--font-display), 'Arial Black', sans-serif",
        fontStyle: "italic",
        fontWeight: 400,
      }}
    >
      45
    </text>
  </svg>
);

export default MarcaOuvidoria;
