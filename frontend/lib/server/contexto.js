import "server-only";
import { BAIRROS } from "../bairros";
import { GLOSSARIO } from "./glossario-dados";

const sem = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escapar = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const chaves = (e) =>
  [e.termo, e.oficial, e.sinonimo]
    .flatMap((campo) => campo.replace(/\([^)]*\)/g, " ").split(/\s\/\s|;/))
    .map((c) => sem(c).replace(/^(o|a|os|as)\s+/, "").trim())
    .filter((c) => c.length >= 3);

const INDICE = GLOSSARIO.map((e) => ({
  entrada: e,
  padrao: new RegExp(`(?<![a-z0-9])(?:${chaves(e).map(escapar).join("|")})s?(?![a-z0-9])`),
}));

const linha = (e) => {
  const nome = e.oficial && e.oficial !== e.termo ? ` (${e.oficial})` : "";
  const apelido = e.sinonimo && e.sinonimo !== e.termo ? ` Também: ${e.sinonimo}.` : "";
  return `- ${e.termo}${nome}: ${e.descricao}${apelido}`;
};

const ORGAOS = GLOSSARIO.filter((e) => e.categoria.startsWith("Órgão")).map(linha).join("\n");

export const termosCitados = (texto, limite = 12) => {
  const alvo = sem(texto);
  return INDICE.filter(({ entrada, padrao }) => !entrada.categoria.startsWith("Órgão") && padrao.test(alvo))
    .slice(0, limite)
    .map(({ entrada }) => entrada);
};

export const contextoParaCorrecao = (texto) => {
  const citados = termosCitados(texto);
  return citados.length ? `Termos locais de Maceió que aparecem neste texto (mantenha a grafia correta deles):\n${citados.map(linha).join("\n")}` : "";
};

export const contextoParaClassificacao = (texto) => {
  const citados = termosCitados(texto);
  return [
    "Contexto local de Maceió. Use-o para interpretar siglas, programas e apelidos de lugares; não invente informações fora dele.",
    `Órgãos municipais:\n${ORGAOS}`,
    citados.length ? `Termos citados neste texto:\n${citados.map(linha).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
};

export const vocabularioTranscricao = (() => {
  const programas = GLOSSARIO.filter((e) => e.categoria.startsWith("Programa")).map((e) => e.termo);
  const orgaos = GLOSSARIO.filter((e) => e.categoria.startsWith("Órgão")).map((e) => e.termo);
  let texto = "Relato de um morador de Maceió, Alagoas. Termos que podem aparecer: ";
  for (const termo of [...programas, ...orgaos, ...BAIRROS]) {
    if (texto.length + termo.length + 2 > 700) break;
    texto += `${termo}, `;
  }
  return texto.replace(/, $/, ".");
})();
