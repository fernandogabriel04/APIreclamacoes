from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()


def normalizar_db_url(url):
    """Aceita as strings que Railway/Supabase/Heroku entregam e força o driver psycopg2."""
    if not url:
        return "sqlite:///./local.db"
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 26 * 1024 * 1024  # 26 MB (limite de áudio da OpenAI é 25 MB)

# CORS: o formulário público chama esta API direto do navegador (origem do frontend)
_origens = os.getenv("CORS_ORIGINS", "*")
CORS(app, resources={r"/api/*": {"origins": "*" if _origens == "*" else [o.strip() for o in _origens.split(",")]}})

# Modelos de IA (sobrescreva no .env se quiser trocar sem mexer no código)
MODELO_TRANSCRICAO = os.getenv("MODELO_TRANSCRICAO", "gpt-4o-transcribe")
MODELO_CLASSIFICACAO = os.getenv("MODELO_CLASSIFICACAO", "gpt-4o-mini")

# Configurações de conexão com o banco de dados (SQLite em dev, Postgres em produção)
DATABASE_URL = normalizar_db_url(os.getenv("DB_URL"))
_e_sqlite = DATABASE_URL.startswith("sqlite")
_pool_kwargs = {} if _e_sqlite else dict(
    pool_size=5, max_overflow=2, pool_recycle=300, pool_pre_ping=True
)
engine = create_engine(DATABASE_URL, **_pool_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

apikey = os.getenv("OPENAI_API_KEY")

_openai_client = None


def get_openai_client():
    """Cria o cliente OpenAI sob demanda para o servidor subir mesmo sem a chave.
    As rotas que usam IA falham de forma controlada se OPENAI_API_KEY não estiver definida."""
    global _openai_client
    if _openai_client is None:
        if not apikey:
            raise RuntimeError("OPENAI_API_KEY não configurada no .env")
        _openai_client = OpenAI(api_key=apikey)
    return _openai_client

# Chave usada pelo painel de acompanhamento (GET /api/registros)
ACCESS_KEY = os.getenv("ACCESS_KEY")


# Modelo da tabela usando SQLAlchemy ORM
class Registro(Base):
    __tablename__ = "registros"
    
    id = Column(Integer, primary_key=True, index=True)
    transcricao = Column(Text, nullable=False)
    categoria = Column(String, nullable=False)
    subcategoria = Column(String, nullable=False)
    tema = Column(String, nullable=False)
    resumo = Column(Text, nullable=False)
    data_hora = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    municipio = Column(String, nullable=False)   # município (dos 102 de Alagoas)
    bairro = Column(String, nullable=True)       # bairro / povoado / distrito dentro do município
    origem = Column(String, nullable=False)
    telefone = Column(String(20), nullable=True)

# Criação da tabela no banco de dados
Base.metadata.create_all(bind=engine)


def _migrar_schema():
    """Converge bancos antigos para o schema municipio + bairro.

    Histórico:
      - versão original: coluna 'bairro' guardava o bairro
      - versão intermediária: 'bairro' virou município e 'cidade' guardava o bairro
      - versão atual: 'municipio' guarda o município e 'bairro' o bairro

    Num Postgres novo (produção) isto é praticamente um no-op — o create_all já
    monta o schema correto. Cada passo é tolerante a falha para não quebrar o boot
    com múltiplos workers do gunicorn subindo ao mesmo tempo.
    """
    from sqlalchemy import inspect, text

    def tenta(conn, sql):
        try:
            conn.execute(text(sql))
        except Exception as exc:  # coluna já existe, concorrência entre workers, etc.
            app.logger.info("migração ignorou: %s (%s)", sql, exc)

    try:
        colunas = [c["name"] for c in inspect(engine).get_columns("registros")]
    except Exception:
        return  # tabela ainda não existe

    with engine.begin() as conn:
        if "municipio" not in colunas:
            tenta(conn, "ALTER TABLE registros ADD COLUMN municipio VARCHAR")
            tenta(conn, "UPDATE registros SET municipio = bairro WHERE municipio IS NULL")
        if "cidade" in colunas:
            tenta(conn, "UPDATE registros SET bairro = cidade")
            tenta(conn, "ALTER TABLE registros DROP COLUMN cidade")
        tenta(conn, "UPDATE registros SET origem = 'Site' WHERE origem LIKE 'Ouvidoria Web%'")


_migrar_schema()


@app.get("/")
def raiz():
    return jsonify({"servico": "Ouvidoria JHC — API", "ok": True})


@app.get("/health")
def health():
    return jsonify({"ok": True})

# Função para salvar dados no banco usando SQLAlchemy
def salvar_dados(transcricao, categoria, subcategoria, tema, resumo, municipio, origem, telefone, bairro=None):
    session = SessionLocal()
    novo_registro = Registro(
        transcricao=transcricao,
        categoria=categoria,
        subcategoria=subcategoria,
        tema=tema,
        resumo=resumo,
        municipio=municipio,
        bairro=bairro,
        origem=origem,
        telefone=telefone
    )
    session.add(novo_registro)
    session.commit()
    session.close()


# Os 102 municípios do estado de Alagoas
MUNICIPIOS_ALAGOAS = [
    "Água Branca", "Anadia", "Arapiraca", "Atalaia", "Barra de Santo Antônio",
    "Barra de São Miguel", "Batalha", "Belém", "Belo Monte", "Boca da Mata",
    "Branquinha", "Cacimbinhas", "Cajueiro", "Campestre", "Campo Alegre",
    "Campo Grande", "Canapi", "Capela", "Carneiros", "Chã Preta",
    "Coité do Nóia", "Colônia Leopoldina", "Coqueiro Seco", "Coruripe", "Craíbas",
    "Delmiro Gouveia", "Dois Riachos", "Estrela de Alagoas", "Feira Grande", "Feliz Deserto",
    "Flexeiras", "Girau do Ponciano", "Ibateguara", "Igaci", "Igreja Nova",
    "Inhapi", "Jacaré dos Homens", "Jacuípe", "Japaratinga", "Jaramataia",
    "Jequiá da Praia", "Joaquim Gomes", "Jundiá", "Junqueiro", "Lagoa da Canoa",
    "Limoeiro de Anadia", "Maceió", "Major Isidoro", "Mar Vermelho", "Maragogi",
    "Maravilha", "Marechal Deodoro", "Maribondo", "Mata Grande", "Matriz de Camaragibe",
    "Messias", "Minador do Negrão", "Monteirópolis", "Murici", "Novo Lino",
    "Olho d'Água das Flores", "Olho d'Água do Casado", "Olho d'Água Grande", "Olivença", "Ouro Branco",
    "Palestina", "Palmeira dos Índios", "Pão de Açúcar", "Pariconha", "Paripueira",
    "Passo de Camaragibe", "Paulo Jacinto", "Penedo", "Piaçabuçu", "Pilar",
    "Pindoba", "Piranhas", "Poço das Trincheiras", "Porto Calvo", "Porto de Pedras",
    "Porto Real do Colégio", "Quebrangulo", "Rio Largo", "Roteiro", "Santa Luzia do Norte",
    "Santana do Ipanema", "Santana do Mundaú", "São Brás", "São José da Laje", "São José da Tapera",
    "São Luís do Quitunde", "São Miguel dos Campos", "São Miguel dos Milagres", "São Sebastião", "Satuba",
    "Senador Rui Palmeira", "Tanque d'Arca", "Taquarana", "Teotônio Vilela", "Traipu",
    "União dos Palmares", "Viçosa",
]

def origem_valida(origem):
    # "Site" = formulário público (/); "Cabine <nome>" = cabine física (/cabine); "Whatsapp" = bot
    return bool(origem) and (origem in ("Site", "Whatsapp") or origem.startswith("Cabine "))

# Rota para receber manifestações (áudio via multipart/form-data, texto via JSON)
@app.route('/api/reclamacoes', methods=['POST'])
def receber_reclamacao():
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        campos = request.form
        arquivo = request.files.get("audio")
        tipo = "audio"
    else:
        campos = request.get_json(silent=True) or {}
        arquivo = None
        tipo = campos.get("tipo", "texto")

    municipio = campos.get("municipio") or campos.get("localizacao")
    bairro = (campos.get("bairro") or "").strip() or None
    origem = campos.get("origem")
    telefone = (campos.get("telefone") or "").strip() or None

    if municipio not in MUNICIPIOS_ALAGOAS or not origem_valida(origem):
        return jsonify({"error": "Município ou origem inválidos."}), 400

    if tipo == "texto":
        transcricao = (campos.get("reclamacao") or "").strip()
        if not transcricao:
            return jsonify({"error": "Escreva a sua manifestação."}), 400
        if len(transcricao) > 2000:
            return jsonify({"error": "O texto excede o limite de 2000 caracteres."}), 400

    elif tipo == "audio":
        if arquivo is None or not arquivo.filename:
            return jsonify({"error": "Envie o arquivo de áudio."}), 400
        dados_audio = arquivo.read()
        if len(dados_audio) < 2000:
            return jsonify({"error": "O áudio ficou vazio. Grave novamente, mais perto do microfone."}), 400
        if len(dados_audio) > 25 * 1024 * 1024:
            return jsonify({"error": "O áudio é muito grande (máximo 25 MB)."}), 400
        try:
            transcricao = transcrever_audio(arquivo.filename, dados_audio, arquivo.mimetype)
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 503
        except Exception:
            app.logger.exception("Falha ao transcrever o áudio")
            return jsonify({"error": "Não foi possível transcrever o áudio. Tente novamente em instantes."}), 502

    else:
        return jsonify({"error": "Tipo inválido. Use 'texto' ou 'audio'."}), 400

    try:
        relatorio = gerar_relatorio_detalhado(transcricao)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception:
        app.logger.exception("Falha ao classificar a manifestação")
        return jsonify({"error": "Não foi possível processar a manifestação. Tente novamente em instantes."}), 502

    if "error" in relatorio:
        return jsonify(relatorio), 400

    salvar_dados(transcricao, relatorio["categoria"], relatorio["subcategoria"],
                 relatorio["tema"], relatorio["resumo"], municipio, origem, telefone, bairro)
    return jsonify({"status": "Manifestação recebida. Obrigado por falar com o JHC!"})
            

# Rota de leitura para o painel de acompanhamento das manifestações
@app.route('/api/registros', methods=['GET'])
def listar_registros():
    chave = request.headers.get("X-Access-Key")
    if not ACCESS_KEY or chave != ACCESS_KEY:
        return jsonify({"error": "Não autorizado."}), 401

    session = SessionLocal()
    try:
        registros = session.query(Registro).order_by(Registro.id).all()
        dados = [
            {
                "id": r.id,
                "origem": r.origem,
                "categoria": r.categoria,
                "subcategoria": r.subcategoria,
                "tema": r.tema,
                "resumo": r.resumo,
                "municipio": r.municipio,
                "bairro": r.bairro,
                "telefone": r.telefone,
                "data_hora": r.data_hora.isoformat() if r.data_hora else None,
            }
            for r in registros
        ]
        return jsonify(dados)
    finally:
        session.close()


PROMPT_TRANSCRICAO = (
    "Manifestação falada de um cidadão para a Ouvidoria do Governo do Estado de Alagoas. "
    "Pode citar municípios de Alagoas (Maceió, Arapiraca, Penedo, Rio Largo, Palmeira dos Índios, "
    "União dos Palmares, Delmiro Gouveia, Santana do Ipanema, Coruripe, Marechal Deodoro) e "
    "serviços públicos: posto de saúde, UPA, SAMU, VAMU, tapa-buraco, boca de lobo, coleta de lixo, "
    "iluminação pública, transporte intermunicipal, regularização fundiária, escola estadual."
)

CATEGORIAS_VALIDAS = [
    "Meio Ambiente", "Educação", "Infraestrutura", "Limpeza Urbana", "Turismo",
    "Saúde", "Transporte", "Segurança Pública", "Habitação", "Agricultura e Pesca",
    "Assistência Social", "Emprego e Renda", "Outros",
]

SCHEMA_RELATORIO = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "pertinente": {
            "type": "boolean",
            "description": (
                "true se a manifestação for uma reclamação, denúncia, sugestão ou pedido de "
                "melhoria para o estado de Alagoas ou um de seus municípios. false se for áudio "
                "vazio/inaudível, teste, ou assunto sem relação com o poder público."
            ),
        },
        "categoria": {"type": "string", "enum": CATEGORIAS_VALIDAS},
        "subcategoria": {
            "type": "string",
            "description": "Assunto específico dentro da categoria, em poucas palavras (ex.: 'Tapa-buraco', 'Falta de medicamentos'). String vazia se não for pertinente.",
        },
        "tema": {
            "type": "string",
            "description": "Tema principal em 2 a 5 palavras. String vazia se não for pertinente.",
        },
        "resumo": {
            "type": "string",
            "description": "Resumo objetivo em 1 ou 2 frases, na 3ª pessoa, sem opinião. String vazia se não for pertinente.",
        },
    },
    "required": ["pertinente", "categoria", "subcategoria", "tema", "resumo"],
}


