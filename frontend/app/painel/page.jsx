"use client";

import React, { useCallback, useEffect, useState } from "react";
import MarcaOuvidoria from "../components/MarcaOuvidoria";
import Painel from "./Painel";

const CHAVE_SESSAO = "painel_senha";

export default function PaginaPainel() {
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (senhaUso) => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch("/painel/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senhaUso }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.error || "Não foi possível carregar o painel.");
        setAutenticado(false);
        try {
          sessionStorage.removeItem(CHAVE_SESSAO);
        } catch {}
        return;
      }
      setRegistros(Array.isArray(json.dados) ? json.dados : []);
      setAutenticado(true);
      try {
        sessionStorage.setItem(CHAVE_SESSAO, senhaUso);
      } catch {}
    } catch {
      setErro("Falha de conexão ao carregar o painel.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let salva = null;
    try {
      salva = sessionStorage.getItem(CHAVE_SESSAO);
    } catch {}
    if (salva) {
      setSenha(salva);
      carregar(salva);
    }
  }, [carregar]);

  const sair = () => {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {}
    setAutenticado(false);
    setRegistros([]);
    setSenha("");
  };

  if (!autenticado) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-azul-900 px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            carregar(senha);
          }}
          className="w-full max-w-sm rounded-3xl border-4 border-amarelo bg-white p-8 shadow-bloco"
        >
          <div className="mb-6 flex items-center gap-3">
            <MarcaOuvidoria className="h-12 w-12" />
            <div className="leading-none">
              <p className="titulo-cartaz text-xl text-azul-900">
                Painel de Acompanhamento
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Ouvidoria JHC · acesso restrito
              </p>
            </div>
          </div>

          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded-lg border-2 border-slate-300 px-3 py-2.5 font-semibold text-azul-900 focus:border-azul-700 focus:outline-none"
          />

          {erro && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || !senha}
            className="faixa-cta mt-5 w-full rounded-lg px-6 py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-60"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <Painel
      registros={registros}
      carregando={carregando}
      onAtualizar={() => carregar(senha)}
      onSair={sair}
    />
  );
}
