import { createDataStructure, Maxim } from "@maximai/maxim-js";
import "dotenv/config";
import { generateResponse } from "./utils/openai-helper.js";

// Validate required environment variables
const requiredEnvVars = {
  MAXIM_API_KEY: process.env.MAXIM_API_KEY,
  MAXIM_WORKSPACE_ID: process.env.MAXIM_WORKSPACE_ID,
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
const MAXIM_DATASET_ID = requiredEnvVars.MAXIM_DATASET_ID!;

// Initialize Maxim SDK
const maxim = new Maxim({ apiKey: MAXIM_API_KEY });

// Define data structure for the test
const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Run test with custom output processing using OpenAI
const result = await maxim
  .createTestRun(`Custom Output Processing - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(MAXIM_DATASET_ID)
  .yieldsOutput(async data => {
    const startTime = Date.now();

    try {
      // Handle context - convert array to string if needed
      const contextString = Array.isArray(data.Context) ? data.Context.join("\n") : data.Context;

      // Generate response using OpenAI with context
      const aiResponse = await generateResponse(
        data.Input,
        contextString,
        "You are a helpful assistant that provides accurate and informative responses."
      );

      return {
        data: aiResponse.response,
        retrievedContextToEvaluate: data.Context,
        meta: {
          usage: aiResponse.usage,
          cost: aiResponse.cost,
          modelUsed: "gpt-3.5-turbo",
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      // If OpenAI call fails, this entry will be marked as failed
      throw new Error(`Failed to process entry: ${error}`);
    }
  })
  .withEvaluators("Faithfulness", "Semantic Similarity")
  .withConcurrency(2) // Process 2 entries in parallel to avoid rate limits
  .run();

// Display results
console.log("\n⚙️ Custom Output Processing Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📊 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

await maxim.cleanup();
