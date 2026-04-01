# Board Game Agent — Learning Path

A structured guide to building a conversational CLI agent over a board games dataset. Each phase builds directly on the last, and the entire project extends the patterns you already know from `packages/ai-agent`.

---

## What You'll Build

A CLI tool that lets you have a conversation like this:

```
> What are some good 2-player strategy games under 90 minutes?

Based on the collection, here are some strong options:
1. Twilight Struggle (2005) — Strategy, Wargame. 120 min avg, but highly regarded for 2p.
2. Agricola (2007) — Worker Placement. 90 min, plays excellently at 2.
...

> Which of those has the better rating?

Twilight Struggle has a Bayesian average of 8.23, Agricola sits at 7.95.
Twilight Struggle edges it out, though Agricola is considered more approachable.

> /memory
[Session memory: 3 turns, ~420 tokens used, limit 4096]
```

**Tech stack:** Ollama (llama3 + nomic-embed-text) · LangChain · ChromaDB · Node readline · SQLite

---

## Prerequisites

Before starting, make sure you've worked through `packages/ai-agent`. The concepts here build on:

- How ChromaDB stores and retrieves embeddings (`ingest.ts`)
- How LangChain chains are composed (`generate.ts`, `extract.ts`)
- The prompt versioning system (`promptLoader.ts`)
- The `modelSetup.ts` factory pattern

You'll also need:
- ChromaDB running locally: `docker run -p 8000:8000 chromadb/chroma`
- Ollama running with `llama3` and `nomic-embed-text` pulled
- Node 22+ and pnpm

---

## Phase Overview

| Phase | Topic | New concepts introduced |
|-------|-------|------------------------|
| 0 | Setup & Bootstrap | Monorepo package setup |
| 1 | Data Ingestion | CSV parsing, HTML stripping, batching, `--limit` flag |
| 2 | Basic RAG Query | Single-turn Q&A over embeddings |
| 3 | CLI Interface | readline REPL, chalk, slash commands |
| 4 | Session Memory | Manual token counting, context window management |
| 5 | Streaming | `stream()` vs `invoke()`, real-time token output |
| 6 | Tool Calling | Agent tools, structured query routing |
| 7 | Persistent Memory | SQLite session storage, session resume |
| 8 | Evaluation Harness | Golden datasets, LLM-as-judge, JSONL logging |

---

## Phase 0 — Setup & Bootstrap

### Goal
Get a working TypeScript package in the monorepo that compiles and runs.

### Why this matters
Every production AI project starts here. Understanding how a monorepo package is wired (tsconfig, package.json exports, pnpm workspaces) is foundational — it's easy to get wrong and painful to fix later. This phase ensures you have a clean foundation before any real logic is added.

### Steps

- [ ] Verify `packages/board-game-agent/` exists with `package.json`, `tsconfig.json`, and `src/index.ts`
- [ ] Run `pnpm install` from the package root — confirm no errors
- [ ] Run `pnpm run start` — confirm `hello agent` prints
- [ ] Run `pnpm run build` — confirm `dist/` is generated with no TypeScript errors
- [ ] Review `tsconfig.json`: note `target: ES2022`, `module: commonjs`, `strict: true`
- [ ] Review `package.json` scripts: understand the difference between `tsx` (direct run) and `tsc` (compiled output)

### Reference

Compare this setup with `packages/ai-agent/package.json` and `packages/ai-agent/tsconfig.json`. They are intentionally identical in structure — you should recognise everything here.

---

## Phase 1 — Data Ingestion

### Goal
Parse `data/boardgames_enriched.csv`, generate embeddings for each game, and store them in a ChromaDB collection called `board-games`.

### Why this matters
In `ai-agent` you ingested `.docx` files using `mammoth`. Here you're ingesting structured CSV data — a much more common real-world format. You'll learn how to:
- Work with a new file format without a LangChain helper
- Pre-process messy text (HTML-encoded descriptions)
- Throttle an ingestion job with a `--limit` flag so you can test quickly before committing to the full dataset
- Think about what to embed vs what to store as metadata

The distinction between **what you embed** (the text used for similarity search) and **what you store** (raw metadata for retrieval) is a critical design decision in every RAG system.

### Steps

