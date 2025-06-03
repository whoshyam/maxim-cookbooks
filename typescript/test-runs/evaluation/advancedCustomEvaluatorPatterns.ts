import { createCustomCombinedEvaluatorsFor, createCustomEvaluator, createDataStructure, Maxim } from "@maximai/maxim-js";
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
  Category: "VARIABLE",
});

// Helper function to normalize string | string[] to string | undefined
function normalizeStringValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  return value;
}

// Advanced Pattern 1: Multi-criteria Technical Accuracy Evaluator
const technicalAccuracyEvaluator = createCustomEvaluator<typeof dataStructure>(
  "technical-accuracy-evaluator",
  async (result, data) => {
    const evaluation = await evaluateTechnicalAccuracy(
      result.output,
      normalizeStringValue(data["Expected Output"]) || "",
      normalizeStringValue(data.Context)
    );
    return {
      score: evaluation.score,
      reasoning: evaluation.reasoning,
    };
  },
  {
    onEachEntry: {
      scoreShouldBe: ">=",
      value: 0.75, // Require at least 75% accuracy
    },
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 85, // At least 85% of entries should pass
      for: "percentageOfPassedResults",
    },
  }
);

// Advanced Pattern 2: Contextual Relevance with Adaptive Scoring
const contextualRelevanceEvaluator = createCustomEvaluator<typeof dataStructure>(
  "contextual-relevance-evaluator",
  async (result, data) => {
    const evaluation = await evaluateContextualRelevance(
      result.output,
      data.Input,
      normalizeStringValue(data.Context),
      normalizeStringValue(data.Category)
    );
    return {
      score: evaluation.score,
      reasoning: evaluation.reasoning,
    };
  },
  {
    onEachEntry: {
      scoreShouldBe: ">=",
      value: 0.6, // Adaptive threshold based on category complexity
    },
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 3.5, // Average score across all entries should be at least 3.5/5
      for: "average",
    },
  }
);

// Advanced Pattern 3: Response Completeness and Structure Evaluator
const completenessStructureEvaluator = createCustomEvaluator<typeof dataStructure>(
  "completeness-structure-evaluator",
  async (result, data) => {
    const evaluation = await evaluateCompletenessAndStructure(
      result.output,
      data.Input,
      normalizeStringValue(data["Expected Output"]) || ""
    );
    return {
      score: evaluation.score,
      reasoning: evaluation.reasoning,
    };
  },
  {
    onEachEntry: {
      scoreShouldBe: "=",
      value: true, // Boolean evaluation - must be complete and well-structured
    },
    forTestrunOverall: {
      overallShouldBe: ">=",
      value: 90, // 90% of responses should be complete and well-structured
      for: "percentageOfPassedResults",
    },
  }
);

// Advanced Pattern 4: Combined Multi-Dimensional Evaluator
const multiDimensionalEvaluator = createCustomCombinedEvaluatorsFor("clarity-score", "innovation-score", "practicality-score").build<
  typeof dataStructure
>(
  async (result, data) => {
    const evaluation = await evaluateMultipleDimensions(
      result.output,
      data.Input,
      normalizeStringValue(data.Context),
      normalizeStringValue(data.Category)
    );
    return {
      "clarity-score": {
        score: evaluation.clarity,
        reasoning: evaluation.clarityReasoning,
      },
      "innovation-score": {
        score: evaluation.innovation,
        reasoning: evaluation.innovationReasoning,
      },
      "practicality-score": {
        score: evaluation.practicality,
        reasoning: evaluation.practicalityReasoning,
      },
    };
  },
  {
    "clarity-score": {
      onEachEntry: {
        scoreShouldBe: ">=",
        value: 3.0, // Clarity must be at least 3.0/5.0
      },
      forTestrunOverall: {
        overallShouldBe: ">=",
        value: 3.5,
        for: "average",
      },
    },
    "innovation-score": {
      onEachEntry: {
        scoreShouldBe: ">=",
        value: 2.5, // Innovation threshold is lower, more flexible
      },
      forTestrunOverall: {
        overallShouldBe: ">=",
        value: 3.0,
        for: "average",
      },
    },
    "practicality-score": {
      onEachEntry: {
        scoreShouldBe: ">=",
        value: 3.5, // Practicality is most important
      },
      forTestrunOverall: {
        overallShouldBe: ">=",
        value: 4.0,
        for: "average",
      },
    },
  }
);

const result = await maxim
  .createTestRun(`advanced evaluator patterns test on ${Date.now()}`, workspaceId)
  .withDataStructure(dataStructure)
  .withData(datasetId)
  .withWorkflowId(workflowId)
  .withEvaluators(
    "Bias", // Built-in evaluator
    technicalAccuracyEvaluator,
    contextualRelevanceEvaluator,
    completenessStructureEvaluator,
    multiDimensionalEvaluator
  )
  .withConcurrency(2)
  .run();

