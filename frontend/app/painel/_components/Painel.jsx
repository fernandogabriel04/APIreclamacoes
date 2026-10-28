"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { FILTROS_VAZIOS, contar, filtrar, palavras, porMes, preparar, ultimosDias, unicos } from "../../../lib/analise";
import { PALETA } from "./cores";
import { container, item } from "./movimento";
import Filtros from "./Filtros";
import ChipsAtivos from "./ChipsAtivos";
import Kpi from "./Kpi";
import Donut from "./Donut";
import BarrasMensais from "./BarrasMensais";
import Treemap from "./Treemap";
import TopBairros from "./TopBairros";
import NuvemPalavras from "./NuvemPalavras";
import Tabela from "./Tabela";
import AtualizarBotao from "./AtualizarBotao";

export default function Painel({ registros, geradoEm, inicial }) {
  const linhas = useMemo(() => preparar(registros), [registros]);
  const [f, setF] = useState({ ...FILTROS_VAZIOS, ...inicial });
  const [agora] = useState(() => Date.now());

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname);
  }, [f]);

  const alternar = useCallback((campo, valor, forcar = false) => {
    setF((p) => {
      const novo = forcar ? valor : p[campo] === valor ? "" : valor;
      const proximo = { ...p, [campo]: novo };
      if (campo === "categoria") proximo.subcategoria = "";
      return proximo;
    });
  }, []);
  const remover = useCallback((campo) => alternar(campo, "", true), [alternar]);
  const limpar = useCallback(() => setF({ ...FILTROS_VAZIOS }), []);

  const opcoes = useMemo(() => ({
    anos: [...new Set(linhas.map((r) => r._ano).filter(Boolean))].sort().reverse(),
    origens: unicos(linhas, "origem"),
    categorias: unicos(linhas, "categoria"),
    bairros: unicos(linhas, "bairro"),
  }), [linhas]);

  const filtradas = useMemo(() => filtrar(linhas, f).sort((a, b) => b.id - a.id), [linhas, f]);
  const dCategoria = useMemo(() => contar(filtrar(linhas, f, ["categoria", "subcategoria"]), "categoria"), [linhas, f]);
  const dSub = useMemo(
    () => (f.categoria ? contar(filtrar(linhas, f, ["subcategoria"]), "subcategoria") : []),
    [linhas, f],
  );
  const dMes = useMemo(() => porMes(filtrar(linhas, f, ["mes"])), [linhas, f]);
  const dBairro = useMemo(() => contar(filtrar(linhas, f, ["bairro"]), "bairro"), [linhas, f]);
  const dPalavras = useMemo(() => palavras(filtrar(linhas, f, ["q"])), [linhas, f]);

  const lider = (lista) => lista[0] ?? null;
  const cor = useCallback((nome) => PALETA[Math.max(0, opcoes.categorias.indexOf(nome)) % PALETA.length], [opcoes.categorias]);
  const bairroLider = lider(contar(filtradas, "bairro"));
  const categoriaLider = lider(contar(filtradas, "categoria"));
  const hora = new Date(geradoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="oculto" animate="visivel" className="space-y-6">
        <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-maceio-navy">Painel da Ouvidoria</h1>
            <p className="text-maceio-muted">Clique em qualquer gráfico para filtrar o painel inteiro.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-maceio-muted">Atualizado às {hora}</span>
            <AtualizarBotao />
          </div>
        </motion.div>

        <Filtros opcoes={opcoes} valores={f} onFiltro={alternar} onBusca={(q) => alternar("q", q, true)} />

        <motion.div variants={item}>
          <ChipsAtivos filtros={f} mostrando={filtradas.length} total={linhas.length} onRemover={remover} onLimpar={limpar} />
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi destaque rotulo="Total de relatos" valor={filtradas.length} detalhe={`${linhas.length} no total`} />
          <Kpi rotulo="Últimos 7 dias" valor={ultimosDias(filtradas, 7, agora)} detalhe="no filtro atual" />
          <Kpi
            rotulo="Categoria líder" valor={categoriaLider?.nome ?? "-"} detalhe={categoriaLider && `${categoriaLider.total} relatos`}
            onClick={categoriaLider ? () => alternar("categoria", categoriaLider.nome) : undefined} ativo={categoriaLider && f.categoria === categoriaLider.nome}
          />
          <Kpi
            rotulo="Bairro líder" valor={bairroLider?.nome ?? "-"} detalhe={bairroLider && `${bairroLider.total} relatos`}
            onClick={bairroLider ? () => alternar("bairro", bairroLider.nome) : undefined} ativo={bairroLider && f.bairro === bairroLider.nome}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Donut dados={dCategoria} selecionado={f.categoria} onSelecionar={(n) => alternar("categoria", n)} cor={cor}
            subcategorias={dSub} subSelecionada={f.subcategoria} onSubcategoria={(n) => alternar("subcategoria", n)} />
          <BarrasMensais dados={dMes} selecionado={f.mes} onSelecionar={(m) => alternar("mes", m)} />
          <Treemap dados={dBairro} selecionado={f.bairro} onSelecionar={(n) => alternar("bairro", n)} />
          <TopBairros dados={dBairro} selecionado={f.bairro} onSelecionar={(n) => alternar("bairro", n)} />
        </div>

        <NuvemPalavras dados={dPalavras} selecionada={f.q.trim().toLowerCase()} onSelecionar={(p) => alternar("q", p)} />
        <Tabela linhas={filtradas} filtros={f} onFiltro={alternar} />
      </motion.div>
    </MotionConfig>
  );
}
