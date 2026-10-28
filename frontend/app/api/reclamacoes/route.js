import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { dentroDoLimite } from "../../../lib/server/limite";
import { processarRelato } from "../../../lib/server/relatos";

export const maxDuration = 60;

const hash = (v) => createHash("sha256").update(v).digest();

const autorizado = (request) => {
  const esperada = process.env.WHATSAPP_API_KEY;
  if (!esperada) return false;
  const recebida = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return timingSafeEqual(hash(recebida), hash(esperada));
};

const json = (corpo, status = 200) => Response.json(corpo, { status });

export async function POST(request) {
  if (!autorizado(request)) return json({ error: "Não autorizado." }, 401);
  if (!(await dentroDoLimite("integracao", 600, 3600))) return json({ error: "Limite de requisições excedido." }, 429);

  let dados;
  let audio = null;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      dados = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
      const arquivo = form.get("file");
      if (arquivo instanceof File) audio = Buffer.from(await arquivo.arrayBuffer());
    } else {
      dados = await request.json();
    }
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const resultado = await processarRelato({
    tipo: dados.tipo,
    bairro: dados.localizacao,
    origem: dados.origem,
    telefone: dados.telefone,
    texto: dados.reclamacao,
    audio,
    audioUrl: dados.audio_url,
  });
  if (resultado.erro) return json({ error: resultado.erro }, resultado.status);

  revalidateTag("registros", { expire: 0 });
  return json({ status: dados.tipo === "audio" ? "Reclamação de áudio processada e salva." : "Reclamação de texto processada e salva." });
}
