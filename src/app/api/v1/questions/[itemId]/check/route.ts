import { NextResponse } from "next/server";

import { choiceSubmissionSchema } from "@/features/questions/contracts";
import {
  checkChoiceQuestion,
  InvalidQuestionResponseError
} from "@/server/content/question-set-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ itemId: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const { itemId } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const submission = choiceSubmissionSchema.safeParse(payload);
  if (!submission.success) {
    return NextResponse.json({ error: "Choose one answer before checking." }, { status: 400 });
  }

  try {
    const result = await checkChoiceQuestion(itemId, submission.data.response.optionId);
    if (!result) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json(
      { data: result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof InvalidQuestionResponseError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("question:check-failed", error);
    return NextResponse.json({ error: "Unable to check this answer." }, { status: 500 });
  }
}