console.log("\n\n========Advanced Evaluator Patterns Results========");
console.log("\nFailed values: ", result.failedEntryIndices);
console.log("\nTest run link: ", result.testRunResult.link);
console.log("\nFinal result: ", result.testRunResult.result[0]);

console.log("\n========Evaluator Patterns Summary========");
console.log("✓ Technical Accuracy: Multi-criteria assessment with domain expertise");
console.log("✓ Contextual Relevance: Adaptive scoring based on category complexity");
console.log("✓ Completeness & Structure: Boolean evaluation with structural analysis");
console.log("✓ Multi-Dimensional: Combined clarity, innovation, and practicality scoring");
console.log("✓ Sophisticated Pass/Fail Criteria: Entry-level and overall thresholds");
console.log("✓ Domain-Aware Evaluation: Category-specific assessment logic");

await maxim.cleanup();

// Advanced evaluation functions

async function evaluateTechnicalAccuracy(output: string, expectedOutput: string, context?: string) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const outputLower = output.toLowerCase();
  const expectedLower = expectedOutput.toLowerCase();

  // Extract technical terms and concepts
  const technicalTerms = extractTechnicalTerms(expectedLower);
  const outputTerms = extractTechnicalTerms(outputLower);

  // Calculate term coverage
  const termCoverage =
    technicalTerms.length > 0 ? technicalTerms.filter(term => outputTerms.includes(term)).length / technicalTerms.length : 0.5;

  // Calculate conceptual accuracy using semantic similarity approximation
  const conceptualAccuracy = calculateSemanticSimilarity(outputLower, expectedLower);

  // Context utilization bonus
  const contextBonus = context && outputLower.includes(context.toLowerCase().split(" ")[0]) ? 0.1 : 0;

  const score = Math.min(1.0, termCoverage * 0.4 + conceptualAccuracy * 0.5 + contextBonus);

  return {
    score,
    reasoning: `Technical accuracy assessment: ${(termCoverage * 100).toFixed(1)}% term coverage, ${(conceptualAccuracy * 100).toFixed(
      1
    )}% conceptual alignment${contextBonus > 0 ? ", context utilized" : ""}. Overall score: ${score.toFixed(2)}`,
  };
}

async function evaluateContextualRelevance(output: string, input: string, context?: string, category?: string) {
  await new Promise(resolve => setTimeout(resolve, 400));

  const outputLower = output.toLowerCase();
  const inputLower = input.toLowerCase();
  const contextLower = context?.toLowerCase() || "";

  // Calculate input-output relevance
  const inputRelevance = calculateSemanticSimilarity(outputLower, inputLower);

  // Calculate context utilization
  const contextUtilization = context ? calculateContextUsage(outputLower, contextLower) : 0.5;

  // Category-specific weighting
  const categoryWeight = getCategoryComplexityWeight(category);

  // Adaptive scoring based on category
  const baseScore = (inputRelevance * 0.6 + contextUtilization * 0.4) * categoryWeight;
  const score = Math.min(5.0, Math.max(1.0, baseScore * 5)); // Scale to 1-5

  return {
    score,
    reasoning: `Contextual relevance: ${(inputRelevance * 100).toFixed(1)}% input alignment, ${(contextUtilization * 100).toFixed(
      1
    )}% context usage, category weight: ${categoryWeight.toFixed(2)}. Score: ${score.toFixed(1)}/5.0`,
  };
}

async function evaluateCompletenessAndStructure(output: string, input: string, expectedOutput: string) {
  await new Promise(resolve => setTimeout(resolve, 350));

  // Analyze structure
  const hasProperStructure = analyzeResponseStructure(output);

  // Analyze completeness
  const completeness = calculateCompleteness(output, input, expectedOutput);

  // Combined evaluation
  const isComplete = hasProperStructure && completeness >= 0.7;

  return {
    score: isComplete,
    reasoning: `Structure analysis: ${hasProperStructure ? "Well-structured" : "Poor structure"}, Completeness: ${(
      completeness * 100
    ).toFixed(1)}%. ${isComplete ? "Meets standards" : "Needs improvement"}`,
  };
}

async function evaluateMultipleDimensions(output: string, input: string, context?: string, category?: string) {
  await new Promise(resolve => setTimeout(resolve, 600));

  // Clarity evaluation (1-5 scale)
  const clarity = evaluateClarity(output);

  // Innovation evaluation (1-5 scale)
  const innovation = evaluateInnovation(output, category);

  // Practicality evaluation (1-5 scale)
  const practicality = evaluatePracticality(output, input, context);

  return {
    clarity: clarity.score,
    clarityReasoning: clarity.reasoning,
    innovation: innovation.score,
    innovationReasoning: innovation.reasoning,
    practicality: practicality.score,
    practicalityReasoning: practicality.reasoning,
  };
}

// Helper functions

