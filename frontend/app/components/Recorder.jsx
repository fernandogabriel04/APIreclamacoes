"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MUNICIPIOS_ALAGOAS, normalizarMunicipio } from "../lib/municipios";
import GravadorAudio from "./GravadorAudio";

const Recorder = () => {
  const [municipio, setMunicipio] = useState(null);
  const [bairro, setBairro] = useState("");
  const [etapaLocal, setEtapaLocal] = useState("carregando"); // carregando | confirmar | escolher | pronto
  const [sugestao, setSugestao] = useState(null);

  const definirMunicipio = useCallback((nome) => {
    setMunicipio(nome);
    try {
      localStorage.setItem("municipio", nome);
    } catch {}
    setEtapaLocal("pronto");
  }, []);

  const resolverMunicipioPorCoordenadas = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();
    const a = data.address || {};
    const bruto =
      a.city || a.town || a.municipality || a.village || a.county || null;
    return normalizarMunicipio(bruto);
  };

  useEffect(() => {
    let salvo = null;
    try {
      salvo = localStorage.getItem("municipio");
      setBairro(localStorage.getItem("bairro") || "");
    } catch {}
    if (salvo && MUNICIPIOS_ALAGOAS.includes(salvo)) {
      setMunicipio(salvo);
      setEtapaLocal("pronto");
      return;
    }
    if (!navigator.geolocation) {
      setEtapaLocal("escolher");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const encontrado = await resolverMunicipioPorCoordenadas(
            pos.coords.latitude,
            pos.coords.longitude
          );
          if (encontrado) {
            setSugestao(encontrado);
            setEtapaLocal("confirmar");
          } else {
            setEtapaLocal("escolher");
          }
        } catch {
          setEtapaLocal("escolher");
        }
      },
      () => setEtapaLocal("escolher"),
      { timeout: 10000 }
    );
  }, []);

  return (
    <section id="gravar" className="bg-azul-900 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <span className="inline-block -rotate-1 bg-amarelo px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-azul-900">
            Sua manifestação
          </span>
          <h2 className="titulo-cartaz mt-4 text-4xl text-white sm:text-5xl">
            Grave seu <span className="texto-vazado">áudio</span>
          </h2>
        </div>

        <div className="rounded-3xl border-4 border-amarelo bg-white p-6 shadow-bloco sm:p-8">
          {/* Bloco de localização */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Município (Alagoas)
            </p>

            {etapaLocal === "carregando" && (
              <p className="mt-2 animate-pulse font-semibold text-slate-500">
                Identificando sua localização…
              </p>
            )}

            {etapaLocal === "confirmar" && (
              <div className="mt-2">
                <p className="font-semibold text-azul-900">
                  Você está em <span className="text-laranja">{sugestao}</span>?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => definirMunicipio(sugestao)}
                    className="rounded-lg bg-azul-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-azul-500"
                  >
                    Sim, confirmar
                  </button>
                  <button
                    onClick={() => setEtapaLocal("escolher")}
                    className="rounded-lg border-2 border-azul-700 px-4 py-2 text-sm font-bold text-azul-700 transition hover:bg-azul-50"
                  >
                    Escolher outro
                  </button>
                </div>
              </div>
            )}

            {etapaLocal === "escolher" && (
              <select
                defaultValue=""
                onChange={(e) => e.target.value && definirMunicipio(e.target.value)}
                className="mt-2 w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 font-semibold text-azul-900 focus:border-azul-700 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione seu município
                </option>
                {MUNICIPIOS_ALAGOAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {etapaLocal === "pronto" && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-extrabold text-azul-900">
                  {municipio}
                  <span className="ml-2 text-sm font-semibold text-slate-400">
                    Alagoas
                  </span>
                </p>
                <button
                  onClick={() => setEtapaLocal("escolher")}
                  className="text-sm font-bold text-azul-700 underline underline-offset-2"
                >
                  trocar
                </button>
              </div>
            )}

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-500">
              Bairro / povoado
            </p>
            <input
              type="text"
              value={bairro}
              onChange={(e) => {
                setBairro(e.target.value);
                try {
                  localStorage.setItem("bairro", e.target.value);
                } catch {}
              }}
              placeholder="Ex.: Centro, Benedito Bentes, Povoado São José"
              maxLength={80}
              className="mt-2 w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 font-semibold text-azul-900 focus:border-azul-700 focus:outline-none"
            />
            <p className="mt-1 text-xs font-medium text-slate-400">
              O bairro, povoado ou distrito, dentro do município, a que se refere a manifestação.
            </p>
          </div>

          <GravadorAudio
            municipio={municipio}
            bairro={bairro.trim()}
            origem="Site"
            pronto={etapaLocal === "pronto" && !!bairro.trim()}
          />
        </div>
      </div>
    </section>
  );
};

export default Recorder;
