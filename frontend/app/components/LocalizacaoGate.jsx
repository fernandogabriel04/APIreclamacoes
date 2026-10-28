"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BAIRROS, bairroPorNome, slugify } from "../../lib/bairros";

const buscarBairro = async (latitude, longitude) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16&accept-language=pt-BR`;
  const res = await fetch(url);
  const { address = {} } = await res.json();
  return bairroPorNome(address.suburb) ?? bairroPorNome(address.neighbourhood) ?? bairroPorNome(address.city_district);
};

export default function LocalizacaoGate() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("detectando"); // detectando | confirmar | escolher
  const [detectado, setDetectado] = useState(null);
  const [aviso, setAviso] = useState("");
  const [navegando, setNavegando] = useState(false);
  const jaTentou = useRef(false);

  const irParaRelato = (bairro) => {
    setNavegando(true);
    try { localStorage.setItem("bairro", bairro); } catch {}
    router.push(`/relato/${slugify(bairro)}`);
  };

  const detectar = () => {
    setEtapa("detectando");
    setAviso("");
    if (!navigator.geolocation) {
      setAviso("Seu navegador não permite localização. Escolha o bairro abaixo.");
      setEtapa("escolher");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const bairro = await buscarBairro(coords.latitude, coords.longitude);
          if (bairro) {
            setDetectado(bairro);
            setEtapa("confirmar");
          } else {
            setAviso("Não conseguimos identificar um bairro de Maceió pela sua localização.");
            setEtapa("escolher");
          }
        } catch {
          setAviso("Não foi possível consultar sua localização agora.");
          setEtapa("escolher");
        }
      },
      () => {
        setAviso("Sem acesso à localização. Escolha o bairro onde você está.");
        setEtapa("escolher");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    if (jaTentou.current) return;
    jaTentou.current = true;
    detectar();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 w-full max-w-lg text-maceio-ink" aria-live="polite">
      {etapa === "detectando" && (
        <div className="flex items-center gap-4 py-4">
          <span className="h-6 w-6 rounded-full border-4 border-maceio-sky border-t-maceio-blue animate-spin" aria-hidden />
          <div>
            <p className="font-bold text-maceio-navy">Identificando onde você está…</p>
            <p className="text-sm text-maceio-muted">Autorize a localização no navegador.</p>
          </div>
        </div>
      )}

      {etapa === "confirmar" && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-maceio-blue">Localização encontrada</p>
          <p className="mt-1 text-2xl font-extrabold text-maceio-navy">Você está em {detectado}?</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => irParaRelato(detectado)}
              disabled={navegando}
              className="flex-1 rounded-xl bg-maceio-navy px-5 py-3.5 font-bold text-white hover:bg-maceio-deep transition disabled:opacity-60"
            >
              Sim, continuar
            </button>
            <button
              onClick={() => setEtapa("escolher")}
              className="flex-1 rounded-xl border-2 border-maceio-line px-5 py-3.5 font-bold text-maceio-navy hover:bg-maceio-sky transition"
            >
              Escolher outro bairro
            </button>
          </div>
        </div>
      )}

      {etapa === "escolher" && (
        <div>
          <p className="text-xl font-extrabold text-maceio-navy">Em qual bairro de Maceió você está?</p>
          {aviso && <p className="mt-2 text-sm text-maceio-muted">{aviso}</p>}
          <label htmlFor="bairro" className="sr-only">Bairro</label>
          <select
            id="bairro"
            defaultValue=""
            disabled={navegando}
            onChange={(e) => e.target.value && irParaRelato(e.target.value)}
            className="mt-5 w-full rounded-xl border-2 border-maceio-line bg-white px-4 py-3.5 text-base font-semibold text-maceio-ink focus:border-maceio-blue"
          >
            <option value="" disabled>Selecione o bairro…</option>
            {BAIRROS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={detectar} className="mt-4 text-sm font-bold text-maceio-blue hover:underline">
            Tentar usar minha localização
          </button>
        </div>
      )}
    </div>
  );
}
