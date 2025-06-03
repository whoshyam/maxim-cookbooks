import OpenAI from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Standardized OpenAI chat completion with metadata tracking
export async function generateResponse(
  prompt: string,
  context?: string,
  systemMessage: string = "You are a helpful AI assistant."
): Promise<{
  response: string;
  usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
    latency: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
}> {
  const startTime = Date.now();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: "system", content: systemMessage }];

  if (context) {
    messages.push({ role: "user", content: `Context: ${context}` });
  }

  messages.push({ role: "user", content: prompt });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const endTime = Date.now();
    const responseText = completion.choices[0]?.message?.content || "";

    // GPT-3.5-turbo pricing (as of 2024)
    const inputCostPer1K = 0.0015;
    const outputCostPer1K = 0.002;

    const usage = {
      completionTokens: completion.usage?.completion_tokens || 0,
      promptTokens: completion.usage?.prompt_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      latency: endTime - startTime,
    };

    const cost = {
      input: (usage.promptTokens / 1000) * inputCostPer1K,
      output: (usage.completionTokens / 1000) * outputCostPer1K,
      total: (usage.promptTokens / 1000) * inputCostPer1K + (usage.completionTokens / 1000) * outputCostPer1K,
    };

    return {
      response: responseText,
      usage,
      cost,
    };
  } catch (error) {
    throw new Error(`OpenAI API call failed: ${error}`);
  }
}

// Specialized function for evaluations
export async function evaluateWithGPT(
  output: string,
  expectedOutput: string,
  criteria: string,
  context?: string
): Promise<{ score: number; reasoning: string }> {
  const evaluationPrompt = `
Please evaluate the following output against the expected output based on the criteria: ${criteria}

Output to evaluate: "${output}"
Expected output: "${expectedOutput}"
${context ? `Context: "${context}"` : ""}

Rate the output on a scale of 0.0 to 1.0 and provide reasoning.
Respond in JSON format: {"score": 0.8, "reasoning": "explanation here"}
`;

  const result = await generateResponse(
    evaluationPrompt,
    undefined,
    "You are an expert evaluator. Provide objective, constructive feedback."
  );

  try {
    const parsed = JSON.parse(result.response);
    return {
      score: Math.max(0, Math.min(1, parsed.score || 0)),
      reasoning: parsed.reasoning || "No reasoning provided",
    };
  } catch {
    // Fallback if JSON parsing fails
    const score = result.response.includes("good") || result.response.includes("excellent") ? 0.8 : 0.5;
    return {
      score,
      reasoning: "Evaluation completed but response format was non-standard",
    };
  }
}