function extractTechnicalTerms(text: string): string[] {
  // Simplified technical term extraction
  const technicalPatterns = [
    /\b\w*(?:tion|sion|ment|ness|ity|ing|ed)\b/g,
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g, // CamelCase
    /\b\w+[-_]\w+\b/g, // hyphenated or underscored
  ];

  const terms = new Set<string>();
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => terms.add(match.toLowerCase()));
  });

  return Array.from(terms).filter(term => term.length > 3);
}

function calculateSemanticSimilarity(text1: string, text2: string): number {
  // Simplified semantic similarity using word overlap
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateContextUsage(output: string, context: string): number {
  if (!context) return 0.5;

  const contextWords = context.split(/\s+/).filter(w => w.length > 3);
  const outputWords = output.split(/\s+/);

  const usedContextWords = contextWords.filter(cw => outputWords.some(ow => ow.includes(cw) || cw.includes(ow)));

  return contextWords.length > 0 ? usedContextWords.length / contextWords.length : 0.5;
}

function getCategoryComplexityWeight(category?: string): number {
  if (!category) return 1.0;

  const complexityMap: Record<string, number> = {
    "machine learning": 1.3,
    "artificial intelligence": 1.3,
    "distributed systems": 1.2,
    "software architecture": 1.2,
    database: 1.1,
    programming: 1.0,
    general: 0.9,
  };

  const categoryLower = category.toLowerCase();
  return Object.entries(complexityMap).find(([key]) => categoryLower.includes(key))?.[1] || 1.0;
}

function analyzeResponseStructure(output: string): boolean {
  // Check for basic structural elements
  const hasIntroduction = output.length > 50;
  const hasMultipleSentences = output.split(".").length > 1;
  const hasProperLength = output.length >= 30 && output.length <= 1000;
  const hasNoExcessiveRepetition = !/(.{10,})\1{2,}/.test(output);

  return hasIntroduction && hasMultipleSentences && hasProperLength && hasNoExcessiveRepetition;
}

function calculateCompleteness(output: string, input: string, expectedOutput: string): number {
  const expectedConcepts = extractTechnicalTerms(expectedOutput);
  const outputConcepts = extractTechnicalTerms(output);
  const inputConcepts = extractTechnicalTerms(input);

  const expectedCoverage =
    expectedConcepts.length > 0
      ? expectedConcepts.filter(concept => outputConcepts.includes(concept)).length / expectedConcepts.length
      : 0.5;

  const inputAddressing =
    inputConcepts.length > 0 ? inputConcepts.filter(concept => outputConcepts.includes(concept)).length / inputConcepts.length : 0.5;

  return expectedCoverage * 0.7 + inputAddressing * 0.3;
}

function evaluateClarity(output: string) {
  const sentences = output.split(".").filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

  // Optimal sentence length is around 20-40 characters for clarity
  const lengthScore = avgSentenceLength >= 20 && avgSentenceLength <= 40 ? 1.0 : Math.max(0.3, 1.0 - Math.abs(avgSentenceLength - 30) / 30);

  const score = Math.min(5.0, Math.max(1.0, lengthScore * 5));

  return {
    score,
    reasoning: `Clarity assessment: Average sentence length ${avgSentenceLength.toFixed(1)} chars, ${
      sentences.length
    } sentences. Score: ${score.toFixed(1)}/5.0`,
  };
}

function evaluateInnovation(output: string, category?: string) {
  const innovativeTerms = ["novel", "innovative", "breakthrough", "advanced", "cutting-edge", "emerging", "modern", "state-of-the-art"];
  const outputLower = output.toLowerCase();

  const innovationIndicators = innovativeTerms.filter(term => outputLower.includes(term)).length;
  const baseScore = Math.min(1.0, innovationIndicators / 3); // Up to 3 indicators for full score

  // Category bonus for inherently innovative fields
  const categoryBonus = category?.toLowerCase().includes("machine learning") || category?.toLowerCase().includes("ai") ? 0.2 : 0;

  const score = Math.min(5.0, Math.max(1.0, (baseScore + categoryBonus) * 5));

  return {
    score,
    reasoning: `Innovation assessment: ${innovationIndicators} innovative indicators found${
      categoryBonus > 0 ? ", category bonus applied" : ""
    }. Score: ${score.toFixed(1)}/5.0`,
  };
}

function evaluatePracticality(output: string, input: string, context?: string) {
  const practicalTerms = ["implement", "use", "apply", "practice", "example", "step", "method", "approach", "solution"];
  const outputLower = output.toLowerCase();

  const practicalityIndicators = practicalTerms.filter(term => outputLower.includes(term)).length;
  const hasActionableContent = /\b(should|can|will|to|how to|steps?|methods?)\b/.test(outputLower);

  const baseScore = Math.min(1.0, practicalityIndicators / 4 + (hasActionableContent ? 0.3 : 0));
  const score = Math.min(5.0, Math.max(1.0, baseScore * 5));

  return {
    score,
    reasoning: `Practicality assessment: ${practicalityIndicators} practical indicators, ${
      hasActionableContent ? "contains" : "lacks"
    } actionable content. Score: ${score.toFixed(1)}/5.0`,
  };
}
