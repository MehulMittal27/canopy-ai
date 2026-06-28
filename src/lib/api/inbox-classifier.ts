import { supabase } from "@/lib/supabase";

export type InboxPriority = "red" | "amber" | "green";
export type ClassificationConfidence = "high" | "medium" | "low";

export interface ClassifyInboxItemInput {
  orgId: string;
  title: string;
  source: string;
  body?: string;
  summary?: string;
  receivedAt?: string;
}

export interface ClassifiedInboxItem {
  title: string;
  source: string;
  summary: string;
  why_relevant: string;
  full_summary: string;
  next_steps: string[];
  priority: InboxPriority;
  tags: string[];
  item_date: string;
  classification_reason: string;
  confidence: ClassificationConfidence;
  used_model: boolean;
}

export async function classifyInboxItem(
  input: ClassifyInboxItemInput,
): Promise<ClassifiedInboxItem> {
  const { data, error } = await supabase.functions.invoke<ClassifiedInboxItem>(
    "classify-inbox-item",
    {
      body: input,
    },
  );

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("No inbox classification was returned.");
  }

  return data;
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

  return maybeContext.message || "Inbox classification failed.";
}
