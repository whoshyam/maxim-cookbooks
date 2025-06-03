import { createDataStructure, Data, LocalEvaluationResult, Maxim, TestRunLogger, YieldedOutput } from "@maximai/maxim-js";
import "dotenv/config";

// Validate required environment variables
const requiredEnvVars = {
  MAXIM_API_KEY: process.env.MAXIM_API_KEY,
  MAXIM_WORKSPACE_ID: process.env.MAXIM_WORKSPACE_ID,
  MAXIM_WORKFLOW_ID: process.env.MAXIM_WORKFLOW_ID,
  MAXIM_DATASET_ID: process.env.MAXIM_DATASET_ID,
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

// Custom logger implementation with structured logging
class DetailedTestRunLogger implements TestRunLogger<typeof dataStructure> {
  private startTime = Date.now();
  private processedCount = 0;

  error(message: string) {
    console.error(`❌ [ERROR] ${message}`);
  }

  info(message: string) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.info(`ℹ️  [INFO] [${elapsed}s] ${message}`);
  }

  processed(
    message: string,
    data: {
      datasetEntry: Data<typeof dataStructure>;
      output?: YieldedOutput;
      evaluationResults?: LocalEvaluationResult[];
    }
  ) {
    this.processedCount++;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    console.log(`✅ [PROCESSED ${this.processedCount}] [${elapsed}s] ${message}`);

    // Optionally log detailed information (uncomment for debugging)
    // console.log(`   📝 Input: ${data.datasetEntry.Input.substring(0, 50)}...`);
    // console.log(`   🔄 Output: ${data.output?.data?.substring(0, 50)}...`);
    // if (data.evaluationResults) {
    //   console.log(`   📊 Evaluations: ${data.evaluationResults.length} completed`);
    // }
  }
}

// Run test with custom logger
const result = await maxim
  .createTestRun(`Custom Logger Test - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(MAXIM_DATASET_ID)
  .withWorkflowId(MAXIM_WORKFLOW_ID)
  .withEvaluators("Faithfulness", "Semantic Similarity")
  .withLogger(new DetailedTestRunLogger())
  .withConcurrency(2)
  .run();

// Display final results
console.log("\n📊 Custom Logger Test Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📊 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

await maxim.cleanup();
