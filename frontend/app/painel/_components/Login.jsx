"use client";

import { useActionState } from "react";
import { entrar } from "../actions";

export default function Login() {
  const [estado, acao, pendente] = useActionState(entrar, null);

  return (
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-maceio-deep via-maceio-navy to-maceio-blue px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card">
        <img src="/logo.svg" alt="Prefeitura de Maceió" className="mx-auto h-20 w-auto" />
        <h1 className="mt-5 text-center text-2xl font-extrabold text-maceio-navy">Painel da Ouvidoria</h1>
        <p className="mt-1 text-center text-sm text-maceio-muted">Acesso restrito à equipe da Prefeitura.</p>
        <form action={acao} className="mt-6">
          <label htmlFor="chave" className="text-sm font-bold text-maceio-navy">Palavra-chave</label>
          <input id="chave" name="chave" type="password" required autoFocus autoComplete="current-password"
            className="mt-1 w-full rounded-xl border-2 border-maceio-line px-4 py-3" />
          {estado?.erro && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{estado.erro}</p>}
          <button disabled={pendente} className="mt-5 w-full rounded-xl bg-maceio-navy py-3.5 font-bold text-white hover:bg-maceio-deep transition disabled:opacity-60">
            {pendente ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
