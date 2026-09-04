import React from "react";
import MarcaOuvidoria from "./MarcaOuvidoria";

const Footer = () => {
  return (
    <footer className="bg-azul-950 text-azul-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MarcaOuvidoria className="h-10 w-10" />
            <div>
              <p className="titulo-cartaz text-lg text-amarelo">
                Ouvidoria <span className="text-white">JHC</span>
              </p>
              <p className="text-xs uppercase tracking-[0.18em]">
                Alagoas · Ouvir o povo para governar
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-azul-300">
            Canal de escuta da campanha de JHC ao Governo de Alagoas. As
            manifestações são registradas e encaminhadas à equipe. Este canal não
            substitui os serviços de emergência (190, 192, 193).
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-white/10 pt-5 text-xs text-azul-300 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Ouvidoria JHC. Todos os direitos reservados.</p>
          <p>Desenvolvido por FGC Desenvolvimento e Tecnologia</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
