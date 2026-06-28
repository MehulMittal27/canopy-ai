import { supabase } from "@/lib/supabase";

export type AssistantCitation = {
  title: string | null;
  sourceUri: string | null;
  excerpt: string | null;
};

export type AssistantResponse = {
  answer: string;
  sessionId: string;
  citations: AssistantCitation[];
};

export async function sendAssistantMessage(input: {
  message: string;
  sessionId: string | null;
}): Promise<AssistantResponse> {
  const { data, error } = await supabase.functions.invoke<AssistantResponse>("bedrock-chat", {
    body: input,
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data?.answer) {
    throw new Error("The assistant did not return a response.");
  }

  return {
    answer: data.answer,
    sessionId: data.sessionId,
    citations: Array.isArray(data.citations) ? data.citations : [],
  };
}

async function getFunctionErrorMessage(error: unknown) {
  const maybeContext = error as { context?: Response; message?: string };

  if (maybeContext.context instanceof Response) {
    try {
      const body = (await maybeContext.context.clone().json()) as { error?: string };
      if (body.error) return body.error;
    } catch (_error) {
      // Fall through to the Supabase error message.
    }
  }

  return maybeContext.message || "Assistant request failed.";
}
