export const mola = { type: "spring", stiffness: 260, damping: 28 };
export const molaSuave = { type: "spring", stiffness: 140, damping: 22 };

export const container = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const item = {
  oculto: { opacity: 0, y: 18 },
  visivel: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 24 } },
};
