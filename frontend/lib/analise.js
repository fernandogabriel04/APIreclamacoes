export const FILTROS_VAZIOS = { ano: "", origem: "", categoria: "", subcategoria: "", bairro: "", mes: "", q: "" };

const STOPWORDS = new Set(
  `a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre até ao aos à às e ou mas que se como quando onde porque pois já não mais muito muita muitos muitas também só ser estar ter haver há foi era são está estão tem têm tinha pelo pela pelos pelas isso isto aquilo esse essa esses essas este esta estes estas seu sua seus suas meu minha meus minhas nosso nossa lhe lhes ele ela eles elas eu nós você vocês depois antes ainda então assim aqui ali lá cada todo toda todos todas outro outra outros outras mesmo mesma sendo sido ficar fica ficou fazer faz feito pode podem precisa precisam necessário necessária solicitação munícipe município maceió prefeitura prefeito serviço pessoa pessoas reclamação relata relato morador moradores texto cidadão informa denuncia solicita requer apresenta`
    .split(/\s+/),
);

export const preparar = (registros) =>
  registros.map((r) => ({
    ...r,
    _ano: r.data_hora?.slice(0, 4) ?? "",
    _mes: r.data_hora?.slice(0, 7) ?? "",
    _ts: r.data_hora ? new Date(r.data_hora).getTime() : 0,
    _busca: `${r.resumo ?? ""} ${r.tema ?? ""} ${r.subcategoria ?? ""} ${r.bairro ?? ""}`.toLowerCase(),
  }));

const CAMPO = { ano: "_ano", mes: "_mes" };

export const filtrar = (linhas, f, ignorar = []) => {
  const termo = f.q.trim().toLowerCase();
  return linhas.filter((r) => {
    for (const dim of ["ano", "origem", "categoria", "subcategoria", "bairro", "mes"]) {
      if (f[dim] && !ignorar.includes(dim) && r[CAMPO[dim] ?? dim] !== f[dim]) return false;
    }
    return ignorar.includes("q") || !termo || r._busca.includes(termo);
  });
};

export const contar = (linhas, campo) => {
  const mapa = new Map();
  for (const r of linhas) if (r[campo]) mapa.set(r[campo], (mapa.get(r[campo]) ?? 0) + 1);
  return [...mapa.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
};

export const unicos = (linhas, campo) => [...new Set(linhas.map((r) => r[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export const porMes = (linhas) => {
  const mapa = new Map();
  for (const r of linhas) if (r._mes) mapa.set(r._mes, (mapa.get(r._mes) ?? 0) + 1);
  if (mapa.size === 0) return [];
  const meses = [...mapa.keys()].sort();
  const [a0, m0] = meses[0].split("-").map(Number);
  const [a1, m1] = meses.at(-1).split("-").map(Number);
  const saida = [];
  for (let a = a0, m = m0; a < a1 || (a === a1 && m <= m1); m === 12 ? (a++, (m = 1)) : m++) {
    const chave = `${a}-${String(m).padStart(2, "0")}`;
    saida.push({ mes: chave, total: mapa.get(chave) ?? 0 });
  }
  return saida;
};

export const palavras = (linhas, limite = 36) => {
  const mapa = new Map();
  for (const r of linhas) {
    for (const p of `${r.resumo ?? ""} ${r.tema ?? ""}`.toLowerCase().match(/\p{L}{4,}/gu) ?? []) {
      if (!STOPWORDS.has(p)) mapa.set(p, (mapa.get(p) ?? 0) + 1);
    }
  }
  return [...mapa.entries()].map(([palavra, total]) => ({ palavra, total })).sort((a, b) => b.total - a.total).slice(0, limite);
};

export const ultimosDias = (linhas, dias, agora) => linhas.filter((r) => r._ts && r._ts >= agora - dias * 86400000).length;

const dividir = (itens, x, y, w, h, saida) => {
  if (itens.length === 0) return;
  if (itens.length === 1) {
    saida.push({ ...itens[0], x, y, w, h });
    return;
  }
  const soma = itens.reduce((s, i) => s + i.total, 0);
  let acc = 0, corte = 0;
  while (corte < itens.length - 1 && acc + itens[corte].total <= soma / 2) acc += itens[corte++].total;
  if (corte === 0) acc = itens[corte++].total;
  const a = itens.slice(0, corte), b = itens.slice(corte);
  const fracao = acc / soma;
  if (w >= h) {
    dividir(a, x, y, w * fracao, h, saida);
    dividir(b, x + w * fracao, y, w * (1 - fracao), h, saida);
  } else {
    dividir(a, x, y, w, h * fracao, saida);
    dividir(b, x, y + h * fracao, w, h * (1 - fracao), saida);
  }
};

export const layoutTreemap = (dados) => {
  const saida = [];
  dividir(dados, 0, 0, 100, 100, saida);
  return saida;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const rotuloMes = (mes, curto = true) => {
  const [ano, m] = mes.split("-");
  return curto ? `${MESES[Number(m) - 1]}/${ano.slice(2)}` : `${MESES[Number(m) - 1]} de ${ano}`;
};

export const dataBR = (iso) => {
  if (!iso) return "-";
  const [d, h] = iso.split("T");
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a} ${h?.slice(0, 5) ?? ""}`.trim();
};
