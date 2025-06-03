import { config } from "dotenv";
import OpenAI from "openai";
import { Maxim } from "@maximai/maxim-js";
import { randomUUID } from "crypto";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

config();

async function advancedTracingExample() {
  console.log("# Advanced Manual Tracing Example\n");
  console.log("This demonstrates advanced tracing features including sessions, spans, and complex workflows.\n");

  // Initialize environment variables
  const apiKey = process.env.MAXIM_API_KEY;
  const logRepoId = process.env.MAXIM_LOG_REPO_ID;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !logRepoId || !openaiApiKey) {
    console.error("Please set MAXIM_API_KEY, MAXIM_LOG_REPO_ID, and OPENAI_API_KEY environment variables");
    process.exit(1);
  }

  // Initialize Maxim SDK and OpenAI client
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

  // Create session for multi-turn conversation
  console.log("## Creating session for multi-turn conversation");

  const session = logger.session({
    id: randomUUID(),
    name: "customer-support-session",
    tags: {
      channel: "web-chat",
      priority: "high",
    },
  });

  console.log("✅ Session created\n");

  // First trace: Product inquiry with intent classification
  console.log("## First trace: User asks about product features");

  const trace1 = logger.sessionTrace(session.id, {
    id: randomUUID(),
    name: "product-inquiry",
  });

  const userQuestion = "Can you tell me about the premium features of your AI platform?";
  trace1.input(userQuestion);

  // Intent classification span
  const intentSpan = trace1.span({
    id: randomUUID(),
    name: "intent-classification",
  });

  const intentConfig = {
    model: "gpt-4o-mini",
    modelParameters: { temperature: 0.1, max_tokens: 10 },
    messages: [
      {
        role: "system" as const,
        content: "Classify the user intent in one word. Options: product_inquiry, support_request, billing, general. Be precise and brief.",
      },
      { role: "user" as const, content: userQuestion },
    ] as ChatCompletionMessageParam[],
  };

  const intentGeneration = intentSpan.generation({
    id: randomUUID(),
    provider: "openai",
    ...intentConfig,
  } as any);

  try {
    const intentResponse = await client.chat.completions.create({
      model: intentConfig.model,
      messages: intentConfig.messages,
      ...intentConfig.modelParameters,
    });

    intentGeneration.result(intentResponse as any);
    console.log("Intent classified:", intentResponse.choices[0]?.message?.content);
  } catch (error) {
    intentGeneration.error({
      message: error instanceof Error ? error.message : "Intent classification failed",
      type: "api_error",
    });
  }

  intentSpan.end();

  // Main feature response generation
  const responseConfig = {
    model: "gpt-4o",
    modelParameters: { temperature: 0.7, max_tokens: 300 },
    messages: [
      {
        role: "system" as const,
        content:
          "You are a helpful AI assistant for a SaaS platform. List premium features as bullet points only - no descriptions or explanations. Maximum 10 features. Be extremely brief.",
      },
      {
        role: "user" as const,
        content: userQuestion,
      },
    ] as ChatCompletionMessageParam[],
  };

  const responseGeneration = trace1.generation({
    id: randomUUID(),
    provider: "openai",
    ...responseConfig,
  } as any);

  try {
    const response = await client.chat.completions.create({
      model: responseConfig.model,
      messages: responseConfig.messages,
      ...responseConfig.modelParameters,
    });

    responseGeneration.result(response as any);
    const responseText = response.choices[0]?.message?.content || "";
    trace1.output(responseText);

    console.log("Response generated:", responseText);

    // Maintain conversation history
    if (response.choices[0]?.message) {
      responseConfig.messages.push(response.choices[0]?.message);
    }
  } catch (error) {
    responseGeneration.error({
      message: error instanceof Error ? error.message : "Response generation failed",
      type: "api_error",
    });
  }

  trace1.end();
  console.log("✅ First trace completed\n");

  // Second trace: Follow-up pricing question with RAG
  console.log("## Second trace: Follow-up pricing question");

  const trace2 = logger.sessionTrace(session.id, {
    id: randomUUID(),
    name: "followup-question",
  });

  const pricingQuestion = "What is the pricing for these premium features?";
  trace2.input(pricingQuestion);

  // Retrieve pricing information
  const pricingRetrieval = trace2.retrieval({
    id: randomUUID(),
    name: "pricing-lookup",
  });

  pricingRetrieval.input("premium pricing plans");

  const retrievedPricing = [
    "Premium Plan: $99/month - Advanced AI models, priority support, custom integrations",
    "Enterprise Plan: $299/month - Custom models, dedicated support, white-label options",
    "Startup Plan: $29/month - Basic AI features, community support, limited integrations",
  ];

  pricingRetrieval.output(retrievedPricing);

  // Add new user question to conversation history
  responseConfig.messages.push({
    role: "user",
    content: pricingQuestion,
  });

  // Generate pricing response with context
  const pricingConfig = {
    model: "gpt-4o",
    modelParameters: { temperature: 0.3, max_tokens: 150 },
    messages: [
      {
        role: "system" as const,
        content: `You are a sales assistant. Use the following pricing information to answer customer questions:

${retrievedPricing.join("\n")}

Provide clear, concise pricing information based on this data. Keep response under 100 words.`,
      },
      ...responseConfig.messages.slice(1),
    ],
  };

  const pricingGeneration = trace2.generation({
    id: randomUUID(),
    provider: "openai",
    ...pricingConfig,
  } as any);

  try {
    const pricingResponse = await client.chat.completions.create({
      model: pricingConfig.model,
      messages: pricingConfig.messages,
      ...pricingConfig.modelParameters,
    });

    pricingGeneration.result(pricingResponse as any);
    const pricingText = pricingResponse.choices[0]?.message?.content || "";
    trace2.output(pricingText);

    console.log("Pricing response:", pricingText);
  } catch (error) {
    pricingGeneration.error({
      message: error instanceof Error ? error.message : "Pricing generation failed",
      type: "api_error",
    });
  }

  trace2.end();
  console.log("✅ Second trace completed\n");

  // Complete session with feedback and tags
  console.log("## Adding session feedback and completing session");

  logger.sessionFeedback(session.id, {
    score: 4,
    comment: "Helpful information about pricing and features",
  });

  logger.sessionTag(session.id, "outcome", "interested");
  logger.sessionTag(session.id, "lead_score", "85");

  logger.sessionEnd(session.id, {
    resolution: "customer_satisfied",
    nextSteps: "schedule_demo",
  });

  console.log("✅ Session completed with feedback and tags\n");

  // Demonstrate error handling
  console.log("## Demonstrating error handling");

  const errorTrace = logger.trace({
    id: randomUUID(),
    name: "error-example",
  });

  errorTrace.input("This will demonstrate error handling");

  const errorGeneration = errorTrace.generation({
    id: randomUUID(),
    provider: "openai",
    model: "invalid-model",
    messages: [{ role: "user", content: "This should fail" }],
    modelParameters: {},
  });

  try {
    await client.chat.completions.create({
      model: "invalid-model" as any,
      messages: [{ role: "user", content: "This should fail" }],
    });
  } catch (error) {
    errorGeneration.error({
      message: error instanceof Error ? error.message : "Unknown error",
      type: "invalid_model_error",
      code: "model_not_found",
    });

    console.log("✅ Error properly logged:", error instanceof Error ? error.message : "Unknown error");
  }

  errorTrace.end();
  console.log("✅ Error trace completed\n");

  await logger.cleanup();
  await maxim.cleanup();

  console.log("✅ Advanced tracing example completed!");
  console.log("\nCheck your Maxim dashboard to see:");
  console.log("- Multi-turn conversation session");
  console.log("- Traces with spans and retrievals");
  console.log("- Proper error handling");
  console.log("- Feedback and tagging");
}

advancedTracingExample().catch(console.error);

export { advancedTracingExample };
