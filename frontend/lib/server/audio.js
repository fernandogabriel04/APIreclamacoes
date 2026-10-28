import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export const detectarFormato = (b) => {
  if (b.length < 12) return null;
  const txt = (i, n) => b.toString("latin1", i, i + n);
  if (txt(0, 4) === "RIFF" && txt(8, 4) === "WAVE") return { ext: "wav", mime: "audio/wav" };
  if (txt(0, 4) === "OggS") return { ext: "ogg", mime: "audio/ogg" };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { ext: "webm", mime: "audio/webm" };
  if (txt(4, 4) === "ftyp") return { ext: "m4a", mime: "audio/mp4" };
  if (txt(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { ext: "mp3", mime: "audio/mpeg" };
  if (txt(0, 4) === "fLaC") return { ext: "flac", mime: "audio/flac" };
  return null;
};

const ipPrivado = (ip) => {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
};

export async function baixarAudio(urlTexto) {
  let url;
  try { url = new URL(urlTexto); } catch { throw new Error("URL de áudio inválida."); }
  if (url.protocol !== "https:") throw new Error("A URL do áudio precisa usar HTTPS.");

  const permitidos = process.env.AUDIO_URL_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean);
  if (permitidos?.length && !permitidos.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    throw new Error("Origem do áudio não permitida.");
  }

  const enderecos = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
  if (enderecos.length === 0 || enderecos.some((e) => ipPrivado(e.address))) throw new Error("Origem do áudio não permitida.");

  const resposta = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!resposta.ok) throw new Error(`Falha ao baixar o áudio: ${resposta.status}`);
  if (Number(resposta.headers.get("content-length")) > TAMANHO_MAXIMO) throw new Error("O áudio é grande demais.");

  const partes = [];
  let total = 0;
  for await (const parte of resposta.body) {
    total += parte.length;
    if (total > TAMANHO_MAXIMO) throw new Error("O áudio é grande demais.");
    partes.push(parte);
  }
  return Buffer.concat(partes);
}
