// lib/api.ts
// API layer – giao tiếp với Google Apps Script

const SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";
const SECRET = process.env.APPS_SCRIPT_SECRET || "CV_SCORER_SECRET_2025";

export type Candidate = {
  STT: number;
  "Ngày": string;
  "Tên ứng viên": string;
  Email: string;
  "SĐT": string;
  "Bằng cấp": string;
  "Chuyên ngành": string;
  "Kinh nghiệm": string;
  "Chức danh gần nhất": string;
  "Công ty gần nhất": string;
  "Khu vực": string;
  "Phòng Ban": string;
  "Vị trí": string;
  "Trạng thái": string;
  "Nguồn": string;
  "Người đánh giá": string;
  [key: string]: unknown;
};

export type Stats = {
  success: boolean;
  total_candidates: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
  vong1_count: number;
  vong2_count: number;
  thuviec_count: number;
  hd_count: number;
  by_department: Record<string, number>;
  by_month: Record<string, number>;
};

// ── READ ────────────────────────────────────────────────────────────────────

export async function fetchCandidates(sheet = "Tổng Hợp"): Promise<Candidate[]> {
  const url = `${SCRIPT_URL}?action=getData&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  return json.data || [];
}

export async function fetchStats(): Promise<Stats> {
  const url = `${SCRIPT_URL}?action=getStats`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  return json;
}

// ── WRITE ───────────────────────────────────────────────────────────────────

async function postScript(body: object) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ secret: SECRET, ...body }),
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
  });
  return res.json();
}

export async function addCandidate(row: unknown[]): Promise<unknown> {
  return postScript({ action: "append", row });
}

export async function updateCandidate(
  stt: number,
  updates: Record<string, unknown>,
  sheet = "Tổng Hợp"
): Promise<unknown> {
  return postScript({ action: "update", stt, updates, sheet });
}

export async function deleteCandidate(stt: number, sheet = "Tổng Hợp"): Promise<unknown> {
  return postScript({ action: "delete", stt, sheet });
}
