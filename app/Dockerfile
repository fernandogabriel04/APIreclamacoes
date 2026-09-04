FROM python:3.11-slim

WORKDIR /app

# Instala as dependências primeiro (melhor cache de camada)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código da API
COPY . .

# Railway injeta a porta em $PORT; fora dela usamos 8080
EXPOSE 8080
CMD gunicorn APIREST:app \
    --workers 2 --timeout 120 --preload \
    --bind 0.0.0.0:${PORT:-8080} \
    --access-logfile - --error-logfile -
