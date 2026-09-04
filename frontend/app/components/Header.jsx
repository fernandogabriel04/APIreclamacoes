import React from "react";
import MarcaOuvidoria from "./MarcaOuvidoria";

const Header = () => {
  return (
    <header className="w-full bg-azul-900 border-b-4 border-amarelo">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <MarcaOuvidoria className="h-11 w-11 shrink-0" />
          <div className="leading-none">
            <p className="titulo-cartaz text-xl text-amarelo sm:text-2xl">
              Ouvidoria <span className="text-white">JHC</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-azul-100 sm:text-xs">
              Alagoas · Ouvir o povo para governar
            </p>
          </div>
        </div>
        <a
          href="#gravar"
          className="hidden rounded-full bg-amarelo px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-azul-900 transition hover:bg-amarelo-400 sm:inline-block"
        >
          Gravar mensagem
        </a>
      </div>
    </header>
  );
};

export default Header;
