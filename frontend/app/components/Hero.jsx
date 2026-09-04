import React from "react";
import FotoCandidato from "./FotoCandidato";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-azul-900 corte-diagonal">
      {/* Texto legal girado na lateral, como no material de campanha */}
      <p className="legal-vertical absolute left-2 top-20 hidden max-h-[70%] text-[10px] font-semibold uppercase tracking-widest text-azul-300/70 xl:block">
        Canal de escuta da campanha de JHC ao Governo de Alagoas
      </p>

      {/* Blocos de cor de fundo */}
      <div className="pointer-events-none absolute -right-24 top-0 h-full w-2/3 bg-azul-700/50 [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-24 w-full faixa-cta opacity-90" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-12 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-16">
        {/* Coluna do texto */}
        <div>
          <span className="inline-block -rotate-1 bg-amarelo px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-azul-900">
            Ouvidoria do Povo
          </span>

          <h1 className="titulo-cartaz mt-5 text-white">
            <span className="block text-3xl sm:text-4xl">A sua voz</span>
            <span className="texto-vazado block text-6xl sm:text-7xl lg:text-8xl">
              constrói
            </span>
            <span className="block text-4xl text-amarelo sm:text-5xl lg:text-6xl">
              Alagoas
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg font-medium text-azul-50/90">
            JHC quer ouvir você. Conte, em até 1 minuto de áudio, o que o seu
            município precisa e o que você espera do próximo governo do estado.
          </p>

          <a
            href="#gravar"
            className="faixa-cta mt-8 inline-flex -rotate-1 items-center gap-3 rounded-xl px-6 py-4 text-lg font-extrabold uppercase tracking-wide"
          >
            Grave sua mensagem para o JHC
            <span aria-hidden="true" className="text-2xl">↓</span>
          </a>
        </div>

        {/* Coluna da foto */}
        <figure className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <div className="absolute inset-0 -rotate-2 rounded-2xl bg-amarelo" />
          <FotoCandidato />
          <figcaption className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-azul-900 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-amarelo ring-2 ring-amarelo">
            JHC · Governador
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

export default Hero;
