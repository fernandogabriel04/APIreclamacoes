import dash
from dash import dcc, html, dash_table
from dash.dependencies import Input, Output, State
import pandas as pd
import plotly.express as px
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from flask import Flask, session
from dash.exceptions import PreventUpdate
from wordcloud import WordCloud
from io import BytesIO
import base64
from nltk.corpus import stopwords
import nltk

nltk.download('stopwords')

load_dotenv()
# Configuração do app Dash e Flask
server = Flask(__name__)
server.secret_key = os.getenv("SECRET_KEY")  # Chave para gerenciar sessões no Flask
app = dash.Dash(__name__, server=server, suppress_callback_exceptions=True)
app.title = "Dashboard de Reclamações"

# Palavra-chave para autenticação
ACCESS_KEY = os.getenv("ACCESS_KEY")  # Pode ser configurada no .env

# String de conexão com o banco de dados PostgreSQL
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)

# Função para buscar dados do banco de dados
def fetch_data():
    query = "SELECT id, categoria, subcategoria, bairro, resumo, data_hora FROM registros"
    df = pd.read_sql(query, engine)
    df["data_hora"] = pd.to_datetime(df["data_hora"])  # Garantir formato datetime
    return df

# Função para buscar dados com base em palavras-chave
def search_data(df, keyword):
    if keyword:
        df = df[df['resumo'].str.contains(keyword, case=False, na=False)]
    return df

# Função para gerar uma imagem de nuvem de palavras
def generate_wordcloud(text):
    custom_stopwords = set(stopwords.words("portuguese")).union({"reclamação", "pessoa", "prefeito", "serviço"})
    wordcloud = WordCloud(width=800, height=400, background_color="white", stopwords=custom_stopwords).generate(text)
    img = BytesIO()
    wordcloud.to_image().save(img, format="PNG")
    img.seek(0)
    return base64.b64encode(img.read()).decode("utf-8")

# Layout da página de login
login_layout = html.Div([
    html.Img(
            src="https://raiox.maceio.al.gov.br//assets/images/logo.svg",
            style={"justifyContent": "center","textAlign": "center", "height": "200px", "marginTop": "20px"}
        ),
    html.H2("Acesso ao Dashboard", style={"textAlign": "center", "marginTop": "20px"}),
    html.Div([
        html.Label("Palavra-chave:"),
        dcc.Input(id="access-key", type="password", placeholder="Digite a palavra-chave", style={"padding": "10px", "borderRadius": "5px", "width": "100%", "marginBottom": "10px"}),
        html.Button("Entrar", id="login-button", n_clicks=0, style={"justifyContent": "center", "textAlign": "center", "backgroundColor": "#007bff", "color": "white", "width": "100%", "padding": "10px", "borderRadius": "5px"}),
        html.Div(id="login-message", style={"justifyContent": "center","marginTop": "10px", "color": "red", "textAlign": "left"})
    ], style={"justifyContent": "center","textAlign": "center","width": "300px", "margin": "0 auto"})
], style={"alignItems": "center", "justifyContent": "center","textAlign": "center", "margin": "0 auto"})

