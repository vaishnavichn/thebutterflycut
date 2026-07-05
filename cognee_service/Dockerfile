FROM python:3.11-slim

WORKDIR /app

# Install build and runtime dependencies (like libgomp1 for onnxruntime/fastembed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download fastembed models to avoid cold-start latency and potential network issues in Cloud Run
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Copy service code
COPY . .

# Expose default port
ENV PORT=8080
EXPOSE 8080

# Run uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
