# Agent Report Reader - Monorepo

A monorepo containing an AI agent for document ingestion and report generation, with a NestJS API server.

## Structure

```
agent-report-reader/
├── apps/
│   └── server/              # NestJS API server
│       ├── src/
│       │   ├── ingest/      # Ingest controller & service
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── package.json
├── packages/
│   └── ai-agent/            # Core AI agent logic
│       ├── src/
│       │   ├── config.ts
│       │   ├── ingest.ts    # Document ingestion
│       │   ├── generate.ts  # Report generation
│       │   ├── index.ts
│       │   └── utils/
│       ├── docs/            # Document storage
│       └── package.json
├── package.json             # Root package with turbo
├── pnpm-workspace.yaml
└── turbo.json
```

## Packages

### `@ai-agent/core`
The core AI agent package containing:
- Document loading (DOCX files)
- Embedding generation (Ollama with nomic-embed-text)
- Vector storage (ChromaDB)
- Report generation (LangChain + Ollama)

### `server`
NestJS API server exposing:
- `POST /api/ingest` - Run document ingestion
- `GET /api/ingest/health` - Health check

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 8.5+
- Ollama running locally with:
  - `llama3` model
  - `nomic-embed-text` embedding model
- ChromaDB running on `http://localhost:8000`

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Development

```bash
# Run both packages in dev mode
pnpm run dev

# Or run individually:
cd packages/ai-agent && pnpm run dev
cd apps/server && pnpm run start:dev
```

### Start Server

```bash
cd apps/server
node dist/main.js
```

Server runs on `http://localhost:3000`

### API Usage

```bash
# Health check
curl http://localhost:3000/api/ingest/health

# Run ingestion
curl -X POST http://localhost:3000/api/ingest
```

## Configuration

Edit `packages/ai-agent/src/config.ts` or use environment variables:

- `CHROMA_URL` - ChromaDB endpoint (default: http://localhost:8000)
- `COLLECTION_NAME` - Vector collection name (default: weekly-updates)
- `EMBEDDING_MODEL` - Ollama embedding model (default: nomic-embed-text)
- `LLM_MODEL` - Ollama chat model (default: llama3)
- `LLM_TEMPERATURE` - LLM temperature (default: 0.7)

## Adding Documents

Place `.docx` or `.doc` files in `packages/ai-agent/docs/` and run:

```bash
curl -X POST http://localhost:3000/api/ingest
```
