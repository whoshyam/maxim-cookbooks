# Maxim TypeScript Manual Tracing Examples

Production-ready examples demonstrating manual tracing with the Maxim TypeScript SDK and real OpenAI integration.

## 🚀 Quick Start

```bash
npm install
```

Setup environment:

```bash
cp .env.example .env
# Edit .env with your actual API keys and IDs
```

## 📋 Required Maxim Resources

For manual tracing examples to work, ensure you have:

**API Keys:**

- Maxim API Key - Get from [Maxim Settings](https://app.getmaxim.ai/workspace?redirect=/settings/api-keys)
- Log Repository ID - Create a new repository in your Maxim workspace
- OpenAI API Key - Get from [OpenAI Platform](https://platform.openai.com/api-keys)

**Environment Variables:**

```env
MAXIM_API_KEY=your_maxim_api_key_here
MAXIM_LOG_REPO_ID=your_log_repo_id_here
OPENAI_API_KEY=your_openai_api_key_here
```

Run any example directly:

```bash
npx tsx src/index.ts
npx tsx src/advanced-example.ts
```

## 📁 Examples

### Basic Example (`src/index.ts`)

- **Simple trace creation** - Track complete execution flow
- **LLM call logging** - Log OpenAI GPT interactions with metadata
- **Retrieval tracking** - Document search and RAG operations
- **Error handling** - Proper error logging and tracking

### Advanced Example (`src/advanced-example.ts`)

- **Session management** - Multi-turn conversation tracking
- **Complex workflows** - Intent classification and response generation
- **Span operations** - Break down operations into components
- **RAG implementation** - Retrieval-augmented generation
- **Feedback and tagging** - Session feedback and metadata
- **Comprehensive error handling** - Robust error management

## 🎯 Key Patterns

### Basic Trace

```typescript
const trace = logger.trace({
  id: randomUUID(),
  name: "rag-example",
});
trace.input(userQuery);
// ... processing
trace.output(responseText);
trace.end();
```

### Session Management

```typescript
const session = logger.session({
  id: randomUUID(),
  name: "customer-support-session",
  tags: { channel: "web-chat", priority: "high" },
});
```

### LLM Generation

```typescript
const generation = trace.generation({
  id: randomUUID(),
  provider: "openai",
  model: "gpt-4o-mini",
  messages: messages,
  modelParameters: { temperature: 0.7 },
});
```

## 🏆 Best Practices

- **Unique IDs**: Use `randomUUID()` for all traces, sessions, and operations
- **Proper Cleanup**: Always call `await logger.cleanup()` and `await maxim.cleanup()`
- **Metadata Tracking**: Include relevant metadata in generations and retrievals
- **Session Organization**: Group related traces in sessions for multi-turn conversations

## 📊 What Gets Logged

### Trace Information

- Input and output data
- Processing metadata
- Performance metrics
- Error details

### Generation Details

- Model parameters and messages
- Token usage and costs
- Response content
- Processing latency

### Retrieval Operations

- Search queries and results
- Document metadata
- Relevance scoring
- Context utilization

### Session Analytics

- Multi-turn conversation flow
- User feedback and ratings
- Intent classification
- Conversation outcomes

## 🔍 Key Concepts

### Trace

A complete execution flow representing one interaction or operation in your AI application.

### Session

Groups related traces together - perfect for multi-turn conversations or complex workflows.

### Generation

Represents an LLM call with input messages, model parameters, and response tracking.

### Retrieval

Documents search operations, RAG queries, and knowledge base lookups.

### Span

Sub-operations within a trace for granular tracking of complex processes.

## 📈 Expected Output

### Basic Example

```
# Manual Tracing of AI Code
✅ Maxim logger initialized successfully
✅ Trace created with user query
✅ Retrieved relevant information about recursion
✅ LLM call completed with retrieved context
✅ RAG workflow completed and logged to Maxim
```

### Advanced Example

```
# Advanced Manual Tracing Example
✅ Session created
Intent classified: product_inquiry
Response generated: [Premium features list]
✅ First trace completed
Pricing response: [Pricing information]
✅ Second trace completed
✅ Session completed with feedback and tags
✅ Error properly logged: The model `invalid-model` does not exist
```

## 🌐 Viewing Your Data

After running examples:

1. Go to [Maxim App](https://app.getmaxim.ai)
2. Navigate to your workspace
3. Open your configured log repository
4. View traces, sessions, generations, and analytics

Start with the basic example to understand fundamentals, then explore advanced patterns for complex AI workflows.