# Layout do dashboard
def dashboard_layout():
    return html.Div([
        html.Div([
            html.Img(
                src="https://raiox.maceio.al.gov.br//assets/images/logo.svg",
                style={"height": "60px", "marginRight": "20px"}
            ),
            html.H1(
                "Dashboard de Reclamações",
                style={"fontFamily": "Amsi, Helvetica, Arial, sans-serif", "color": "#00325C", "display": "inline", "verticalAlign": "middle"}
            )
        ], style={"textAlign": "center", "display": "flex", "alignItems": "center", "justifyContent": "center", "backgroundColor": "#f9f9f9"}),

        # Filtros
        html.Div([
            html.Div([
                html.Label("Filtrar por Ano:", style={"fontWeight": "bold"}),
                dcc.Dropdown(id="ano-dropdown", placeholder="Selecione um ano",
                             style={"width": "100%", "padding": "3px", "borderRadius": "5px", "backgroundColor": "#f9f9f9"})
            ], style={"width": "30%", "display": "inline-block", "padding": "10px"}),

            html.Div([
                html.Label("Filtrar por Categoria:", style={"fontWeight": "bold"}),
                dcc.Dropdown(id="categoria-dropdown", placeholder="Selecione uma categoria",
                             style={"width": "100%", "padding": "3px", "borderRadius": "5px", "backgroundColor": "#f9f9f9"})
            ], style={"width": "30%", "display": "inline-block", "padding": "10px"}),

            html.Div([
                html.Label("Filtrar por Bairro:", style={"fontWeight": "bold"}),
                dcc.Dropdown(id="bairro-dropdown", placeholder="Selecione um bairro",
                             style={"width": "100%", "padding": "3px", "borderRadius": "5px", "backgroundColor": "#f9f9f9"})
            ], style={"width": "30%", "display": "inline-block", "padding": "10px"}),

            html.Div([
                html.Label("Buscar por Palavra-chave:", style={"fontWeight": "bold"}),
                dcc.Input(id="search-box", type="text", placeholder="Digite uma palavra-chave", debounce=True, style={
                    "width": "100%", "padding": "10px", "borderRadius": "5px", "border": "1px solid #ccc", "fontSize": "14px", "backgroundColor": "#f9f9f9", "boxShadow": "0 2px 4px rgba(0, 0, 0, 0.1)", "transition": "all 0.3s ease"
                })
            ], style={"width": "30%", "display": "inline-block", "padding": "10px"})
        ], style={"backgroundColor": "#f9f9f9"}),

        # Gráficos
        html.Div([
            html.Div([
                dcc.Graph(id="grafico-categorias", style={"marginTop": "20px"})
            ], style={"width": "50%", "display": "inline-block"}),

            html.Div([
                dcc.Graph(id="grafico-mensal", style={"marginTop": "20px"})
            ], style={"width": "50%", "display": "inline-block"})
        ]),

        html.Div([
            html.Div([
                dcc.Graph(id="grafico-bairros", style={"marginTop": "20px"})
            ], style={"width": "50%", "display": "inline-block"}),

            html.Div([
                dcc.Graph(id="grafico-top-bairros", style={"marginTop": "20px"})
            ], style={"width": "50%", "display": "inline-block"})
        ]),
        
        # Nuvem de palavras
        html.Div([
            html.H3("Nuvem de Palavras", style={"marginTop": "30px", "textAlign": "center", "color": "#00325C"}),
            html.Img(id="wordcloud-image", style={"display": "block", "margin": "0 auto"})
        ]),
        
        # Tabela de dados
        html.Div([
            html.H3("Tabela de Reclamações", style={"marginTop": "30px", "textAlign": "center", "color": "#00325C"}),
            dash_table.DataTable(
                id="tabela-dados",
                columns=[
                    {"name": "ID", "id": "id"},
                    {"name": "Categoria", "id": "categoria"},
                    {"name": "Subcategoria", "id": "subcategoria"},
                    {"name": "Bairro", "id": "bairro"},
                    {"name": "Resumo", "id": "resumo"},
                    {"name": "Data/Hora", "id": "data_hora"}
                ],
                style_table={'overflowX': 'auto'},
                style_header={
                    'backgroundColor': '#007bff',
                    'color': 'white',
                    'fontWeight': 'bold',
                    'textAlign': 'center'
                },
                style_cell={
                    'backgroundColor': '#f9f9f9',
                    'color': '#333',
                    'textAlign': 'left',
                    'padding': '5px',
                    'fontFamily': 'Arial'
                },
                page_size=10,
                style_data_conditional=[
                    {'if': {'row_index': 'odd'}, 'backgroundColor': '#f2f2f2'}
                ]
            )
        ]),
        
        # Footer
        html.Footer(
            html.Div([
                html.P("© 2024 Todos os direitos reservados. | Ouvidoria Inteligente", style={"textAlign": "center", "fontSize": "14px", "color": "#555"}),
                html.P("Desenvolvido por FGC DESENVOLVIMENTO E TECNOLOGIA", style={"textAlign": "center", "fontSize": "14px", "color": "#555"}),
            ], style={"backgroundColor": "#f1f1f1", "padding": "20px", "borderTop": "1px solid #ddd"})
        )
    ])

# Definir layout inicial como página de login
app.layout = html.Div(id="main-layout", children=login_layout)

