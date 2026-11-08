import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ service: "ParkingControl", status: "scaffold-ok", databaseChecked: false });
}
