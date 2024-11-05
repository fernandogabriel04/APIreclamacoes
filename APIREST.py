from flask import Flask, request, jsonify
import whisper
import sqlite3
from datetime import datetime
import requests
import os
from openai import OpenAI
import os

app = Flask(__name__)

# Inicializa o modelo Whisper (ou pode ser chamado quando necessário)
modelo_whisper = whisper.load_model("base")
apikey = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=apikey)

# Configuração do banco de dados
def inicializar_banco():
    conexao = sqlite3.connect("dados_audio.db")
    cursor = conexao.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS registros (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        transcricao TEXT,
                        categoria TEXT,
                        subcategoria TEXT,
                        tema TEXT,
                        resumo TEXT,
                        data_hora TEXT,
                        bairro TEXT
                    )''')
    conexao.commit()
    conexao.close()

# Função para salvar dados no banco
def salvar_dados(transcricao, categoria, subcategoria, tema, resumo, bairro):
    data_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conexao = sqlite3.connect("dados_audio.db")
    cursor = conexao.cursor()
    cursor.execute("INSERT INTO registros (transcricao, categoria, subcategoria, tema, resumo, data_hora, bairro) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   (transcricao, categoria, subcategoria, tema, resumo, data_hora, bairro))
    conexao.commit()
    conexao.close()


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
            f"Primeiro classifique o texto em algumas dessas opções: Meio Ambiente, Educação, Fazenda, Infraestrutura, Limpeza Urbana, Turismo, Saúde, Mobilidade Urbana."
            f"Depois escreva uma subcategoria. Em seguida defina o tema principal abordado."
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

if __name__ == '__main__':
    inicializar_banco()
    app.run(debug=True)
