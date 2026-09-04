import os
import random
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()


def normalizar_db_url(url):
    if not url:
        return "sqlite:///./local.db"
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = normalizar_db_url(os.getenv("DB_URL"))
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Registro(Base):
    __tablename__ = "registros"

    id = Column(Integer, primary_key=True, index=True)
    transcricao = Column(Text, nullable=False)
    categoria = Column(String, nullable=False)
    subcategoria = Column(String, nullable=False)
    tema = Column(String, nullable=False)
    resumo = Column(Text, nullable=False)
    data_hora = Column(DateTime(timezone=True))
    municipio = Column(String, nullable=False)   # município (dos 102 de Alagoas)
    bairro = Column(String, nullable=True)       # bairro / povoado / distrito dentro do município
    origem = Column(String, nullable=False)
    telefone = Column(String(20), nullable=True)


# Município -> bairros / povoados / distritos
MUNICIPIOS = {
    "Maceió": ["Centro", "Jatiúca", "Benedito Bentes", "Jacintinho", "Ponta Verde",
               "Tabuleiro do Martins", "Clima Bom", "Vergel do Lago", "Cidade Universitária"],
    "Arapiraca": ["Centro", "Bom Sucesso", "Baixão", "Planalto", "Brasília", "Primavera", "Itapoã"],
    "Palmeira dos Índios": ["Centro", "Xucurus", "Alto do Cruzeiro", "Vila Maria", "Boa Vista"],
    "Rio Largo": ["Centro", "Tabajara", "Vila São João", "Gustavo Paiva", "Pau Ferro"],
    "Penedo": ["Centro Histórico", "Barro Vermelho", "Santa Luzia", "Oiteiro", "Dom Constantino"],
    "União dos Palmares": ["Centro", "Zumbi dos Palmares", "Rocheira", "Bomfim", "Bananeiras"],
    "Coruripe": ["Centro", "Pontal do Coruripe", "Miaí de Baixo", "Poxim", "Barreiras"],
    "Delmiro Gouveia": ["Centro", "Bloco", "Alto do Bomfim", "Piau", "Pedra"],
    "São Miguel dos Campos": ["Centro", "Coqueiro", "Volta Grande", "Verdes Campos"],
    "Marechal Deodoro": ["Centro", "Massagueira", "Poeira", "Barra Nova", "Taperaguá"],
    "Santana do Ipanema": ["Centro", "Alto do Cruzeiro", "Xingó", "Riacho"],
    "Campo Alegre": ["Centro", "Vila Nova", "Poção", "Alto São Sebastião"],
    "Girau do Ponciano": ["Centro", "Olho d'Água do Meio", "Cavalcante"],
    "Pilar": ["Centro", "Gustavo Paiva", "Alto da Boa Vista", "Massagueira de Baixo"],
    "Maragogi": ["Centro", "Barra Grande", "São Bento", "Peroba"],
    "Porto Calvo": ["Centro", "Boca da Mata", "Cravata"],
    "São Luís do Quitunde": ["Centro", "Tijucupava", "Bananeiras"],
    "Teotônio Vilela": ["Centro", "Guaxuma", "Poços"],
    "Batalha": ["Centro", "Volta"],
    "Piranhas": ["Centro", "Entremontes", "Xingó", "Barra da Tapera"],
    "Coité do Nóia": ["Centro", "Cangandu"],
    "Igaci": ["Centro", "Cristal", "Barra do Espírito Santo"],
    "Murici": ["Centro", "São José da Lage", "Sapucaia"],
    "Colônia Leopoldina": ["Centro", "Água Boa"],
}

# Pesos: municípios maiores concentram mais manifestações
PESOS = {
    "Maceió": 34, "Arapiraca": 16, "Palmeira dos Índios": 6, "Rio Largo": 6,
    "Penedo": 5, "União dos Palmares": 5, "Coruripe": 4, "Delmiro Gouveia": 4,
    "São Miguel dos Campos": 4, "Marechal Deodoro": 3, "Santana do Ipanema": 3,
}

