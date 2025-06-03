import { createDataStructure, Maxim } from "@maximai/maxim-js";
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

// Define data structure for customer support scenarios
const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Realistic customer support test data
const customerSupportData = [
  {
    Input: "My order hasn't arrived and it's been 5 days since the expected delivery date",
    "Expected Output":
      "I apologize for the delay with your order. Let me track your package and provide an update. I'll also check if we can offer expedited shipping or a refund if needed.",
    Context: "Customer ordered electronics worth $299. Original delivery date was 3 days ago. Customer has premium membership.",
  },
  {
    Input: "I want to return this product but I lost the receipt",
    "Expected Output":
      "No problem! I can help you with the return using your email or phone number to look up the purchase. Many returns can be processed without the physical receipt.",
    Context:
      "Product was purchased 2 weeks ago. Return policy allows 30 days for returns. Customer purchase history shows regular purchases.",
  },
  {
    Input: "Your website is not working properly and I can't complete my purchase",
    "Expected Output":
      "I'm sorry you're experiencing technical difficulties. Let me help you complete your purchase over the phone or provide alternative solutions to resolve this issue quickly.",
    Context: "Customer is trying to purchase during a high-traffic sale period. Similar technical issues reported by other customers.",
  },
  {
    Input: "I was charged twice for the same order",
    "Expected Output":
      "I sincerely apologize for the duplicate charge. This appears to be a processing error. I'll immediately initiate a refund for the duplicate charge and ensure this doesn't happen again.",
    Context: "Customer's payment method was charged twice within 2 minutes. Order shows only one item shipped. Clear system error.",
  },
  {
    Input: "Can you explain the differences between your premium and basic plans?",
    "Expected Output":
      "I'd be happy to explain our plans. The premium plan includes faster shipping, priority support, and exclusive discounts, while the basic plan covers standard shipping and regular customer service.",
    Context: "Customer is considering upgrading from basic plan. Current customer for 6 months with good payment history.",
  },
];

// Run test with manual data
const result = await maxim
  .createTestRun(`Manual Data Test - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(customerSupportData) // Use our manually created dataset
  .withWorkflowId(MAXIM_WORKFLOW_ID)
  .withEvaluators("Faithfulness", "Semantic Similarity")
  .withConcurrency(2)
  .run();

// Display results
console.log("\n📋 Manual Data Test Results");
console.log("=====================================");
console.log(`📊 Total test cases: ${customerSupportData.length}`);
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📈 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

console.log("\n💡 Manual Data Benefits:");
console.log("• Complete control over test scenarios");
console.log("• Easy to create and modify test cases");
console.log("• Perfect for specific edge cases and scenarios");
console.log("• Great for testing customer support, FAQ, and domain-specific responses");

await maxim.cleanup();