- [ ] Add `csv-parse` to your dependencies: `pnpm add csv-parse`
- [ ] Add `striptags` to strip HTML from descriptions: `pnpm add striptags && pnpm add -D @types/striptags`
- [ ] Create `src/ingest.ts`
- [ ] Read the CSV using `csv-parse`'s streaming API (avoids loading 76 MB into memory at once)
- [ ] For each row, construct an **embed string**: `"${name}. ${categories}. ${mechanics}. ${strippedDescription}"`
- [ ] Store the raw structured data as **metadata** on the ChromaDB document (rank, rating, players, playtime, etc.)
- [ ] Add `--limit <n>` support via `process.argv` — default to `500` for development
- [ ] Test: run `pnpm run ingest -- --limit 100` and verify 100 documents appear in ChromaDB
- [ ] Scale up: run without `--limit` to ingest the full dataset (this will take several minutes)

### Reference

`packages/ai-agent/src/ingest.ts` — same ChromaDB setup, same `OllamaEmbeddings` factory from `modelSetup.ts`. Copy and adapt the `createVectorStore` call.

`packages/ai-agent/src/utils/modelSetup/modelSetup.ts` — reuse `createEmbeddings()` and `createVectorStore()` patterns directly.

### Key concept: embed string vs metadata

```
embed string (searched via similarity):
  "Brass: Birmingham. Economic, Industry / Manufacturing. Network Building, Hand Management.
   In Brass: Birmingham, players compete to build..."

metadata (returned with results):
  { id: 224517, rank: 1, bayesaverage: 8.39, minplayers: 2, maxplayers: 4, playingtime: 120 }
```

The embed string is rich natural language — this is what the model uses to find relevant games. The metadata gives you structured data to display or filter on after retrieval.

---

## Phase 2 — Basic RAG Query

### Goal
Wire up a single-turn question-answering function: user asks a question, get top-k matching games from ChromaDB, pass them as context to the LLM, receive an answer.

### Why this matters
This is the core RAG loop — the same pattern used in `ai-agent`'s `generate.ts`. Implementing it from scratch here (rather than copy-pasting) forces you to understand every link in the chain: query → embedding → similarity search → prompt construction → LLM → answer. Once you understand this you can extend it in any direction.

### Steps

- [ ] Create `src/agents/query/query.ts`
- [ ] Import `createChatModel`, `createEmbeddings`, `createVectorStore` from your `modelSetup.ts` (copy the pattern from ai-agent)
- [ ] Create a retriever with `vectorStore.asRetriever({ k: 5 })`
- [ ] Write a prompt template that includes `{context}` (the retrieved game data) and `{question}`
- [ ] Build a `RunnableSequence`: retrieve context → format prompt → LLM → StringOutputParser
- [ ] Create `src/agents/query/index.ts` as a runnable test script
- [ ] Test with a hard-coded query: `"What are good 2-player strategy games under 90 minutes?"`
- [ ] Inspect the raw ChromaDB results before the LLM call — confirm relevant games are being retrieved

### Reference

`packages/ai-agent/src/agents/createReport/generate.ts` — this is structurally identical. Pay attention to how `RunnableSequence` composes the retrieval step as the first element.

`packages/ai-agent/prompts/report-agent/1.0.0.json` — your new prompt will follow the same versioned JSON format.

### Prompt versioning

Add a `prompts/` directory with the same `manifest.json` + `1.0.0.json` structure from ai-agent. Copy `promptLoader.ts` into your `src/utils/prompt/` — this is a pure utility and can be reused verbatim.

---

## Phase 3 — CLI Interface

### Goal
Replace the hard-coded test query with an interactive readline REPL. The user types questions, sees answers, and can run slash commands.

### Why this matters
This is the first genuinely new pattern in this project — `ai-agent` has no interactive CLI. You'll learn how Node's built-in `readline` module works, how to structure a REPL loop, and how to design a clean command/conversation split. `chalk` adds colour which makes the terminal output scannable — a small detail that matters a lot for usability.

### Steps

- [ ] Add `chalk` for terminal colour: `pnpm add chalk`
- [ ] Create `src/cli/index.ts` with a `readline.createInterface` loop
- [ ] Print a welcome banner on start (package name, model, collection name, commands)
- [ ] On each line of input, check if it starts with `/`:
  - `/help` — print available commands
  - `/clear` — clear session memory (Phase 4)
  - `/memory` — show current memory stats (Phase 4)
  - `/quit` or `/exit` — close readline and exit
  - anything else → route to `query.ts`