CATEGORIAS = {
    "Meio Ambiente": ["Indicação de Descarte Irregular", "Poda de Árvore", "Reflorestamento e Plantio"],
    "Educação": ["Vagas para Creche", "Merenda Escolar", "Transporte Escolar", "Reforma de Escola"],
    "Infraestrutura": ["Tapar Buraco", "Implantação de Asfalto", "Alagamento", "Iluminação Pública"],
    "Limpeza Urbana": ["Falta de Coleta Domiciliar", "Capinação", "Limpeza em Geral"],
    "Saúde": ["Marcação de Exames Consultas e Cirurgias", "Unidade de Saúde", "Atendimento Médico", "Falta de Medicamentos"],
    "Transporte": ["Transporte Público", "Linhas de Ônibus", "Terminais", "Estrada Estadual"],
    "Segurança Pública": ["Policiamento", "Iluminação e Segurança", "Posto Policial"],
    "Habitação": ["Regularização Fundiária", "Moradia Popular", "Área de Risco"],
    "Agricultura e Pesca": ["Assistência ao Produtor", "Estrada Vicinal", "Abastecimento de Água"],
}

TEMAS_RESUMOS = {
    "Meio Ambiente": [
        ("Descarte irregular", "Entulho descartado em terreno baldio, atraindo insetos e roedores."),
        ("Poda necessária", "Árvore com galhos sobre a fiação elétrica, morador solicita poda preventiva."),
    ],
    "Educação": [
        ("Vaga em creche", "Família busca vaga para criança em creche próxima e não consegue atendimento."),
        ("Transporte escolar", "Estudantes da zona rural sem transporte para chegar à escola estadual."),
    ],
    "Infraestrutura": [
        ("Buraco na via", "Morador relata buraco extenso na via causando risco a veículos e pedestres."),
        ("Iluminação apagada", "Postes de luz apagados há vários dias, gerando insegurança à noite."),
        ("Alagamento recorrente", "Rua alaga a cada chuva forte, prejudicando moradores e comércio."),
    ],
    "Limpeza Urbana": [
        ("Falta de coleta de lixo", "Lixo acumulado há dias sem recolhimento pela equipe de limpeza."),
        ("Mato alto", "Terreno público com mato alto favorecendo animais peçonhentos."),
    ],
    "Saúde": [
        ("Demora no atendimento", "Paciente aguarda semanas por consulta na unidade de saúde do bairro."),
        ("Falta de medicamentos", "Farmácia da unidade sem medicamentos de uso contínuo há semanas."),
    ],
    "Transporte": [
        ("Ônibus com atraso", "Linha intermunicipal com atrasos frequentes no horário de pico."),
        ("Estrada em más condições", "Trecho de rodovia estadual com buracos dificultando o escoamento da produção."),
    ],
    "Segurança Pública": [
        ("Falta de policiamento", "Bairro sem rondas frequentes, moradores pedem reforço no policiamento."),
        ("Posto desativado", "Módulo policial da comunidade está fechado há meses."),
    ],
    "Habitação": [
        ("Área de risco", "Famílias em encosta sujeita a deslizamento pedem realocação."),
        ("Regularização", "Comunidade antiga sem regularização fundiária dos lotes."),
    ],
    "Agricultura e Pesca": [
        ("Estrada vicinal", "Estrada de acesso à roça intransitável na época de chuva."),
        ("Água para produção", "Agricultores familiares sem acesso a água para irrigação."),
    ],
}

random.seed(42)


def gerar_registros(n=140):
    registros = []
    municipios = list(MUNICIPIOS.keys())
    pesos = [PESOS.get(m, 2) for m in municipios]
    agora = datetime.now(timezone.utc)

    for i in range(n):
        municipio = random.choices(municipios, weights=pesos, k=1)[0]
        bairro = random.choice(MUNICIPIOS[municipio])
        categoria = random.choice(list(CATEGORIAS.keys()))
        subcategoria = random.choice(CATEGORIAS[categoria])
        tema, resumo = random.choice(TEMAS_RESUMOS[categoria])

        sorte = random.random()
        if sorte < 0.12:
            origem = "Whatsapp"
        elif sorte < 0.45:
            origem = f"Cabine {municipio} - {bairro}"
        else:
            origem = "Site"
        dias_atras = random.randint(0, 240)
        data_hora = agora - timedelta(days=dias_atras, hours=random.randint(0, 23))
        telefone = f"82 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}" if random.random() > 0.35 else None

        registros.append(Registro(
            transcricao=f"Transcrição de exemplo #{i + 1}: {resumo}",
            categoria=categoria,
            subcategoria=subcategoria,
            tema=tema,
            resumo=resumo,
            data_hora=data_hora,
            municipio=municipio,
            bairro=bairro,
            origem=origem,
            telefone=telefone,
        ))
    return registros


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    existentes = session.query(Registro).count()
    if existentes > 0:
        print(f"Tabela 'registros' já contém {existentes} registros. Nenhum dado novo inserido.")
    else:
        session.add_all(gerar_registros(140))
        session.commit()
        print("140 registros de demonstração inseridos com sucesso.")
    session.close()
