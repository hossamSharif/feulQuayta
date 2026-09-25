import { createServerSupabaseClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { startDate, endDate, stationId } = body;

  const { data, error } = await supabase.rpc("get_cross_station_report", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_station_id: stationId || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
