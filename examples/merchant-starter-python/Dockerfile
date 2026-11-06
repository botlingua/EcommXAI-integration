FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi uvicorn[standard] python-multipart "PyJWT[crypto]>=2.10" "cryptography>=43"

COPY app ./app

ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
