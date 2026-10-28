import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESSAO = "painel_sessao";

const assinatura = () =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update("painel:v1").digest("hex");

export const tokenSessao = () => assinatura();

export const chaveValida = (chave) => {
  const esperada = process.env.ACCESS_KEY;
  if (!esperada || typeof chave !== "string") return false;
  const a = Buffer.from(chave);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const sessaoValida = (token) => {
  if (!token || !process.env.AUTH_SECRET) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(assinatura());
  return a.length === b.length && timingSafeEqual(a, b);
};
