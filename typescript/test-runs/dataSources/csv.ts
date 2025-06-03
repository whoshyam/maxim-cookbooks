import { createDataStructure, CSVFile, Maxim } from "@maximai/maxim-js";
import "dotenv/config";

// Validate required environment variables
const requiredEnvVars = {
  MAXIM_API_KEY: process.env.MAXIM_API_KEY,
  MAXIM_WORKSPACE_ID: process.env.MAXIM_WORKSPACE_ID,
  MAXIM_WORKFLOW_ID: process.env.MAXIM_WORKFLOW_ID,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const MAXIM_API_KEY = requiredEnvVars.MAXIM_API_KEY!;
const MAXIM_WORKSPACE_ID = requiredEnvVars.MAXIM_WORKSPACE_ID!;
const MAXIM_WORKFLOW_ID = requiredEnvVars.MAXIM_WORKFLOW_ID!;

// Initialize Maxim SDK
const maxim = new Maxim({ apiKey: MAXIM_API_KEY });

// Define data structure matching CSV columns
const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Configure CSV file with column mapping
// The CSV file should have headers: Input, Expected Output, Context
const csvDataSource = new CSVFile("dataSources/test.csv", {
  Input: 0, // First column (index 0)
  "Expected Output": 1, // Second column (index 1)
  Context: 2, // Third column (index 2)
});

console.log("📄 Loading data from CSV file: dataSources/test.csv\n");

// Run test with CSV data
const result = await maxim
  .createTestRun(`CSV Data Test - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(csvDataSource) // Use CSV file as data source
  .withWorkflowId(MAXIM_WORKFLOW_ID)
  .withEvaluators("Faithfulness", "Semantic Similarity")
  .withConcurrency(2)
  .run();

// Display results
console.log("📊 CSV Data Test Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📈 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

console.log("\n💡 CSV Data Source Benefits:");
console.log("• Easy to import data from spreadsheets and databases");
console.log("• Version control friendly for test data");
console.log("• Can be easily shared and edited by non-technical team members");
console.log("• Supports large datasets efficiently");
console.log("• Column mapping allows flexible CSV structure");

await maxim.cleanup();
