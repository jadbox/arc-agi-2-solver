import { Groq } from "groq-sdk";

const groq = new Groq();

export async function promptGroq(prompt) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "assistant",
        content: "",
      },
      {
        role: "user",
        content: "",
      },
    ],
    model: "moonshotai/kimi-k2-instruct",
    temperature: 0.6,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null,
  });

  for await (const chunk of chatCompletion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
  return chatCompletion.choices[0]?.message?.content || "";
}

// export callOpenAI as prompt(prompt)
export async function callOpenAI(prompt) {
  const response = await promptGroq(prompt);
  return response;
}