# Callback unificado para autenticação
@app.callback(
    Output("main-layout", "children"),
    [Input("login-button", "n_clicks")],
    [State("access-key", "value")]
)
def handle_authentication(login_clicks, access_key):
    if not dash.callback_context.triggered:
        raise PreventUpdate

    if login_clicks and access_key == ACCESS_KEY:
        session["authenticated"] = True  # Define a sessão como autenticada
        return dashboard_layout()
    else:
        return html.Div([login_layout, html.Div("Palavra-chave inválida.", style={"color": "red", "textAlign": "center"})])

# Callback para atualizar os filtros
@app.callback(
    [Output("ano-dropdown", "options"),
     Output("categoria-dropdown", "options"),
     Output("bairro-dropdown", "options")],
    [Input("main-layout", "children")]
)
def update_filtros(_):
    if not session.get("authenticated"):
        raise PreventUpdate

    df = fetch_data()
    anos = [{"label": str(ano), "value": str(ano)} for ano in df["data_hora"].dt.year.unique()]
    categorias = [{"label": cat, "value": cat} for cat in df["categoria"].unique()]
    bairros = [{"label": bairro, "value": bairro} for bairro in df["bairro"].unique()]
    return anos, categorias, bairros

# Callback para atualizar gráficos e tabela com a opção de busca por palavra-chave
@app.callback(
    [Output("grafico-categorias", "figure"),
     Output("grafico-bairros", "figure"),
     Output("grafico-mensal", "figure"),
     Output("grafico-top-bairros", "figure"),
     Output("tabela-dados", "data"),
     Output("wordcloud-image", "src")],
    [Input("ano-dropdown", "value"),
     Input("categoria-dropdown", "value"),
     Input("bairro-dropdown", "value"),
     Input("search-box", "value")]
)

def update_dashboard(ano, categoria, bairro, keyword):
    if not session.get("authenticated"):
        raise PreventUpdate

    df = fetch_data()

    # Aplicar filtros básicos
    if ano:
        df = df[df["data_hora"].dt.year == int(ano)]
    if categoria:
        df = df[df["categoria"] == categoria]
    if bairro:
        df = df[df["bairro"] == bairro]

    # Filtrar por palavra-chave
    df = search_data(df, keyword)

    # Gráfico de reclamações por categoria
    grafico_categorias = px.pie(df, names="categoria", title="Reclamações por Categoria")

    # Gráfico de reclamações por bairro
    grafico_bairros = px.pie(df, names="bairro", title="Reclamações por Bairro")

    # Gráfico de reclamações por mês
    df["mes"] = df["data_hora"].dt.to_period("M").astype(str)  # Formato 'YYYY-MM'

    # Agrupamento por mês e contagem
    df_mensal = df.groupby("mes").size().reset_index(name="total")

    # Ordenar os meses para garantir que o eixo X fique categórico e na ordem correta
    df_mensal = df_mensal.sort_values("mes")

    grafico_mensal = px.bar(
        df_mensal,
        x="mes",
        y="total",
        title="Reclamações por Mês",
        labels={"mes": "Mês", "total": "Total"}
    )

    # Forçar o eixo X a ser categórico
    grafico_mensal.update_xaxes(type="category")

    # Gráfico top 5 bairros
    top_bairros = df["bairro"].value_counts().nlargest(5).reset_index()
    top_bairros.columns = ["bairro", "total"]
    grafico_top_bairros = px.bar(
        top_bairros, x="bairro", y="total", title="Top 5 Bairros com Mais Reclamações",
        labels={"bairro": "Bairro", "total": "Total"},
        color="bairro"
    )
    
    # Gerar tabela
    tabela_dados = df.to_dict("records")
    
    # Gerar nuvem de palavras
    if not df.empty:
        text = " ".join(df["resumo"].dropna())
        wordcloud_src = "data:image/png;base64,{}".format(generate_wordcloud(text))
    else:
        wordcloud_src = None

    return grafico_categorias, grafico_bairros, grafico_mensal, grafico_top_bairros, tabela_dados, wordcloud_src

if __name__ == '__main__':
    app.run_server(debug=False, host="0.0.0.0", port=8050)
