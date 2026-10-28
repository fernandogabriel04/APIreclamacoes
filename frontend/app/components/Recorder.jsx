"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LIMITE_SEGUNDOS = 60;

const formatar = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Recorder({ bairro }) {
  const [fase, setFase] = useState("pronto"); // pronto | gravando | revisar | enviando | enviado
  const [segundos, setSegundos] = useState(0);
  const [audio, setAudio] = useState(null); // { blob, url }
  const [erro, setErro] = useState("");
  const gravador = useRef(null);
  const pedacos = useRef([]);
  const stream = useRef(null);

  useEffect(() => () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    if (audio?.url) URL.revokeObjectURL(audio.url);
  }, [audio]);

  useEffect(() => {
    if (fase !== "gravando") return;
    const timer = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [fase]);

  useEffect(() => {
    if (fase === "gravando" && segundos >= LIMITE_SEGUNDOS) parar();
  }, [segundos, fase]);

  const iniciar = async () => {
    setErro("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErro("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
      return;
    }
    const rec = new MediaRecorder(stream.current);
    pedacos.current = [];
    rec.ondataavailable = (e) => e.data.size && pedacos.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
      stream.current?.getTracks().forEach((t) => t.stop());
      setAudio({ blob, url: URL.createObjectURL(blob) });
      setFase("revisar");
    };
    gravador.current = rec;
    rec.start();
    setSegundos(0);
    setFase("gravando");
  };

  const parar = () => {
    if (gravador.current?.state === "recording") gravador.current.stop();
  };

  const regravar = () => {
    setAudio(null);
    setSegundos(0);
    setErro("");
    setFase("pronto");
  };

  const enviar = async () => {
    setFase("enviando");
    setErro("");
    const form = new FormData();
    form.append("file", audio.blob, "audio.wav");
    form.append("tipo", "audio");
    form.append("localizacao", bairro);
    form.append("origem", `Cabine ${bairro}`);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL, { method: "POST", body: form });
      const corpo = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(corpo.error || "Não foi possível enviar o áudio. Tente novamente.");
        setFase("revisar");
        return;
      }
      setFase("enviado");
    } catch {
      setErro("Sem conexão com o servidor. Verifique sua internet e tente de novo.");
      setFase("revisar");
    }
  };

  if (fase === "enviado") {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 5 5L20 7" /></svg>
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-emerald-900">Relato enviado!</h2>
        <p className="mt-1 text-emerald-800">Obrigado por ajudar a melhorar {bairro}.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={regravar} className="rounded-xl bg-maceio-navy px-6 py-3 font-bold text-white hover:bg-maceio-deep transition">Enviar outro relato</button>
          <Link href="/" className="rounded-xl border-2 border-emerald-300 px-6 py-3 font-bold text-emerald-900 hover:bg-emerald-100 transition">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const gravando = fase === "gravando";

  return (
    <div className="mt-8">
      {(fase === "pronto" || gravando) && (
        <div className="flex flex-col items-center">
          <div className="relative isolate">
            <button
              onClick={gravando ? parar : iniciar}
              aria-label={gravando ? "Parar gravação" : "Começar a gravar"}
              className={`${gravando ? "pulse-ring bg-red-600 hover:bg-red-700" : "bg-maceio-orange hover:bg-orange-500"} relative flex h-36 w-36 items-center justify-center rounded-full text-white shadow-lg transition`}
            >
              {gravando ? (
                <span className="h-11 w-11 rounded-md bg-white" aria-hidden />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4Zm6-4a1 1 0 1 1 2 0 8 8 0 0 1-7 7.94V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.06A8 8 0 0 1 4 11a1 1 0 1 1 2 0 6 6 0 0 0 12 0Z" /></svg>
              )}
            </button>
          </div>
          <p className="mt-6 text-4xl font-extrabold tabular-nums text-maceio-navy" aria-live="off">{formatar(segundos)}</p>
          <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-maceio-sky" role="progressbar" aria-valuemin={0} aria-valuemax={LIMITE_SEGUNDOS} aria-valuenow={segundos}>
            <div className="h-full bg-maceio-blue transition-all duration-1000 ease-linear" style={{ width: `${(segundos / LIMITE_SEGUNDOS) * 100}%` }} />
          </div>
          <p className="mt-4 font-semibold text-maceio-muted">
            {gravando ? "Gravando… toque para parar" : "Toque para começar a gravar"}
          </p>
        </div>
      )}

      {(fase === "revisar" || fase === "enviando") && audio && (
        <div>
          <p className="font-bold text-maceio-navy">Ouça seu relato antes de enviar</p>
          <audio controls src={audio.url} className="mt-3 w-full" />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={enviar}
              disabled={fase === "enviando"}
              className="flex-1 inline-flex items-center justify-center gap-3 rounded-xl bg-maceio-navy px-6 py-4 text-lg font-bold text-white hover:bg-maceio-deep transition disabled:opacity-70"
            >
              {fase === "enviando" && <span className="h-5 w-5 rounded-full border-4 border-white/30 border-t-white animate-spin" aria-hidden />}
              {fase === "enviando" ? "Transcrevendo e classificando…" : "Enviar relato"}
            </button>
            <button
              onClick={regravar}
              disabled={fase === "enviando"}
              className="rounded-xl border-2 border-maceio-line px-6 py-4 font-bold text-maceio-navy hover:bg-maceio-sky transition disabled:opacity-50"
            >
              Gravar de novo
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-800">
          {erro}
        </p>
      )}
    </div>
  );
}
