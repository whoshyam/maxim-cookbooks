import { config } from "dotenv";
import OpenAI from "openai";
import { Maxim } from "@maximai/maxim-js";
import { randomUUID } from "crypto";

// Load environment variables
config();

async function main() {
  console.log("# Manual Tracing of AI Code\n");
  console.log("This demonstrates how to trace AI code execution using Maxim's manual tracing approach.");
  console.log("We'll analyze the code step by step to understand the flow and behavior of the AI system.\n");

  // Initialize environment variables
  const apiKey = process.env.MAXIM_API_KEY;
  const logRepoId = process.env.MAXIM_LOG_REPO_ID;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !logRepoId || !openaiApiKey) {
    console.error("Please set MAXIM_API_KEY, MAXIM_LOG_REPO_ID, and OPENAI_API_KEY environment variables");
    process.exit(1);
  }

  // Initialize Maxim SDK
  console.log("## Initialize Maxim logger");

  const maxim = new Maxim({
    apiKey: apiKey,
    debug: true,
  });

  const logger = await maxim.logger({ id: logRepoId });
  if (!logger) {
    console.error("Failed to initialize logger");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: openaiApiKey });
  console.log("✅ Maxim logger initialized successfully\n");

  // Create trace for RAG workflow
  console.log("## Creating trace for RAG workflow");

  const trace = logger.trace({
    id: randomUUID(),
    name: "rag-example",
  });

  const userQuery = "Write a haiku about recursion in programming and explain the concept briefly.";
  trace.input(userQuery);
  console.log("✅ Trace created with user query\n");

  // Step 1: Retrieve relevant information
  console.log("## Step 1: Retrieving relevant information");

  const retrieval = trace.retrieval({
    id: randomUUID(),
    name: "recursion-knowledge-lookup",
  });

  retrieval.input("recursion programming concepts examples");

  const retrievedDocs = [
    "Recursion is a programming technique where a function calls itself to solve smaller instances of the same problem. It requires a base case to prevent infinite loops.",
    "A recursive function typically has two parts: a base case that stops the recursion, and a recursive case that calls the function again with modified parameters.",
    "Common examples of recursion include calculating factorials (n! = n × (n-1)!), traversing tree structures, and implementing divide-and-conquer algorithms like quicksort.",
    "In many programming languages, recursion can be elegant but may have performance implications due to stack overflow risks with deep recursion.",
  ];

  retrieval.output(retrievedDocs);
  console.log("✅ Retrieved relevant information about recursion\n");

  // Step 2: Generate response with retrieved context
  console.log("## Step 2: Generating response with retrieved context");

  const context = retrievedDocs.join("\n\n");
  const model = "gpt-4o-mini";
  const modelParameters = {
    temperature: 0.7,
    max_tokens: 300,
  };

  const messages = [
    {
      role: "system" as const,
      content: `You are a helpful programming assistant. Use the following context to inform your response:

Context:
${context}

Based on this context, provide accurate information about recursion.`,
    },
    {
      role: "user" as const,
      content: userQuery,
    },
  ];

  const generation = trace.generation({
    id: randomUUID(),
    provider: "openai",
    model: model,
    messages: messages,
    modelParameters: modelParameters,
  });

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      ...modelParameters,
    });

    generation.result(response as any);

    const responseText = response.choices[0]?.message?.content;
    const usage = response.usage;

    console.log("Response:", responseText);
    console.log("Usage:", usage);
    console.log("✅ LLM call completed with retrieved context\n");

    trace.output(responseText || "No response generated");
  } catch (error) {
    console.error("Error during LLM call:", error);

    generation.error({
      message: error instanceof Error ? error.message : "Unknown error",
      type: "api_error",
    });

    trace.output("Error occurred during response generation");
  }

  trace.end();
  console.log("✅ RAG workflow completed and logged to Maxim");
  console.log("\nThis example demonstrated:");
  console.log("1. 📚 Information retrieval from knowledge base");
  console.log("2. 🤖 Context-aware LLM generation");
  console.log("3. 📊 Complete tracing of the RAG pipeline");

  await logger.cleanup();
  await maxim.cleanup();
}

// Run the example
main().catch(console.error);
