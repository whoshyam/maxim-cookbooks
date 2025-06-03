import { Maxim } from "@maximai/maxim-js";
import "dotenv/config";

// Validate required environment variables
const requiredEnvVars = {
  MAXIM_API_KEY: process.env.MAXIM_API_KEY,
  MAXIM_WORKSPACE_ID: process.env.MAXIM_WORKSPACE_ID,
  MAXIM_PROMPT_VERSION_ID: process.env.MAXIM_PROMPT_VERSION_ID,
  MAXIM_DATASET_ID: process.env.MAXIM_DATASET_ID,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Extract validated environment variables
const MAXIM_API_KEY = requiredEnvVars.MAXIM_API_KEY!;
const MAXIM_WORKSPACE_ID = requiredEnvVars.MAXIM_WORKSPACE_ID!;
const MAXIM_PROMPT_VERSION_ID = requiredEnvVars.MAXIM_PROMPT_VERSION_ID!;
const MAXIM_DATASET_ID = requiredEnvVars.MAXIM_DATASET_ID!;

// Initialize Maxim SDK
const maxim = new Maxim({ apiKey: MAXIM_API_KEY });

// Test a specific prompt version with moderate concurrency
const result = await maxim
  .createTestRun(`Prompt Version Test - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withData(MAXIM_DATASET_ID) // Use hosted dataset
  .withPromptVersionId(MAXIM_PROMPT_VERSION_ID) // Test specific prompt version
  .withEvaluators("Bias", "Clarity") // Evaluators for quality assessment
  .withConcurrency(2) // Process 2 entries in parallel
  .run();

// Display results
console.log("\n🎯 Prompt Version Test Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📊 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

await maxim.cleanup();
