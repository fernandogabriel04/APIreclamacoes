"use client";

import { motion } from "motion/react";
import { item } from "./movimento";

const CAMPOS = [
  { nome: "ano", rotulo: "Ano", lista: "anos" },
  { nome: "origem", rotulo: "Origem", lista: "origens" },
  { nome: "categoria", rotulo: "Categoria", lista: "categorias" },
  { nome: "bairro", rotulo: "Bairro", lista: "bairros" },
];

export default function Filtros({ opcoes, valores, onFiltro, onBusca }) {
  return (
    <motion.div variants={item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-white rounded-2xl shadow-card p-4">
      {CAMPOS.map((c) => (
        <label key={c.nome} className="text-sm font-bold text-maceio-navy">
          {c.rotulo}
          <select
            value={valores[c.nome]}
            onChange={(e) => onFiltro(c.nome, e.target.value, true)}
            className="mt-1 w-full rounded-lg border-2 border-maceio-line bg-white px-3 py-2 font-normal text-maceio-ink transition-colors hover:border-maceio-blue"
          >
            <option value="">Todos</option>
            {opcoes[c.lista].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      ))}
      <label className="text-sm font-bold text-maceio-navy">
        Palavra-chave
        <input
          type="search" value={valores.q} onChange={(e) => onBusca(e.target.value)} placeholder="Digite para buscar"
          className="mt-1 w-full rounded-lg border-2 border-maceio-line px-3 py-2 font-normal text-maceio-ink transition-colors hover:border-maceio-blue"
        />
      </label>
    </motion.div>
  );
}
