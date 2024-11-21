from flask import Flask, request, jsonify
import whisper
from datetime import datetime
import requests
import os
from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = Flask(__name__)

load_dotenv()

# Configurações de conexão com o PostgreSQL
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Inicializa o modelo Whisper (ou pode ser chamado quando necessário)
modelo_whisper = whisper.load_model("base")
apikey = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=apikey)


# Modelo da tabela usando SQLAlchemy ORM
class Registro(Base):
    __tablename__ = "registros"
    
    id = Column(Integer, primary_key=True, index=True)
    transcricao = Column(Text, nullable=False)
    categoria = Column(String, nullable=False)
    subcategoria = Column(String, nullable=False)
    tema = Column(String, nullable=False)
    resumo = Column(Text, nullable=False)
    data_hora = Column(DateTime, default=datetime.utcnow)
    bairro = Column(String, nullable=False)

# Criação da tabela no banco de dados
Base.metadata.create_all(bind=engine)

# Função para salvar dados no banco usando SQLAlchemy
def salvar_dados(transcricao, categoria, subcategoria, tema, resumo, bairro):
    session = SessionLocal()
    novo_registro = Registro(
        transcricao=transcricao,
        categoria=categoria,
        subcategoria=subcategoria,
        tema=tema,
        resumo=resumo,
        bairro=bairro
    )
    session.add(novo_registro)
    session.commit()
    session.close()


# Função para download de áudio
def download_audio(audio_url):
    response = requests.get(audio_url)
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Falha ao baixar o áudio: {response.status_code}")

# Rota para receber reclamações
@app.route('/api/reclamacoes', methods=['POST'])
def receber_reclamacao():
    data = request.json
    tipo = data.get("tipo")
    bairro = data.get("localizacao")

    if tipo == "texto":
        reclamacao_texto = data.get("reclamacao")
        relatorio = gerar_relatorio_detalhado(reclamacao_texto)
        salvar_dados(reclamacao_texto, relatorio["categoria"], relatorio["subcategoria"], relatorio["tema"], relatorio["resumo"], bairro)
        return jsonify({"status": "Reclamação de texto processada e salva."})
    
    elif tipo == "audio":
        audio_url = data.get("audio_url")
        audio_data = download_audio(audio_url)
        with open("temp_input_audio.wav", "wb") as f:
            f.write(audio_data)
        
        transcricao = transcrever_audio("temp_input_audio.wav")
        relatorio = gerar_relatorio_detalhado(transcricao)
        salvar_dados(transcricao, relatorio["categoria"], relatorio["subcategoria"], relatorio["tema"], relatorio["resumo"], bairro)
        
        os.remove("temp_input_audio.wav")
        return jsonify({"status": "Reclamação de áudio processada e salva."})
    
    else:
        return jsonify({"error": "Tipo inválido. Use 'texto' ou 'audio'."}), 400

def transcrever_audio(arquivo_audio):
    resultado = modelo_whisper.transcribe(arquivo_audio)
    return resultado['text']

def gerar_relatorio_detalhado(texto):
    prompt = (
            f"Sabendo que se trata de um texto que será encaminhado para uma secretaria municipal."
            f"Primeiro classifique o texto em algumas dessas opções: Meio Ambiente, Educação, Fazenda, Infraestrutura, Limpeza Urbana, Turismo, Saúde, Transporte."
            f"Depois escreva uma subcategoria. Algumas opções de subcategorias: Vagas para Sepultamento, Indicação de Descarte Irregular, Falta de Coleta Domiciliar, Poda de Árvore, Supressão de Árvore, Capinação, Limpeza em Geral, Tapar Buraco, Implantação de Asfalto, Manutenção de Vias não Pavimentadas, Alagamento, Afundamento, Limpeza de Boca de Lobo, Marcação de Exames Consultas e Cirurgias, Unidade de Saúde, Atendimento Medico, Ônibus, Tempo de Viagem, Linhas, Integração, Terminais, Abrigos, VAMU (Cartão de Transporte), Acessibilidade em Transporte. Em seguida defina o tema principal abordado."
            f"Após esses passos, faça um resumo bem objetivo."
            f"sempre me retorne nessa estrutura, exemplo: Categoria: Infraestrutura Subcategoria: Praças Tema: Iluminação Resumo: puxar do texto"
            f"Gere de acordo com esse conteúdo: {texto}"
              )
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    relatorio = response.choices[0].message.content
    print(f"Relatório gerado: {relatorio}")
    
    partes = {part.split(": ")[0].strip(): part.split(": ")[1].strip() for part in relatorio.split("\n") if ": " in part}
    print(f"Partes extraídas: {partes}")
    
    return {
        "categoria": partes.get("Categoria", ""),
        "subcategoria": partes.get("Subcategoria", ""),
        "tema": partes.get("Tema", ""),
        "resumo": partes.get("Resumo", "")
    }
    
# Endpoint para obter relatórios
@app.route('/api/reclamacoes/relatorios', methods=['GET'])
def consultar_reclamacoes():
    session = SessionLocal()
    registros = session.query(Registro).all()
    session.close()

    relatorios = []
    for r in registros:
        relatorios.append({
            "id": r.id,
            "transcricao": r.transcricao,
            "categoria": r.categoria,
            "subcategoria": r.subcategoria,
            "tema": r.tema,
            "resumo": r.resumo,
            "data_hora": r.data_hora,
            "bairro": r.bairro
        })

    return jsonify(relatorios)


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
