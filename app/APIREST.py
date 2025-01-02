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
import pytz
import soundfile as sf
import numpy as np
import librosa

app = Flask(__name__)

load_dotenv()

# Configurações de conexão com o PostgreSQL
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=2, pool_recycle=30, pool_pre_ping=True, pool_use_lifo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Inicializa o modelo Whisper (ou pode ser chamado quando necessário)
modelo_whisper = whisper.load_model("small")
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
    data_hora = Column(DateTime, default=lambda: datetime.now(pytz.timezone('America/Sao_Paulo')))
    bairro = Column(String, nullable=False)
    origem = Column(String, nullable=False)

# Criação da tabela no banco de dados
Base.metadata.create_all(bind=engine)

# Função para salvar dados no banco usando SQLAlchemy
def salvar_dados(transcricao, categoria, subcategoria, tema, resumo, bairro, origem):
    session = SessionLocal()
    novo_registro = Registro(
        transcricao=transcricao,
        categoria=categoria,
        subcategoria=subcategoria,
        tema=tema,
        resumo=resumo,
        bairro=bairro,
        origem=origem
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

# Função para pré-processar o áudio
def pre_processar_audio(arquivo_audio):
    # Carregar o áudio usando librosa
    audio, sr = librosa.load(arquivo_audio, sr=None)  # sr=None mantém a taxa de amostragem original
    
    # Normalizar o volume do áudio
    audio = audio / np.max(np.abs(audio))  # Normaliza o volume

    # Remover ruído usando um filtro simples (pode ser aprimorado com outras técnicas)
    audio = librosa.effects.preemphasis(audio)  # Aplica preênfase para ajudar a reduzir ruído

    # Salvar o áudio pré-processado
    temp_file = "temp_preprocessed_audio.wav"
    sf.write(temp_file, audio, sr)  # Salva o áudio pré-processado
    return temp_file


BAIRROS_VALIDOS = ["Antares", "Bebedouro", "Benedito Bentes", "Bom Parto", "Canaã", "Centro", "Chã da Jaqueira", "Chã de Bebedouro", "Cidade Universitária", "Clima Bom", "Cruz das Almas", "Eustáquio Gomes", "Farol", "Fernão Velho", "Feitosa", "Garça Torta", "Gruta de Lourdes", "Guaxuma", "Ipioca", "Jacarecica", "Jacintinho", "Jardim Petrópolis", "Jaraguá", "Jatiúca", "Levada", "Mangabeiras", "Mutange", "Pajuçara", "Pinheiro", "Pontal da Barra", "Poço", "Ponta Verde", "Prado", "Riacho Doce", "Rio Novo", "Santa Lúcia", "São Jorge", "Serraria", "Tabuleiro do Martins", "Trapiche da Barra", "Vergel do Lago"]
ORIGENS_VALIDAS = ["Whatsapp", "Cabine Antares", "Cabine Bebedouro", "Cabine Benedito Bentes", "Cabine Bom Parto", "Cabine Canaã", "Cabine Centro", "Cabine Chã da Jaqueira", "Cabine Chã de Bebedouro", "Cabine Cidade Universitária", "Cabine Clima Bom", "Cabine Cruz das Almas", "Cabine Eustáquio Gomes", "Cabine Farol", "Cabine Fernão Velho", "Cabine Feitosa", "Cabine Garça Torta", "Cabine Gruta de Lourdes", "Cabine Guaxuma", "Cabine Ipioca", "Cabine Jacarecica", "Cabine Jacintinho", "Cabine Jardim Petrópolis", "Cabine Jaraguá", "Cabine Jatiúca", "Cabine Levada", "Cabine Mangabeiras", "Cabine Mutange", "Cabine Pajuçara", "Cabine Pinheiro", "Cabine Pontal da Barra", "Cabine Poço", "Cabine Ponta Verde", "Cabine Prado", "Cabine Riacho Doce", "Cabine Rio Novo", "Cabine Santa Lúcia", "Cabine São Jorge", "Cabine Serraria", "Cabine Tabuleiro do Martins", "Cabine Trapiche da Barra", "Cabine Vergel do Lago"]

# Rota para receber reclamações
@app.route('/api/reclamacoes', methods=['POST'])
def receber_reclamacao():
    data = request.json
    tipo = data.get("tipo")
    bairro = data.get("localizacao")
    origem = data.get("origem")
    

    if bairro not in BAIRROS_VALIDOS or origem not in ORIGENS_VALIDAS:
        return jsonify({"error": "Bairro ou origem inválidos."}), 400

    if tipo == "texto":
        reclamacao_texto = data.get("reclamacao")
        relatorio = gerar_relatorio_detalhado(reclamacao_texto)
        
        if "error" in relatorio:  # Se o retorno for um erro, já retorna a mensagem de erro
            return jsonify(relatorio), 400
        
        salvar_dados(reclamacao_texto, relatorio["categoria"], relatorio["subcategoria"], relatorio["tema"], relatorio["resumo"], bairro, origem)
        return jsonify({"status": "Reclamação de texto processada e salva."})
    
    elif tipo == "audio":
        audio_url = data.get("audio_url")
        try:
            audio_data = download_audio(audio_url)
            with open("temp_input_audio.wav", "wb") as f:
                f.write(audio_data)
            
            # Pré-processa o áudio
            arquivo_audio_processado = pre_processar_audio("temp_input_audio.wav")
            
            transcricao = transcrever_audio(arquivo_audio_processado)
            transcricao = corrigir_transcricao(transcricao)
            relatorio = gerar_relatorio_detalhado(transcricao)
            
            if "error" in relatorio:  # Se o retorno for um erro, já retorna a mensagem de erro
                return jsonify(relatorio), 400
            
            salvar_dados(transcricao, relatorio["categoria"], relatorio["subcategoria"], relatorio["tema"], relatorio["resumo"], bairro, origem)
                
            return jsonify({"status": "Reclamação de áudio processada e salva."})
        finally:
            # Remove os arquivos temporários
            if os.path.exists("temp_input_audio.wav"):
                os.remove("temp_input_audio.wav")
            if os.path.exists("temp_preprocessed_audio.wav"):
                os.remove("temp_preprocessed_audio.wav")
    else:
        return jsonify({"error": "Tipo inválido. Use 'texto' ou 'audio'."}), 400
            

def transcrever_audio(arquivo_audio):
    resultado = modelo_whisper.transcribe(arquivo_audio, language='pt', task='transcribe', fp16=False)
    return resultado['text']

def corrigir_transcricao(texto):
    instructions = (
        "Você é um assistente de correção de textos que segue as normas da língua portuguesa. O texto a ser corrigido é sobre um feedback que se passa na cidade de Maceió, então leve em consideração palavras, expressões e localizações que sejam comuns ou específicas de Maceió. "
    )
    prompt = f"Reescreva o texto abaixo de forma clara e corrigida:\n\n{texto}"
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": instructions},
                  {"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

def gerar_relatorio_detalhado(texto):
    # Validação do texto de entrada
    if not texto or len(texto.strip()) < 20:  # Verifica se o texto tem menos de 30 caracteres
        return {"error": "A ocorrência precisa ser referente ao município."}
    
    instructions = (
        f"Você é um assistente que classifica textos de denúncias/reclamações direcionados a uma prefeitura."
        f"Responda no formato: "
        f"Categoria: <categoria>\n"
        f"Subcategoria: <subcategoria>\n"
        f"Tema: <tema>\n"
        f"Resumo: <resumo>\n\n"
        f"Se o texto NÃO estiver relacionado a problemas ou sugestões para melhorias no município, utilize as seguintes respostas padrões:\n"
        f"Categoria: 'Sem categoria'\n"
        f"Subcategoria: 'Sem subcategoria'\n"
        f"Tema: 'Sem tema'\n"
        f"Resumo: 'Sem resumo'"
    )
    prompt = (
            "Para cada texto, siga estas etapas: "
            "1. Classifique o texto em uma das seguintes categorias principais: Meio Ambiente, Educação, Fazenda, Infraestrutura, Limpeza Urbana, Turismo, Saúde, Transporte. "
            "2. Dentro da categoria escolhida, atribua uma subcategoria entre as opções: Vagas para Sepultamento, Indicação de Descarte Irregular, Falta de Coleta Domiciliar, Poda de Árvore, Supressão de Árvore, Capinação, Limpeza em Geral, Tapar Buraco, Implantação de Asfalto, Manutenção de Vias não Pavimentadas, Alagamento, Afundamento, Limpeza de Boca de Lobo, Marcação de Exames Consultas e Cirurgias, Unidade de Saúde, Atendimento Médico, Ônibus, Tempo de Viagem, Linhas, Integração, Terminais, Abrigos, VAMU (Cartão de Transporte), Acessibilidade em Transporte. Se for necessário crie uma subcategoria condizente com o texto. "
            "3. Identifique o tema principal do texto. "
            "4. Crie um resumo objetivo baseado no conteúdo da reclamação. "
            f"Agora analise o seguinte texto e realize o processo: '{texto}'"
              )
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ],
        
    )
    relatorio = response.choices[0].message.content
    print(f"Relatório gerado: {relatorio}")
    
    partes = {part.split(": ")[0].strip(): part.split(": ")[1].strip() for part in relatorio.split("\n") if ": " in part}
    print(f"Partes extraídas: {partes}")
    categoria = partes.get("Categoria", "Sem categoria").strip()
    subcategoria = partes.get("Subcategoria", "Sem subcategoria").strip()
    tema = partes.get("Tema", "Sem tema").strip()
    resumo = partes.get("Resumo", "Sem resumo").strip()
    
    # Verificar se algum campo tem os valores padrão "Sem categoria", "Sem subcategoria", "Sem tema", ou "Sem resumo"
    if categoria == "Sem categoria" or subcategoria == "Sem subcategoria" or tema == "Sem tema" or resumo == "Sem resumo":
        
        return {"error": "A ocorrência precisa ser referente ao município."}

    
    return {
        "categoria": categoria,
        "subcategoria": subcategoria,
        "tema": tema,
        "resumo": resumo
    }

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
