import { createCustomEvaluator, createDataStructure, Maxim } from "@maximai/maxim-js";
import "dotenv/config";
import { evaluateWithGPT } from "../utils/openai-helper.js";

// Validate required environment variables
const requiredEnvVars = {
  MAXIM_API_KEY: process.env.MAXIM_API_KEY,
  MAXIM_WORKSPACE_ID: process.env.MAXIM_WORKSPACE_ID,
  MAXIM_WORKFLOW_ID: process.env.MAXIM_WORKFLOW_ID,
  MAXIM_DATASET_ID: process.env.MAXIM_DATASET_ID,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const MAXIM_API_KEY = requiredEnvVars.MAXIM_API_KEY!;
const MAXIM_WORKSPACE_ID = requiredEnvVars.MAXIM_WORKSPACE_ID!;
const MAXIM_WORKFLOW_ID = requiredEnvVars.MAXIM_WORKFLOW_ID!;
const MAXIM_DATASET_ID = requiredEnvVars.MAXIM_DATASET_ID!;

// Initialize Maxim SDK
const maxim = new Maxim({ apiKey: MAXIM_API_KEY });

// Define data structure
const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Helper function to normalize context
function normalizeContext(context: string | string[] | undefined): string | undefined {
  if (Array.isArray(context)) {
    return context.join("\n");
  }
  return context;
}

// Custom evaluator for response completeness using OpenAI
const responseCompletenessEvaluator = createCustomEvaluator<typeof dataStructure>(
  "response-completeness-evaluator",
  async (result, data) => {
    try {
      // Use GPT to evaluate response completeness
      const evaluation = await evaluateWithGPT(
        result.output,
        data["Expected Output"],
        "Response completeness - Does the output fully address the input question and cover all important points mentioned in the expected output?",
        normalizeContext(data.Context)
      );

      return {
        score: evaluation.score > 0.7, // Convert to boolean - true if score > 0.7
        reasoning: `Completeness Score: ${evaluation.score.toFixed(2)}/1.0. ${evaluation.reasoning}`,
      };
    } catch (error) {
      console.error("Evaluation failed:", error);
      return {
        score: false,
        reasoning: "Evaluation failed due to API error",
      };
    }
  },
  {
    // Entry-level criteria: Each response must be complete (score = true)
    onEachEntry: {
      scoreShouldBe: "=",
      value: true,
    },
    // Overall criteria: At least 80% of responses should be complete
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 80,
      for: "percentageOfPassedResults",
    },
  }
);

// Custom evaluator for response relevance using OpenAI
const responseRelevanceEvaluator = createCustomEvaluator<typeof dataStructure>(
  "response-relevance-evaluator",
  async (result, data) => {
    try {
      // Use GPT to evaluate response relevance
      const evaluation = await evaluateWithGPT(
        result.output,
        data.Input,
        "Response relevance - How well does the output address the specific question or request in the input? Score based on directness and appropriateness.",
        normalizeContext(data.Context)
      );

      return {
        score: evaluation.score,
        reasoning: evaluation.reasoning,
      };
    } catch (error) {
      console.error("Relevance evaluation failed:", error);
      return {
        score: 0.5,
        reasoning: "Relevance evaluation failed, assigned neutral score",
      };
    }
  },
  {
    // Entry-level criteria: Each response should score at least 0.6
    onEachEntry: {
      scoreShouldBe: ">=",
      value: 0.6,
    },
    // Overall criteria: Average relevance score should be at least 0.75
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 0.75,
      for: "average",
    },
  }
);

console.log("🔍 Custom Evaluator Example: AI-Powered Response Assessment");
console.log("============================================================\n");
console.log("This example demonstrates custom evaluators using GPT for intelligent assessment.");
console.log("Benefits: Nuanced evaluation, contextual understanding, detailed reasoning\n");

// Run test with custom AI-powered evaluators
const result = await maxim
  .createTestRun(`Custom AI Evaluators - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(MAXIM_DATASET_ID)
  .withWorkflowId(MAXIM_WORKFLOW_ID)
  .withEvaluators(
    "Faithfulness", // Built-in evaluator
    responseCompletenessEvaluator, // Custom boolean evaluator
    responseRelevanceEvaluator // Custom numerical evaluator
  )
  .withConcurrency(2) // Moderate concurrency for evaluation API calls
  .run();

// Display results
console.log("📊 Custom Evaluator Test Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View detailed results: ${result.testRunResult.link}`);
console.log(`📈 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

console.log("\n🎯 Custom AI Evaluator Benefits:");
console.log("• Intelligent, context-aware evaluation beyond simple metrics");
console.log("• Detailed reasoning for each evaluation decision");
console.log("• Flexible scoring: boolean, numerical, or categorical");
console.log("• Can evaluate subjective qualities like tone, style, appropriateness");
console.log("• Combines with built-in evaluators for comprehensive assessment");
console.log("• Configurable pass/fail criteria at entry and overall levels");

await maxim.cleanup();