- [ ] Display the LLM response with a coloured prefix (e.g. `chalk.cyan("Agent:")`)
- [ ] Display a spinner or `...` while waiting for the LLM (readline pauses input during this)
- [ ] Test: run `pnpm run cli` and have a multi-turn conversation (answers won't be contextual yet — that's Phase 4)

### Slash command pattern

```typescript
const COMMANDS: Record<string, () => void> = {
  "/help": printHelp,
  "/clear": clearMemory,
  "/memory": showMemoryStats,
  "/quit": () => { rl.close(); process.exit(0); },
};

rl.on("line", async (input) => {
  const trimmed = input.trim();
  if (trimmed in COMMANDS) {
    COMMANDS[trimmed]?.();
  } else {
    await handleQuery(trimmed);
  }
});
```

---

## Phase 4 — Session Memory (Manual)

### Goal
Give the agent memory of the current conversation. Each user turn and agent response is stored in a `MessageHistory` class. When the token count approaches the context limit, the user is prompted to clear or compress.

### Why this matters
This is the single most educational phase in the project. Memory management is one of the hardest problems in production LLM systems. Building it manually — tracking a message array, estimating tokens, detecting overflow — teaches you what frameworks like LangChain abstract away. Once you understand the mechanics, you can reason about memory trade-offs for any system.

### Steps

