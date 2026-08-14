import { NextResponse } from "next/server";

import {
  choiceSubmissionSchema,
  questionSubmissionSchema,
  type QuestionResponse
} from "@/features/questions/contracts";
import {
  checkQuestion,
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

  const submission = questionSubmissionSchema.safeParse(payload);
  let response: QuestionResponse;

  if (submission.success) {
    response = submission.data.response;
  } else {
    // A page served before this endpoint was widened posts a bare { optionId }.
    const legacy = choiceSubmissionSchema.safeParse(payload);
    if (!legacy.success) {
      return NextResponse.json({ error: "Answer the question before checking." }, { status: 400 });
    }
    response = { kind: "choice", optionId: legacy.data.response.optionId };
  }

  try {
    const result = await checkQuestion(itemId, response);
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
