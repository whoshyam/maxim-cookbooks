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

// Define data structure
const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Sample FAQ data for dynamic generation
const faqTopics = [
  {
    category: "Shipping",
    questions: [
      "How long does shipping take?",
      "Can I track my package?",
      "Do you offer international shipping?",
      "What are the shipping costs?",
    ],
    expectedAnswers: [
      "Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days.",
      "Yes, you'll receive a tracking number via email once your order ships.",
      "Yes, we ship to over 50 countries worldwide with varying delivery times.",
      "Shipping costs vary by location and speed, starting from $5.99 for standard delivery.",
    ],
    contexts: [
      "Company shipping policy document",
      "Order tracking system information",
      "International shipping guidelines",
      "Current shipping rate table",
    ],
  },
  {
    category: "Returns",
    questions: ["What is your return policy?", "How do I start a return?", "Can I return without a receipt?", "When will I get my refund?"],
    expectedAnswers: [
      "We accept returns within 30 days of purchase for unused items in original packaging.",
      "Contact customer service or use our online return portal to initiate a return.",
      "Yes, we can look up your purchase using your email or phone number.",
      "Refunds are processed within 5-7 business days after we receive your return.",
    ],
    contexts: [
      "Return policy terms and conditions",
      "Customer service return procedures",
      "Customer database lookup system",
      "Refund processing timeline documentation",
    ],
  },
];

// Dynamic data generation function with pagination
function generateTestData(page: number) {
  const PAGE_SIZE = 4;
  const MAX_PAGES = 3;

  // Return null when we've generated enough data
  if (page >= MAX_PAGES) {
    return null;
  }

  console.log(`📦 Generating page ${page + 1} of test data...`);

  const pageData = [];

  for (let i = 0; i < PAGE_SIZE; i++) {
    const itemIndex = page * PAGE_SIZE + i;
    const topicIndex = itemIndex % faqTopics.length;
    const topic = faqTopics[topicIndex];
    const questionIndex = itemIndex % topic.questions.length;

    pageData.push({
      Input: topic.questions[questionIndex],
      "Expected Output": topic.expectedAnswers[questionIndex],
      Context: `${topic.contexts[questionIndex]} - Category: ${topic.category}`,
    });
  }

  return pageData;
}

console.log("🔄 Dynamic Data Generation Example");
console.log("=====================================\n");

// Run test with dynamic data generation
const result = await maxim
  .createTestRun(`Dynamic Data Test - ${new Date().toISOString()}`, MAXIM_WORKSPACE_ID)
  .withDataStructure(dataStructure)
  .withData(generateTestData) // Use function for dynamic data generation
  .withWorkflowId(MAXIM_WORKFLOW_ID)
  .withEvaluators("Faithfulness", "Semantic Similarity")
  .withConcurrency(2)
  .run();

// Display results
console.log("📊 Dynamic Data Test Results");
console.log("=====================================");
console.log(`❌ Failed entries: ${result.failedEntryIndices.length > 0 ? result.failedEntryIndices.join(", ") : "None"}`);
console.log(`🔗 View results: ${result.testRunResult.link}`);
console.log(`📈 Summary: ${JSON.stringify(result.testRunResult.result[0], null, 2)}`);

console.log("\n💡 Dynamic Data Generation Benefits:");
console.log("• Generate data on-demand from APIs or databases");
console.log("• Support pagination for large datasets");
console.log("• Reduce memory usage by loading data incrementally");
console.log("• Enable real-time data fetching for up-to-date tests");
console.log("• Perfect for testing with live data sources");

await maxim.cleanup();
