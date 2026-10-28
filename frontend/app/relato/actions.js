"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { identificarCliente, dentroDoLimite } from "../../lib/server/limite";
import { processarRelato } from "../../lib/server/relatos";

const LIMITE_POR_HORA = 10;

export async function enviarRelato(formData) {
  const bairro = formData.get("bairro");
  const arquivo = formData.get("file");
  if (typeof bairro !== "string" || !(arquivo instanceof File)) return { erro: "Requisição inválida." };

  const cliente = identificarCliente(await headers());
  if (!(await dentroDoLimite(`web:${cliente}`, LIMITE_POR_HORA, 3600))) {
    return { erro: "Você enviou muitos relatos em pouco tempo. Tente novamente mais tarde." };
  }

  const resultado = await processarRelato({
    tipo: "audio",
    bairro,
    origem: `Cabine ${bairro}`,
    audio: Buffer.from(await arquivo.arrayBuffer()),
  });
  if (resultado.erro) return { erro: resultado.erro };

  updateTag("registros");
  return { ok: true };
}
