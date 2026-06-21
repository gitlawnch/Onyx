/** Helpers for consistent API route responses. */
import { NextResponse } from "next/server";
import type { ApiResult } from "@/types";

export function ok<T>(data: T): NextResponse<ApiResult<T>> {
  return NextResponse.json({
    ok: true,
    data,
    error: null,
    generatedAt: new Date().toISOString(),
  });
}

export function fail<T = null>(
  error: string,
  status = 500
): NextResponse<ApiResult<T>> {
  return NextResponse.json(
    { ok: false, data: null, error, generatedAt: new Date().toISOString() },
    { status }
  );
}
