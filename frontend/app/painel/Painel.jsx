"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MarcaOuvidoria from "../components/MarcaOuvidoria";
import NuvemPalavras from "./NuvemPalavras";

const AZUL = "#1E5BD6";
const AZUL_ESC = "#0C3AA0";
const GRID = "#e2e8f0";
const EIXO = "#64748b";
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const soData = (iso) => (iso ? new Date(iso) : null);
const chaveMes = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const rotuloMes = (chave) => {
  const [a, m] = chave.split("-");
  return `${MESES[Number(m) - 1]}/${a.slice(2)}`;
};

function contar(lista, chave) {
  const mapa = new Map();
  for (const item of lista) {
    const v = (item[chave] || "—").trim() || "—";
    mapa.set(v, (mapa.get(v) || 0) + 1);
  }
  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

function DicaGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {payload[0].payload.nome ?? label}
      </p>
      <p className="text-lg font-extrabold text-azul-900">
        {payload[0].value}
        <span className="ml-1 text-xs font-semibold text-slate-400">
          {payload[0].value === 1 ? "manifestação" : "manifestações"}
        </span>
      </p>
    </div>
  );
}

function Cartao({ titulo, children, className = "" }) {
  return (
    <div className={`rounded-2xl border-2 border-azul-900/10 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="titulo-cartaz text-lg text-azul-900">{titulo}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function Painel({ registros, carregando, onAtualizar, onSair }) {
  const [ano, setAno] = useState("");
  const [categoria, setCategoria] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [origem, setOrigem] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const POR_PAGINA = 15;

  const opcoes = useMemo(() => {
    const anos = new Set();
    const categorias = new Set();
    const municipios = new Set();
    const origens = new Set();
    for (const r of registros) {
      const d = soData(r.data_hora);
      if (d) anos.add(String(d.getFullYear()));
      if (r.categoria) categorias.add(r.categoria);
      if (r.municipio) municipios.add(r.municipio);
      if (r.origem) origens.add(r.origem);
    }
    return {
      anos: [...anos].sort().reverse(),
      categorias: [...categorias].sort(),
      municipios: [...municipios].sort(),
      origens: [...origens].sort(),
    };
  }, [registros]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((r) => {
      const d = soData(r.data_hora);
      if (ano && (!d || String(d.getFullYear()) !== ano)) return false;
      if (categoria && r.categoria !== categoria) return false;
      if (municipio && r.municipio !== municipio) return false;
      if (origem && r.origem !== origem) return false;
      if (
        termo &&
        !`${r.resumo || ""} ${r.bairro || ""}`.toLowerCase().includes(termo)
      )
        return false;
      return true;
    });
  }, [registros, ano, categoria, municipio, origem, busca]);

  const kpis = useMemo(() => {
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let ultimos30 = 0;
    const municipiosSet = new Set();
    for (const r of filtrados) {
      const d = soData(r.data_hora);
      if (d && d.getTime() >= limite) ultimos30 += 1;
      if (r.municipio) municipiosSet.add(r.municipio);
    }
    const topCat = contar(filtrados, "categoria")[0];
    return {
      total: filtrados.length,
      ultimos30,
      municipios: municipiosSet.size,
      topCategoria: topCat ? topCat.nome : "—",
    };
  }, [filtrados]);

  const porMes = useMemo(() => {
    const mapa = new Map();
    for (const r of filtrados) {
      const d = soData(r.data_hora);
      if (!d) continue;
      const k = chaveMes(d);
      mapa.set(k, (mapa.get(k) || 0) + 1);
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, total]) => ({ nome: rotuloMes(k), total }));
  }, [filtrados]);

  const porCategoria = useMemo(() => contar(filtrados, "categoria"), [filtrados]);
  const porOrigem = useMemo(() => contar(filtrados, "origem").slice(0, 10), [filtrados]);
  const topMunicipios = useMemo(
    () => contar(filtrados, "municipio").slice(0, 10),
    [filtrados]
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhas = filtrados
    .slice()
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const limpar = () => {
    setAno("");
    setCategoria("");
    setMunicipio("");
    setOrigem("");
    setBusca("");
    setPagina(1);
  };

  const alturaCat = Math.max(200, porCategoria.length * 34);
  const alturaMun = Math.max(200, topMunicipios.length * 34);
  const alturaOri = Math.max(160, porOrigem.length * 34);

  return (
    <main className="min-h-screen bg-gelo">
      <header className="bg-azul-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <MarcaOuvidoria className="h-10 w-10" />
            <div className="leading-none">
              <p className="titulo-cartaz text-lg text-amarelo">
                Painel de Acompanhamento
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-azul-100">
                Ouvidoria JHC · manifestações recebidas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAtualizar}
              disabled={carregando}
              className="rounded-full border-2 border-amarelo px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amarelo disabled:opacity-50"
            >
              {carregando ? "Atualizando…" : "Atualizar"}
            </button>
            <button
              onClick={onSair}
              className="rounded-full bg-amarelo px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-azul-900"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border-2 border-azul-900/10 bg-white p-4">
          <Campo label="Ano">
            <select value={ano} onChange={(e) => { setAno(e.target.value); setPagina(1); }} className={inputCls}>
              <option value="">Todos</option>
              {opcoes.anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Campo>
          <Campo label="Categoria">
            <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setPagina(1); }} className={inputCls}>
              <option value="">Todas</option>
              {opcoes.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Município">
            <select value={municipio} onChange={(e) => { setMunicipio(e.target.value); setPagina(1); }} className={inputCls}>
              <option value="">Todos</option>
              {opcoes.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Campo>
          <Campo label="Origem">
            <select value={origem} onChange={(e) => { setOrigem(e.target.value); setPagina(1); }} className={inputCls}>
              <option value="">Todas</option>
              {opcoes.origens.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Campo>
          <Campo label="Buscar (resumo / bairro)">
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              placeholder="palavra-chave"
              className={inputCls}
            />
          </Campo>
          <button
            onClick={limpar}
            className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            Limpar
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Manifestações" valor={kpis.total} />
          <Kpi rotulo="Últimos 30 dias" valor={kpis.ultimos30} />
          <Kpi rotulo="Municípios alcançados" valor={kpis.municipios} />
          <Kpi rotulo="Categoria mais citada" valor={kpis.topCategoria} texto />
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center font-semibold text-slate-400">
            Nenhuma manifestação para os filtros selecionados.
          </div>
        ) : (
          <>
            {/* Gráficos */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Cartao titulo="Manifestações por mês" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={porMes} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="nome" tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis allowDecimals={false} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(30,91,214,0.08)" }} content={<DicaGrafico />} />
                    <Bar dataKey="total" fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao titulo="Por categoria">
                <ResponsiveContainer width="100%" height={alturaCat}>
                  <BarChart data={porCategoria} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis type="category" dataKey="nome" width={130} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(30,91,214,0.08)" }} content={<DicaGrafico />} />
                    <Bar dataKey="total" fill={AZUL} radius={[0, 4, 4, 0]} maxBarSize={22}>
                      <LabelList dataKey="total" position="right" fill={AZUL_ESC} fontSize={12} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao titulo="Top 10 municípios">
                <ResponsiveContainer width="100%" height={alturaMun}>
                  <BarChart data={topMunicipios} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis type="category" dataKey="nome" width={130} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(30,91,214,0.08)" }} content={<DicaGrafico />} />
                    <Bar dataKey="total" fill={AZUL} radius={[0, 4, 4, 0]} maxBarSize={22}>
                      <LabelList dataKey="total" position="right" fill={AZUL_ESC} fontSize={12} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao titulo="Por origem" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={alturaOri}>
                  <BarChart data={porOrigem} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis type="category" dataKey="nome" width={140} tick={{ fill: EIXO, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(30,91,214,0.08)" }} content={<DicaGrafico />} />
                    <Bar dataKey="total" fill={AZUL} radius={[0, 4, 4, 0]} maxBarSize={22}>
                      <LabelList dataKey="total" position="right" fill={AZUL_ESC} fontSize={12} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>
            </div>

            {/* Nuvem de palavras */}
            <div className="mt-4">
              <Cartao titulo="Nuvem de palavras">
                <p className="-mt-2 mb-3 text-sm font-medium text-slate-500">
                  Termos que mais aparecem nos resumos das manifestações.
                </p>
                <NuvemPalavras registros={filtrados} />
              </Cartao>
            </div>

            {/* Tabela */}
            <div className="mt-6 overflow-hidden rounded-2xl border-2 border-azul-900/10 bg-white">
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="titulo-cartaz text-lg text-azul-900">
                  Manifestações ({filtrados.length})
                </h3>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual <= 1}
                    className="rounded border-2 border-slate-200 px-2 py-1 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <span>{paginaAtual} / {totalPaginas}</span>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual >= totalPaginas}
                    className="rounded border-2 border-slate-200 px-2 py-1 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="bg-azul-900 text-xs uppercase tracking-wide text-white">
                    <tr>
                      {["ID", "Data", "Origem", "Município", "Bairro", "Categoria", "Subcategoria", "Resumo", "Telefone"].map((h) => (
                        <th key={h} className="px-4 py-2.5 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((r, i) => {
                      const d = soData(r.data_hora);
                      return (
                        <tr key={r.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                          <td className="px-4 py-2.5 font-semibold text-slate-400">{r.id}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                            {d ? d.toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                                r.origem === "Site"
                                  ? "bg-azul-50 text-azul-700"
                                  : (r.origem || "").startsWith("Cabine")
                                  ? "bg-orange-50 text-laranja"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {r.origem || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-azul-900">{r.municipio || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{r.bairro || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{r.categoria || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{r.subcategoria || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{r.resumo || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{r.telefone || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const inputCls =
  "rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-azul-900 focus:border-azul-700 focus:outline-none";

function Campo({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Kpi({ rotulo, valor, texto = false }) {
  return (
    <div className="rounded-2xl border-2 border-azul-900/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{rotulo}</p>
      <p className={`mt-2 font-extrabold text-azul-900 ${texto ? "text-xl leading-tight" : "titulo-cartaz text-4xl"}`}>
        {valor}
      </p>
    </div>
  );
}
