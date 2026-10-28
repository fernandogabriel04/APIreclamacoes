import "server-only";
import { sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const registros = pgTable("registros", {
  id: serial("id").primaryKey(),
  transcricao: text("transcricao").notNull(),
  categoria: varchar("categoria").notNull(),
  subcategoria: varchar("subcategoria").notNull(),
  tema: varchar("tema").notNull(),
  resumo: text("resumo").notNull(),
  dataHora: timestamp("data_hora", { mode: "string" }).default(sql`timezone('America/Sao_Paulo', now())`),
  bairro: varchar("bairro").notNull(),
  origem: varchar("origem").notNull(),
  telefone: varchar("telefone", { length: 20 }),
});

export const limites = pgTable("limites", {
  chave: text("chave").primaryKey(),
  contagem: integer("contagem").notNull(),
  janelaInicio: timestamp("janela_inicio", { withTimezone: true }).notNull(),
});
