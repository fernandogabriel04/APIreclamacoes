export const BAIRROS = [
  "Antares", "Bebedouro", "Benedito Bentes", "Bom Parto", "Canaã", "Centro",
  "Chã da Jaqueira", "Chã de Bebedouro", "Cidade Universitária", "Clima Bom",
  "Cruz das Almas", "Eustáquio Gomes", "Farol", "Fernão Velho", "Feitosa",
  "Garça Torta", "Gruta de Lourdes", "Guaxuma", "Ipioca", "Jacarecica",
  "Jacintinho", "Jardim Petrópolis", "Jaraguá", "Jatiúca", "Levada",
  "Mangabeiras", "Mutange", "Pajuçara", "Pinheiro", "Pontal da Barra", "Poço",
  "Ponta Verde", "Prado", "Riacho Doce", "Rio Novo", "Santa Lúcia", "São Jorge",
  "Serraria", "Tabuleiro do Martins", "Trapiche da Barra", "Vergel do Lago",
];

export const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const slugify = (bairro) => normalizar(bairro).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const bairroPorSlug = (slug) => BAIRROS.find((b) => slugify(b) === slug) ?? null;

export const bairroPorNome = (nome) => {
  const alvo = normalizar(nome ?? "");
  if (!alvo) return null;
  return BAIRROS.find((b) => normalizar(b) === alvo) ?? null;
};