def transcrever_audio(nome_arquivo, dados, mimetype):
    resposta = get_openai_client().audio.transcriptions.create(
        model=MODELO_TRANSCRICAO,
        file=(nome_arquivo or "audio.webm", dados, mimetype or "application/octet-stream"),
        language="pt",
        prompt=PROMPT_TRANSCRICAO,
        response_format="text",
    )
    return resposta if isinstance(resposta, str) else getattr(resposta, "text", str(resposta))


def gerar_relatorio_detalhado(texto):
    texto = (texto or "").strip()
    if len(texto) < 15:
        return {"error": "Não foi possível entender a manifestação. Grave novamente, com o microfone mais perto e num lugar mais silencioso."}

    instrucoes = (
        "Você classifica manifestações enviadas à Ouvidoria da campanha de JHC ao Governo do "
        "Estado de Alagoas. São reclamações, denúncias, sugestões ou pedidos de melhoria para o "
        "estado e seus municípios. O texto vem de uma transcrição de áudio e pode ter pequenos "
        "erros — interprete a intenção do cidadão. Responda apenas no schema JSON."
    )
    resposta = get_openai_client().chat.completions.create(
        model=MODELO_CLASSIFICACAO,
        temperature=0,
        messages=[
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": texto},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "relatorio_ouvidoria", "strict": True, "schema": SCHEMA_RELATORIO},
        },
    )
    dados = json.loads(resposta.choices[0].message.content)

    if not dados.get("pertinente"):
        return {"error": "A manifestação precisa ser sobre um assunto do estado de Alagoas ou de um município. Conte o que você quer que melhore."}

    return {
        "categoria": dados["categoria"],
        "subcategoria": (dados.get("subcategoria") or "").strip() or "Não especificada",
        "tema": (dados.get("tema") or "").strip() or dados["categoria"],
        "resumo": (dados.get("resumo") or "").strip() or texto[:280],
    }

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
