"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { COOKIE_SESSAO, chaveValida, sessaoValida, tokenSessao } from "../../lib/auth";
import { buscarTranscricao as buscar } from "../../lib/server/relatos";

export async function entrar(_estadoAnterior, formData) {
  if (!chaveValida(formData.get("chave"))) return { erro: "Palavra-chave incorreta." };

  (await cookies()).set(COOKIE_SESSAO, tokenSessao(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return null;
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
}

export async function atualizarDados() {
  if (!sessaoValida((await cookies()).get(COOKIE_SESSAO)?.value)) return;
  updateTag("registros");
}

export async function buscarTranscricao(id) {
  if (!sessaoValida((await cookies()).get(COOKIE_SESSAO)?.value)) return "";
  return Number.isInteger(id) ? buscar(id) : "";
}
