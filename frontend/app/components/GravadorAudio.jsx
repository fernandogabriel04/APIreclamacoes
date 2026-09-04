"use client";

import React, { useEffect, useRef, useState } from "react";

const LIMITE_SEGUNDOS = 60;

// MediaRecorder não grava WAV. Escolhe o melhor container que o navegador suporta.
const FORMATOS = [
  { mime: "audio/webm;codecs=opus", ext: "webm" },
  { mime: "audio/webm", ext: "webm" },
  { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  { mime: "audio/mp4", ext: "m4a" },
];
const escolherFormato = () => {
  if (typeof MediaRecorder === "undefined") return { mime: "", ext: "webm" };
  return (
    FORMATOS.find((f) => MediaRecorder.isTypeSupported(f.mime)) || { mime: "", ext: "webm" }
  );
};

const formatar = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * Botão de gravar + prévia (reproduzir / regravar / enviar) + status.
 * Toda a captação e o envio multipart estão aqui; o município/bairro/origem vêm de fora.
 */
export default function GravadorAudio({
  municipio,
  bairro,
  origem,
  pronto = true,
  tamanho = "md", // "md" | "lg" (cabine)
  onEnviado,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState(null); // { tipo: "erro" | "ok", texto }

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const audioElRef = useRef(null);
  const formatoRef = useRef({ mime: "", ext: "webm" });

  useEffect(() => {
    if (!isRecording) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => {
        if (t + 1 >= LIMITE_SEGUNDOS) {
          pararGravacao();
          return LIMITE_SEGUNDOS;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl]
  );

  const iniciarGravacao = async () => {
    setStatus(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const formato = escolherFormato();
      formatoRef.current = formato;
      const rec = new MediaRecorder(
        stream,
        formato.mime ? { mimeType: formato.mime } : undefined
      );
      mediaRecorder.current = rec;
      audioChunks.current = [];

      rec.ondataavailable = (e) => audioChunks.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(audioChunks.current, {
          type: rec.mimeType || formato.mime || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((t) => t.stop());
      };

      rec.start();
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsRecording(true);
    } catch {
      setStatus({
        tipo: "erro",
        texto:
          "Não foi possível acessar o microfone. Verifique a permissão do navegador.",
      });
    }
  };

  const pararGravacao = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const alternarReproducao = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      el.currentTime = 0;
      setIsPlaying(false);
    } else {
      el.play();
      setIsPlaying(true);
    }
  };

  const descartarAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setStatus(null);
  };

  const enviarAudio = async () => {
    if (!audioBlob || !municipio) return;
    setIsProcessing(true);
    setStatus(null);
    try {
      const ext = formatoRef.current.ext || "webm";
      const fd = new FormData();
      fd.append("audio", audioBlob, `manifestacao.${ext}`);
      fd.append("municipio", municipio);
      fd.append("localizacao", municipio);
      if (bairro) fd.append("bairro", bairro);
      fd.append("origem", origem || "Site");

      const resp = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: "POST",
        body: fd,
      });
      const dados = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setStatus({
          tipo: "erro",
          texto:
            dados.error ||
            "Não foi possível registrar. Fale sobre um assunto do estado de Alagoas e tente novamente.",
        });
        return;
      }

      descartarAudio();
      setStatus({
        tipo: "ok",
        texto:
          dados.status ||
          "Mensagem enviada! Obrigado por falar com o JHC. Sua voz foi registrada.",
      });
      onEnviado?.();
    } catch {
      setStatus({
        tipo: "erro",
        texto: "Houve um erro no envio. Confira a conexão e tente novamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const progresso = Math.min((recordingTime / LIMITE_SEGUNDOS) * 100, 100);
  const lg = tamanho === "lg";
  const botao = lg ? "h-56 w-56 text-3xl" : "h-44 w-44 text-2xl";

  return (
    <div className="w-full">
      <fieldset
        disabled={!pronto}
        className="border-t-2 border-dashed border-slate-200 pt-6 disabled:opacity-40"
      >
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={isRecording ? pararGravacao : iniciarGravacao}
            className={`flex ${botao} flex-col items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 ${
              isRecording ? "animate-pulso-mic bg-azul-900" : "bg-laranja shadow-botao"
            }`}
          >
            <span className={lg ? "text-4xl" : "text-3xl"} aria-hidden="true">
              {isRecording ? "■" : "●"}
            </span>
            <span className={`titulo-cartaz mt-1 ${lg ? "text-3xl" : "text-2xl"}`}>
              {isRecording ? "Parar" : "Gravar"}
            </span>
          </button>

          <div className={`mt-5 w-full ${lg ? "max-w-sm" : "max-w-xs"}`}>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-laranja transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="mt-1 text-center text-sm font-semibold text-slate-500">
              {formatar(recordingTime)} / {formatar(LIMITE_SEGUNDOS)}
            </p>
          </div>
        </div>

        {audioUrl && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-gelo p-4">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Ouça antes de enviar
            </p>
            <audio
              ref={audioElRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={alternarReproducao}
                className="rounded-lg border-2 border-azul-700 px-4 py-2 text-sm font-bold text-azul-700 transition hover:bg-azul-50"
              >
                {isPlaying ? "Pausar" : "Reproduzir"}
              </button>
              <button
                onClick={descartarAudio}
                className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
              >
                Regravar
              </button>
              <button
                onClick={enviarAudio}
                disabled={isProcessing}
                className="faixa-cta rounded-lg px-6 py-2 text-sm font-extrabold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Enviando…" : "Enviar áudio"}
              </button>
            </div>
          </div>
        )}
      </fieldset>

      {status && (
        <p
          role="status"
          className={`mt-6 rounded-xl px-4 py-3 text-sm font-semibold ${
            status.tipo === "ok"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.texto}
        </p>
      )}
    </div>
  );
}
