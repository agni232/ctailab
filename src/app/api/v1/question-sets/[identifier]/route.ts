import { NextResponse } from "next/server";

import { getPublishedQuestionSet } from "@/server/content/question-set-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ identifier: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { identifier } = await context.params;

  try {
    const questionSet = await getPublishedQuestionSet(identifier);
    if (!questionSet) {
      return NextResponse.json({ error: "Question set not found." }, { status: 404 });
    }

    return NextResponse.json(
      { data: questionSet },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400"
        }
      }
    );
  } catch (error) {
    console.error("question-set:read-failed", error);
    return NextResponse.json({ error: "Unable to load this question set." }, { status: 500 });
  }
}
