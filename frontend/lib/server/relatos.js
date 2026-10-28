import "server-only";
import { eq } from "drizzle-orm";
import { BAIRROS } from "../bairros";
import { getDb } from "./db";
import { registros } from "./schema";
import { TAMANHO_MAXIMO, baixarAudio, detectarFormato } from "./audio";
import { classificar, corrigirTranscricao, transcrever } from "./ia";

export const ORIGENS_VALIDAS = ["Whatsapp", ...BAIRROS.map((b) => `Cabine ${b}`)];

const ERRO_MUNICIPIO = "A ocorrência precisa ser referente ao município.";
const falha = (erro, status = 400) => ({ erro, status });

export async function processarRelato({ tipo, bairro, origem, telefone, texto, audio, audioUrl }) {
  if (!BAIRROS.includes(bairro) || !ORIGENS_VALIDAS.includes(origem)) return falha("Bairro ou origem inválidos.");
  const fone = typeof telefone === "string" ? telefone.replace(/[^\d+()\- ]/g, "").slice(0, 20) || null : null;

  let transcricao;
  try {
    if (tipo === "texto") {
      if (typeof texto !== "string") return falha("Texto inválido.");
      if (texto.length > 800) return falha("O texto excede o limite de 800 caracteres.");
      transcricao = texto.trim();
    } else if (tipo === "audio") {
      const buffer = audio ?? (audioUrl ? await baixarAudio(audioUrl) : null);
      if (!buffer?.length) return falha("Áudio não enviado.");
      if (buffer.length > TAMANHO_MAXIMO) return falha("O áudio é grande demais.");
      const formato = detectarFormato(buffer);
      if (!formato) return falha("Formato de áudio não suportado.");

      const { texto: falado, duracao } = await transcrever(buffer, formato);
      if (duracao > 61) return falha("O áudio excede o limite de 1 minuto.");
      transcricao = falado;
    } else {
      return falha("Tipo inválido. Use 'texto' ou 'audio'.");
    }

    if (transcricao.length < 20) return falha(ERRO_MUNICIPIO);

    const base = tipo === "audio" ? await corrigirTranscricao(transcricao) : transcricao;
    const relatorio = await classificar(base);
    if (!relatorio) return falha(ERRO_MUNICIPIO);

    const db = await getDb();
    await db.insert(registros).values({ transcricao, ...relatorio, bairro, origem, telefone: fone });
    return { ok: true };
  } catch (erro) {
    console.error("Falha ao processar relato:", erro);
    if (erro?.message?.startsWith("A URL") || erro?.message?.includes("Origem do áudio") || erro?.message?.includes("grande demais") || erro?.message?.startsWith("Falha ao baixar")) {
      return falha(erro.message);
    }
    return falha("Não foi possível processar o relato agora. Tente novamente.", 502);
  }
}

const paraIso = (v) => (v ? v.replace(" ", "T") : null);

export async function listarRegistros() {
  const db = await getDb();
  const linhas = await db.select().from(registros).orderBy(registros.id);
  return linhas.map(({ dataHora, ...r }) => ({ ...r, data_hora: paraIso(dataHora) }));
}

export async function buscarTranscricao(id) {
  const db = await getDb();
  const [linha] = await db.select({ transcricao: registros.transcricao }).from(registros).where(eq(registros.id, id)).limit(1);
  return linha?.transcricao ?? "";
}
