import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "API çalışıyor",
    phase: process.env.NEXT_PHASE || "runtime",
    nodeEnv: process.env.NODE_ENV,
    time: new Date().toISOString(),
  })
}
