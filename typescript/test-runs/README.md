# Maxim TypeScript Test-Runs Examples

Production-ready examples using the Maxim TypeScript SDK with real OpenAI integration.

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

For hosted examples to work, ensure your Maxim workspace has:

**Dataset Structure:**

- `Input` field (INPUT type) - Questions or prompts
- `Expected Output` field (EXPECTED_OUTPUT type) - Expected responses
- `Context` field (VARIABLE type) - Additional context or background info
- `Category` field (VARIABLE type) - Required for `advancedCustomEvaluatorPatterns.ts` - categorizes the type of question (e.g., "microbiology", "programming", "machine learning")

**Workflow/Prompt Requirements:**

- Should accept input questions and generate text responses
- Works best with conversational or Q&A style prompts
- Context-aware processing (can utilize provided context)

Run any example directly:

```bash
npx tsx basic.ts
npx tsx dataSources/manualData.ts
npx tsx evaluation/customEvaluator.ts
```

## 📁 Examples

### Basic Examples

- **`basic.ts`** - Simple hosted workflow test
- **`basicWithPromptVersion.ts`** - Test specific prompt versions
- **`customLogger.ts`** - Advanced logging with timing
- **`concurrencyConfiguration.ts`** - Concurrency optimization guide

### Data Sources

- **`dataSources/manualData.ts`** - Customer support scenarios
- **`dataSources/csv.ts`** - Load data from CSV files
- **`dataSources/dataFunction.ts`** - Dynamic data generation
- **`dataSources/enhancedManualData.ts`** - Technical knowledge with OpenAI

### Local Workflows (OpenAI Integration)

- **`hostedDatasetLocalWorkflow.ts`** - Hosted data + custom OpenAI processing
- **`localDatasetLocalWorkflow.ts`** - HR assistant with complete local control
- **`customOutputProcessing.ts`** - Advanced OpenAI processing with metadata

### Custom Evaluators (AI-Powered)

- **`evaluation/customEvaluator.ts`** - GPT-based response evaluation
- **`evaluation/humanEvaluation.ts`** - Human evaluation workflows
- **`evaluation/customCombinedProcessingEvaluator.ts`** - Multi-criteria evaluation
- **`evaluation/localEvaluatorsHostedWorkflow.ts`** - Custom evaluators + hosted workflows
- **`evaluation/localEvaluatorsLocalWorkflow.ts`** - Complete local evaluation
- **`evaluation/advancedCustomEvaluatorPatterns.ts`** - Sophisticated evaluation patterns

## 🎯 Key Patterns

### Basic Test

```typescript
const result = await maxim
  .createTestRun("My Test", workspaceId)
  .withData(datasetId)
  .withWorkflowId(workflowId)
  .withEvaluators("Bias", "Clarity")
  .run();
```

### OpenAI Workflow

```typescript
.yieldsOutput(async data => {
  const aiResponse = await generateResponse(data.Input, data.Context, "System prompt");
  return { data: aiResponse.response, meta: { usage: aiResponse.usage, cost: aiResponse.cost } };
})
```

### AI Evaluator

```typescript
const evaluator = createCustomEvaluator("ai-eval", async (result, data) => {
  const evaluation = await evaluateWithGPT(result.output, data["Expected Output"], "Criteria", data.Context);
  return { score: evaluation.score, reasoning: evaluation.reasoning };
});
```

## 🏆 Best Practices

- **Concurrency**: Start with 2-3, adjust based on API limits
- **Error Handling**: Use try-catch in custom workflows and evaluators
- **Cost Tracking**: Monitor usage with metadata tracking

## 🛠️ Utilities

**`utils/openai-helper.ts`** - Shared OpenAI functions following DRY principles:

- `generateResponse()` - Standard OpenAI completion with cost tracking
- `evaluateWithGPT()` - AI-powered evaluation with reasoning

Start with `basic.ts` to understand fundamentals, then explore specific patterns for your use case.
