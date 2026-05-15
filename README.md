# AI Job Application Assistant

A self-hosted job application tool powered by a local LLM. Upload your resume, paste a job posting or URL, and let the AI tailor your resume, write a cover letter, score your fit, and identify missing keywords — all running locally with no API costs.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, served by nginx |
| Backend | Python 3.11 + Flask + SQLAlchemy |
| Database | PostgreSQL 16 |
| AI | Local GGUF inference via `llama-cpp-python` |
| Orchestration | Docker + docker-compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- The GGUF model file (see **Model Setup** below)

## Quick Start

### 1. Clone the repo

```bash
git clone git@github.com:gardner589/job_assistant_flask.git
cd job_assistant_flask
```

### 2. Set up your environment

```bash
cp .env.example .env
```

Open `.env` and set `HOST_MODEL_PATH` to the absolute path of the GGUF model on your machine:

```
HOST_MODEL_PATH=/absolute/path/to/your/model.gguf
```

### 3. Model Setup

This project uses **Huihui-Qwen3-VL-4B-Instruct-abliterated-Q4_K_M.gguf**.

Download it from Hugging Face:
```
noctrex/Huihui-Qwen3-VL-4B-Instruct-abliterated-GGUF
```

The model file is **not tracked in git** (2.3 GB). Each collaborator stores it locally and points `HOST_MODEL_PATH` at it.

If you use LM Studio, it's likely already at:
```
~/.cache/lm-studio/models/noctrex/Huihui-Qwen3-VL-4B-Instruct-abliterated-GGUF/Huihui-Qwen3-VL-4B-Instruct-abliterated-Q4_K_M.gguf
```

### 4. Build and run

```bash
docker-compose up --build
```

> **Note:** The first build takes 5–10 minutes because `llama-cpp-python` compiles from source. Subsequent starts are fast.

Open **http://localhost:3000** when containers are up.

## Services

| Service | Port | Description |
|---|---|---|
| `frontend` | 3000 | React app (nginx, proxies `/api` to backend) |
| `backend` | 5000 | Flask REST API |
| `db` | 5432 | PostgreSQL (data persisted in `./postgres-data/`) |

## Notable Details

**Database** — PostgreSQL data is stored in `./postgres-data/` inside the project directory. The directory is tracked in git (via `.gitkeep`) but its contents are gitignored, so each collaborator gets a fresh local database.

**Model mount** — The GGUF file is bind-mounted read-only into the backend container at `/app/model.gguf`. It is never copied into the image.

**Inference time** — CPU inference on a 4B quantized model takes roughly 1–3 minutes per analysis request. The nginx timeout is set to 300s to accommodate this.

**First request is slower** — The model loads into memory on the first `/api/analyze` call and stays resident for the life of the container. Subsequent requests are faster.

**Environment files** — `.env` is gitignored. Never commit it. Use `.env.example` as the template.

**`LLM_THREADS`** — Set this in `docker-compose.yml` (default: `4`) to match your CPU core count for faster inference.

## Project Structure

```
job_assistant_flask/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app.py              # Flask app factory + blueprint registration
│   ├── models.py           # SQLAlchemy models (Resume, JobPosting, Application)
│   ├── routes/
│   │   ├── resumes.py      # PDF upload + text resume endpoints
│   │   ├── jobs.py         # URL scraping + text job posting endpoints
│   │   ├── analyze.py      # LLM analysis endpoint
│   │   └── applications.py # Application CRUD + status tracking
│   └── services/
│       ├── llm.py          # llama-cpp-python wrapper (lazy model loading)
│       └── scraper.py      # requests + BeautifulSoup job page scraper
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Router + sidebar layout
│   │   ├── api.js          # Centralized axios API calls
│   │   ├── pages/          # Home, Resumes, Analyze, Applications, Detail
│   │   └── components/     # ApplicationCard
│   └── nginx.conf          # Serves React build, proxies /api to backend
└── postgres-data/          # PostgreSQL data volume (gitignored, directory tracked)
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resumes/` | List all resumes |
| POST | `/api/resumes/upload` | Upload a PDF resume |
| POST | `/api/resumes/text` | Save a plain text resume |
| DELETE | `/api/resumes/<id>` | Delete a resume |
| POST | `/api/jobs/parse-url` | Scrape a job posting from URL |
| POST | `/api/jobs/text` | Save a plain text job posting |
| POST | `/api/analyze/` | Run LLM analysis, returns new Application |
| GET | `/api/applications/` | List all applications |
| GET | `/api/applications/<id>` | Get application with full content |
| PATCH | `/api/applications/<id>` | Update status, notes, applied date |
| DELETE | `/api/applications/<id>` | Delete application |
