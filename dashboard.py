import streamlit as st
import pandas as pd
import psycopg2
import plotly.express as px
from sqlalchemy import create_engine
from datetime import datetime
import os

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

# Conectar ao banco de dados PostgreSQL
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)

# Função para carregar dados da tabela `registros`
@st.cache_data
def carregar_dados():
    query = "SELECT * FROM registros"
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    return df

# Carregar os dados
df = carregar_dados()

# Título do dashboard
st.title("Dashboard de Reclamações")

# Exibir tabela completa
st.header("Dados de Reclamações")
st.dataframe(df)

# Filtros
st.sidebar.header("Filtros")
categoria_filtro = st.sidebar.multiselect("Categoria", df["categoria"].unique())
subcategoria_filtro = st.sidebar.multiselect("Subcategoria", df["subcategoria"].unique())
bairro_filtro = st.sidebar.multiselect("Bairro", df["bairro"].unique())

# Aplicar filtros
if categoria_filtro:
    df = df[df["categoria"].isin(categoria_filtro)]
if subcategoria_filtro:
    df = df[df["subcategoria"].isin(subcategoria_filtro)]
if bairro_filtro:
    df = df[df["bairro"].isin(bairro_filtro)]

# Exibir dados filtrados
st.header("Dados Filtrados")
st.dataframe(df)

# Gráficos
st.header("Visualizações")

# Gráfico de Reclamações por Categoria
st.subheader("Reclamações por Categoria")
grafico_categoria = df['categoria'].value_counts().reset_index()
grafico_categoria.columns = ['Categoria', 'Quantidade']
fig_categoria = px.bar(grafico_categoria, x='Categoria', y='Quantidade', title="Quantidade de Reclamações por Categoria")
st.plotly_chart(fig_categoria)

# Gráfico de Reclamações ao Longo do Tempo
st.subheader("Reclamações ao Longo do Tempo")
df['data_hora'] = pd.to_datetime(df['data_hora'])
grafico_tempo = df.groupby(df['data_hora'].dt.date).size().reset_index(name='Quantidade')
fig_tempo = px.line(grafico_tempo, x='data_hora', y='Quantidade', title="Quantidade de Reclamações ao Longo do Tempo")
st.plotly_chart(fig_tempo)

# Gráfico de Reclamações por Bairro
st.subheader("Reclamações por Bairro")
grafico_bairro = df['bairro'].value_counts().reset_index()
grafico_bairro.columns = ['Bairro', 'Quantidade']
fig_bairro = px.bar(grafico_bairro, x='Bairro', y='Quantidade', title="Quantidade de Reclamações por Bairro")
st.plotly_chart(fig_bairro)

# Gráfico de Reclamações por Subcategoria
st.subheader("Reclamações por Subcategoria")
grafico_subcategoria = df['subcategoria'].value_counts().reset_index()
grafico_subcategoria.columns = ['Subcategoria', 'Quantidade']
fig_subcategoria = px.bar(grafico_subcategoria, x='Subcategoria', y='Quantidade', title="Quantidade de Reclamações por Subcategoria")
st.plotly_chart(fig_subcategoria)

# Exibir resumo final
st.header("Resumo")
st.write(f"Total de Reclamações: {len(df)}")

# Rodapé
st.sidebar.markdown("**Dashboard de Reclamações** - Desenvolvido com Streamlit")
