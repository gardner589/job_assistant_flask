FROM python:3.11-slim

# Build deps for llama-cpp-python (compiled from source)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install llama-cpp-python first (CPU-only build, takes a few minutes)
RUN CMAKE_ARGS="-DGGML_BLAS=OFF -DGGML_CUDA=OFF" \
    pip install --no-cache-dir llama-cpp-python==0.3.23

# Install the rest of the dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]
