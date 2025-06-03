import { createCustomEvaluator, createDataStructure, Maxim } from "@maximai/maxim-js";
import "dotenv/config";

let apiKey: string, workspaceId: string, workflowId: string, datasetId: string;
if (!process.env.MAXIM_API_KEY) throw new Error("Missing MAXIM_API_KEY environment variable");
if (!process.env.MAXIM_WORKSPACE_ID) throw new Error("Missing MAXIM_WORKSPACE_ID environment variable");
if (!process.env.MAXIM_WORKFLOW_ID) throw new Error("Missing MAXIM_WORKFLOW_ID environment variable");
if (!process.env.MAXIM_DATASET_ID) throw new Error("Missing MAXIM_DATASET_ID environment variable");
apiKey = process.env.MAXIM_API_KEY;
workspaceId = process.env.MAXIM_WORKSPACE_ID;
workflowId = process.env.MAXIM_WORKFLOW_ID;
datasetId = process.env.MAXIM_DATASET_ID;

const maxim = new Maxim({ apiKey });

const dataStructure = createDataStructure({
  Input: "INPUT",
  "Expected Output": "EXPECTED_OUTPUT",
  Context: "CONTEXT_TO_EVALUATE",
});

// Custom evaluator for response length assessment
const responseLengthEvaluator = createCustomEvaluator<typeof dataStructure>(
  "response-length-evaluator",
  async (result, data) => {
    const response = await evaluateResponseLength(result.output, data["Expected Output"]);
    return {
      score: response.score,
      reasoning: response.reasoning,
    };
  },
  {
    onEachEntry: {
      scoreShouldBe: ">=",
      value: 0.7,
    },
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 75,
      for: "percentageOfPassedResults",
    },
  }
);

// Custom evaluator for keyword presence
const keywordPresenceEvaluator = createCustomEvaluator<typeof dataStructure>(
  "keyword-presence-evaluator",
  async (result, data) => {
    const response = await evaluateKeywordPresence(result.output, data.Input);
    return {
      score: response.score,
      reasoning: response.reasoning,
    };
  },
  {
    onEachEntry: {
      scoreShouldBe: "=",
      value: true,
    },
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 80,
      for: "percentageOfPassedResults",
    },
  }
);

const result = await maxim
  .createTestRun(`local evaluators hosted workflow test on ${Date.now()}`, workspaceId)
  .withDataStructure(dataStructure)
  .withData(datasetId)
  .withWorkflowId(workflowId)
  .withEvaluators("Bias", responseLengthEvaluator, keywordPresenceEvaluator)
  .withConcurrency(2)
  .run();

console.log("\n\n========Test run results========");
console.log("\nFailed values: ", result.failedEntryIndices);
console.log("\nTest run link: ", result.testRunResult.link);
console.log("\nFinal result: ", result.testRunResult.result[0]);

await maxim.cleanup();

// Helper function to evaluate response length appropriateness
async function evaluateResponseLength(output: string, expectedOutput: string) {
  // Simulate evaluation processing time
  await new Promise(resolve => setTimeout(resolve, 300));

  const outputLength = output.length;
  const expectedLength = expectedOutput.length;
  const lengthRatio = outputLength / expectedLength;

  // Consider appropriate if within 50%-200% of expected length
  if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
    return {
      score: Math.min(1.0, 2.0 - Math.abs(1.0 - lengthRatio)),
      reasoning: `Response length (${outputLength} chars) is appropriate compared to expected length (${expectedLength} chars). Ratio: ${lengthRatio.toFixed(
        2
      )}`,
    };
  } else if (lengthRatio < 0.5) {
    return {
      score: lengthRatio * 0.6, // Reduced score for too short
      reasoning: `Response is too short (${outputLength} chars) compared to expected (${expectedLength} chars). Ratio: ${lengthRatio.toFixed(
        2
      )}`,
    };
  } else {
    return {
      score: Math.max(0.3, 1.0 / lengthRatio), // Reduced score for too long
      reasoning: `Response is too long (${outputLength} chars) compared to expected (${expectedLength} chars). Ratio: ${lengthRatio.toFixed(
        2
      )}`,
    };
  }
}

// Helper function to evaluate keyword presence based on input
async function evaluateKeywordPresence(output: string, input: string) {
  // Simulate evaluation processing time
  await new Promise(resolve => setTimeout(resolve, 250));

  const outputLower = output.toLowerCase();
  const inputLower = input.toLowerCase();

  // Extract key terms from input (simple approach - words longer than 3 chars)
  const keyTerms = inputLower
    .split(/\s+/)
    .filter(
      word =>
        word.length > 3 &&
        ![
          "what",
          "when",
          "where",
          "why",
          "how",
          "the",
          "and",
          "or",
          "but",
          "for",
          "with",
          "this",
          "that",
          "they",
          "them",
          "their",
        ].includes(word)
    )
    .map(word => word.replace(/[^\w]/g, ""));

  if (keyTerms.length === 0) {
    return {
      score: true,
      reasoning: "No significant key terms found in input to check for presence.",
    };
  }

  const presentTerms = keyTerms.filter(term => outputLower.includes(term));
  const presenceRatio = presentTerms.length / keyTerms.length;

  const score = presenceRatio >= 0.3; // At least 30% of key terms should be present

  return {
    score,
    reasoning: `${presentTerms.length}/${keyTerms.length} key terms from input found in output (${(presenceRatio * 100).toFixed(
      1
    )}%). Key terms: [${keyTerms.join(", ")}]. Present: [${presentTerms.join(", ")}]`,
  };
}