#### Build MessageHistory
- [ ] Create `src/utils/memory/MessageHistory.ts`
- [ ] Store an array of `{ role: "user" | "assistant", content: string }` objects
- [ ] Implement `push(role, content)`, `get()`, `clear()`, `tokenCount()`, `serialize()`
- [ ] Token estimation: use `Math.ceil(totalChars / 4)` as a fast heuristic (4 chars ≈ 1 token for English text)
- [ ] Add a `TOKEN_LIMIT` constant (e.g. `3500` — leaving headroom below llama3's 4096 context)

#### Wire into the query chain
- [ ] Modify `query.ts` to accept the message history as an argument
- [ ] Prepend the conversation history to the prompt as a `{history}` variable
- [ ] After each successful LLM response, push both the user message and response to history

#### Handle overflow
- [ ] In the CLI loop, before each query, check `history.tokenCount() > TOKEN_LIMIT`
- [ ] If over the limit, pause and ask: `"Context limit approaching. [c]lear or [s]kip? "`
- [ ] Clear resets the history; skip proceeds (the prompt will be truncated by the LLM)
- [ ] Wire `/clear` and `/memory` commands to call `history.clear()` and log `history.tokenCount()`

#### Test
- [ ] Have a 5+ turn conversation and confirm the agent remembers earlier turns
- [ ] Verify `/memory` reports an increasing token count
- [ ] Verify `/clear` resets the count and the next turn has no memory of previous ones

---

### Alternative approach: LangChain BufferMemory

The above teaches you the mechanics. LangChain's `ConversationBufferMemory` does the same thing declaratively. Here's how you'd use it instead — worth reading even if you stick with the manual approach:

```typescript
import { ConversationBufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

const memory = new ConversationBufferMemory({
  returnMessages: true,
  memoryKey: "history",
});

const chain = new ConversationChain({
  llm: chatModel,
  memory,
  prompt: yourPromptTemplate,
});

// LangChain automatically appends to memory after each invoke()
const response = await chain.invoke({ input: userMessage });
```

**Trade-offs:**

| | Manual `MessageHistory` | LangChain `BufferMemory` |
|---|---|---|
| Visibility | You see every byte | Abstracted away |
| Overflow control | You control exactly | LangChain handles (less configurable) |
| Token counting | Your own estimate | LangChain uses its own |
| Learning value | High | Lower |
| Production use | More boilerplate | Faster to wire up |

For a more advanced alternative: `ConversationSummaryMemory` uses a second LLM call to *summarise* old turns rather than truncating them — it preserves context at the cost of an extra inference call. Good to know about for complex long-running sessions.

---

## Phase 5 — Streaming Responses

### Goal
Stream LLM tokens to the terminal as they're generated, rather than waiting for the full response.

### Why this matters
Streaming is standard in every production chat interface. Users perceive streaming as faster even when total time is identical. More importantly, this phase teaches you how LangChain's async iterable API works — a pattern you'll encounter frequently when building more complex pipelines. It also requires you to handle the "assemble the stream back into a string for memory" problem, which is a non-trivial real-world concern.

### Steps

- [ ] In `query.ts`, change `chain.invoke(input)` to `chain.stream(input)`
- [ ] `chain.stream()` returns an `AsyncIterable<string>` — iterate it with `for await`
- [ ] For each chunk, write directly to stdout without a newline: `process.stdout.write(chunk)`
- [ ] After the stream closes, write a final newline
- [ ] Collect all chunks into a string while streaming: `let full = ""; for await (const chunk of stream) { process.stdout.write(chunk); full += chunk; }`
- [ ] Push `full` to `MessageHistory` after streaming completes (not chunk-by-chunk)
- [ ] Disable the "..." waiting indicator from Phase 3 — the stream itself is the feedback
- [ ] Test: run a query and watch tokens appear in real time

### Reference

LangChain's streaming docs and the `ChatOllama` class both support `.stream()` natively. The chain's output parser needs to be `StringOutputParser` for streaming to work character-by-character.

---

## Phase 6 — Tool / Function Calling

### Goal
Give the agent structured tools it can invoke when the user asks something that maps to a defined operation (filter, rank, compare) rather than a freeform question.

### Why this matters
Pure RAG (retrieve-then-answer) works well for open-ended questions but fails for structured queries: "show me the top 10 games by rating" requires filtering and sorting, not semantic similarity. Tool calling teaches you how an LLM decides *which* tool to use and *how* to call it — a pattern central to all modern agentic systems (LangChain agents, OpenAI function calling, Claude tool use, etc.).

### Steps

- [ ] Define 4 tools as plain TypeScript functions with Zod schemas for their inputs:
  - `filterByMechanic(mechanic: string, limit?: number)` — query ChromaDB metadata filter
  - `topRatedGames(category?: string, limit?: number)` — sort by bayesaverage
  - `getGameDetails(name: string)` — fetch a single game's full metadata
  - `compareGames(names: string[])` — retrieve multiple games and format a comparison table
- [ ] Wrap each function using LangChain's `DynamicStructuredTool`:
  ```typescript
  import { DynamicStructuredTool } from "@langchain/core/tools";
  const tool = new DynamicStructuredTool({
    name: "filterByMechanic",
    description: "Find board games that use a specific game mechanic",
    schema: z.object({ mechanic: z.string(), limit: z.number().optional() }),
    func: async ({ mechanic, limit }) => { /* ... */ },
  });
  ```
- [ ] Create a `createOpenAIFunctionsAgent` or `createToolCallingAgent` (LangChain supports both with Ollama via structured output)
- [ ] Build an `AgentExecutor` that routes queries to tools or to the RAG chain
- [ ] Update the CLI to use the agent executor instead of the raw query chain
- [ ] Test: ask "What are the top 5 rated party games?" — confirm it routes to `topRatedGames` not freeform RAG

### Note on Ollama + tool calling

Not all Ollama models support native function calling. `llama3` has limited structured output support. You may need to try `mistral` or `llama3.1` for reliable tool routing, or use prompt-based tool selection (where the model outputs a JSON blob you parse manually). This is itself a valuable learning experience — tool calling reliability is a real production concern.

---

## Phase 7 — Persistent Cross-Session Memory

### Goal
Store conversation history in SQLite so sessions can be resumed, listed, and referenced across CLI invocations.

### Why this matters
In-memory history (Phase 4) disappears when the process exits. Production chat systems always persist sessions — for user experience (resume a conversation) and for debugging (replay what happened). SQLite is a great choice here: it's a single file, needs no server, and `better-sqlite3` has a simple synchronous API that's easy to reason about.

### Steps

- [ ] Add `better-sqlite3`: `pnpm add better-sqlite3 && pnpm add -D @types/better-sqlite3`
- [ ] Create `src/utils/memory/SessionStore.ts`
- [ ] Schema: `sessions(id TEXT PRIMARY KEY, created_at TEXT)` + `messages(id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, created_at TEXT, token_estimate INTEGER)`
- [ ] Implement `createSession()`, `loadSession(id)`, `listSessions()`, `appendMessage(sessionId, role, content)`, `getMessages(sessionId)`
- [ ] On CLI start, check for `--session <id>` flag in `process.argv`
  - If provided, load that session's history into `MessageHistory`
  - If not provided, create a new session
- [ ] Add `/sessions` slash command — lists the 10 most recent sessions with IDs and message counts
- [ ] Add `/resume <session-id>` slash command — loads a past session into the current context
- [ ] Test: start a session, ask 3 questions, exit. Re-run with `--session <id>` and confirm the agent remembers the previous conversation.

### Extending `MessageHistory`

Modify Phase 4's `MessageHistory` to accept an optional `SessionStore` and persist every `push()` call automatically. This keeps the in-memory and persistent layers in sync without the CLI needing to know about the database.

---

## Phase 8 — Evaluation Harness

### Goal
Build a lightweight system to log Q&A pairs, define a golden test set, and score agent responses — either by embedding similarity or by using the LLM itself as a judge.

### Why this matters
This is the most often skipped and most professionally important phase. Without evals, you have no idea whether a change to your prompt, model, or retrieval logic made things better or worse. Every serious AI team has some form of eval infrastructure. Building a simple version from scratch teaches you the core pattern: golden dataset + scorer + comparison report. This knowledge transfers directly to production tools like LangSmith, RAGAS, and Braintrust.

### Steps

#### JSONL Logging
- [ ] Add a `LOG_QUERIES=true` env var
- [ ] When enabled, append each Q&A pair to `output/queries.jsonl`:
  ```json
  {"timestamp":"...","session_id":"...","question":"...","answer":"...","retrieved_docs":[...],"latency_ms":432}
  ```
- [ ] This creates a replay-able log of every interaction

#### Golden Dataset
- [ ] Create `src/evals/golden.ts` with 10 hand-crafted Q&A pairs, e.g.:
  ```typescript
  { question: "What is the highest rated board game?", expected: "Brass: Birmingham" }
  { question: "Name a good game for 5+ players", expected: /party|social|large group/i }
  ```
- [ ] Mix exact-match questions (factual) and semantic questions (open-ended)

#### Scoring
- [ ] **Exact match scorer**: check if `answer.toLowerCase().includes(expected.toLowerCase())`
- [ ] **Embedding similarity scorer**: embed both the expected and actual answer, compute cosine similarity — score >= 0.85 is a pass
- [ ] **LLM-as-judge** (advanced): send `(question, expected, actual)` to the LLM and ask it to score 1-5 with a brief reason

#### Eval runner
- [ ] Create `src/evals/run.ts` — loops through the golden set, runs each query, scores, prints a summary table
- [ ] Add `"eval": "tsx src/evals/run.ts"` to `package.json` scripts
- [ ] Run evals before and after making a prompt or model change — compare scores

---

## Where to Go Next

Once you've completed all 8 phases, here are the most valuable directions to extend your knowledge:

### LangSmith Tracing
Instrument your chains with LangSmith to get a visual trace of every LLM call, token count, latency, and intermediate output. The LangChain integration is 3 lines of env vars. This is how production teams debug prompt regressions.

### RAGAS Evaluation
RAGAS is a framework specifically for evaluating RAG pipelines — it measures faithfulness (did the answer come from the context?), answer relevance, and context recall. More rigorous than the manual eval harness in Phase 8.

### Prompt Optimisation
Take the eval harness from Phase 8 and use it to systematically test prompt variations. Change the system prompt, the number of retrieved documents (k), or the temperature, and measure the effect on eval scores. This is prompt engineering done properly.

### Re-ranking
After ChromaDB returns k=5 results, add a re-ranker (a cross-encoder model) to re-order them by relevance before passing to the LLM. Improves answer quality significantly for ambiguous queries. LangChain has built-in re-ranker support.

### Multi-modal
The board games dataset doesn't have images, but BGG (BoardGameGeek) has box art for every game. Building an image-capable pipeline (CLIP embeddings + multimodal LLM) is a natural next step once you're comfortable with text RAG.

### REST API wrapper
Wrap the CLI agent in a NestJS endpoint (same pattern as `apps/server`) so the agent can be called from a web UI or mobile app. This bridges the gap between your local learning project and a deployable service.

---

## Checklist Summary

Use this as a quick reference for overall progress:

- [ ] Phase 0: Package boots and compiles
- [ ] Phase 1: CSV ingested into ChromaDB with `--limit` flag
- [ ] Phase 2: Single-turn RAG Q&A working
- [ ] Phase 3: Interactive readline CLI with slash commands
- [ ] Phase 4: In-session memory with token counting and overflow handling
- [ ] Phase 5: Streaming LLM responses to terminal
- [ ] Phase 6: Tool calling for structured queries
- [ ] Phase 7: SQLite session persistence and resume
- [ ] Phase 8: Eval harness with golden dataset and scorer
