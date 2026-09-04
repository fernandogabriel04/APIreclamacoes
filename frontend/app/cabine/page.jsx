"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarcaOuvidoria from "../components/MarcaOuvidoria";
import GravadorAudio from "../components/GravadorAudio";
import RecentesFeed from "../components/RecentesFeed";
import { normalizarMunicipio } from "../lib/municipios";

/**
 * Modo cabine física. O município, o bairro e a identificação da cabine vêm da URL:
 *   /cabine?municipio=Arapiraca&bairro=Centro&cabine=Praça da Matriz
 * A tela mostra só: gravar, reproduzir, regravar e enviar.
 */
function CabineInterna() {
  const params = useSearchParams();
  const municipio = normalizarMunicipio(params.get("municipio") || "");
  const bairro = (params.get("bairro") || "").trim();
  const cabine = (params.get("cabine") || "").trim();

  const configurada = municipio && cabine;

  if (!configurada) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-azul-900 px-6 text-center">
        <MarcaOuvidoria className="h-14 w-14" />
        <h1 className="titulo-cartaz text-3xl text-amarelo">Cabine não configurada</h1>
        <p className="max-w-md font-medium text-azul-50/90">
          O endereço precisa dos parâmetros <code className="text-amarelo">municipio</code> e{" "}
          <code className="text-amarelo">cabine</code> (e opcionalmente{" "}
          <code className="text-amarelo">bairro</code>). Ex.:
        </p>
        <p className="rounded-lg bg-azul-950 px-4 py-2 text-sm text-azul-100">
          /cabine?municipio=Arapiraca&amp;bairro=Centro&amp;cabine=Praça da Matriz
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-azul-900">
      <header className="flex items-center gap-3 border-b-4 border-amarelo px-5 py-4">
        <MarcaOuvidoria className="h-11 w-11 shrink-0" />
        <div className="leading-tight">
          <p className="titulo-cartaz text-xl text-amarelo">
            Ouvidoria <span className="text-white">JHC</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-azul-100">
            Cabine {cabine} · {municipio}
            {bairro ? ` · ${bairro}` : ""}
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        {/* Coluna da ação */}
        <div className="w-full">
          <h1 className="titulo-cartaz text-4xl leading-[0.95] text-white sm:text-5xl">
            O que você quer em
            <span className="texto-vazado mt-1 block text-5xl sm:text-6xl">
              Toda Alagoas?
            </span>
          </h1>
          <p className="mt-4 font-medium text-azul-50/90">
            Toque em <span className="font-extrabold text-amarelo">Gravar</span> e conte, em até
            1 minuto, o que você espera para {municipio} e para o estado.
          </p>

          <div className="mt-8 rounded-3xl border-4 border-amarelo bg-white p-6 shadow-bloco sm:p-8">
            <GravadorAudio
              municipio={municipio}
              bairro={bairro}
              origem={`Cabine ${cabine}`}
              tamanho="lg"
              onEnviado={() => setTimeout(() => window.location.reload(), 7000)}
            />
          </div>

          <p className="mt-6 text-xs font-medium text-azul-300">
            Canal de escuta da campanha. Não substitui os serviços de emergência (190, 192, 193).
          </p>
        </div>

        {/* Mural das manifestações recebidas */}
        <aside className="w-full">
          <RecentesFeed />
        </aside>
      </div>
    </main>
  );
}

export default function CabinePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-azul-900" />}>
      <CabineInterna />
    </Suspense>
  );
}
