import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "./errors";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (isAppError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function withApiHandler<T>(
  handler: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const result = await handler();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
