"use client";

import { useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Upload, FileText, Trash2, CheckCircle, XCircle,
  Loader2, ChevronDown, ChevronUp, Send, RotateCcw, AlertCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type ScoringResult = {
  file_name: string;
  score: number;
  recommendation: "Interview" | "Hold" | "Reject" | "Error";
  trang_thai: string;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  extracted_info: Record<string, string>;
  submitted?: boolean;
  error?: string;
};

type FileItem = { file: File; id: string };

const NGUON_OPTIONS = ["TopCV", "LinkedIn", "Email", "Referral", "Nội bộ", "Khác"];

// ─── Score color ──────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75) return { text: "text-emerald-600", bg: "bg-emerald-500", bar: "bg-emerald-400" };
  if (score >= 50) return { text: "text-amber-500", bg: "bg-amber-400", bar: "bg-amber-400" };
  return { text: "text-rose-500", bg: "bg-rose-500", bar: "bg-rose-400" };
}

// ─── Result Card ─────────────────────────────────────────────────────────────
function ResultCard({
  result,
  onSubmit,
}: {
  result: ScoringResult;
  onSubmit: (r: ScoringResult) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const c = scoreColor(result.score);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(result);
    setSubmitting(false);
  };

  if (result.error) {
    return (
      <div className="glass rounded-2xl p-5 border border-rose-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-rose-500 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-rose-600 text-sm">{result.file_name}</p>
            <p className="text-rose-400 text-xs mt-0.5">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/40 hover:shadow-lg transition-all">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        {/* Score circle */}
        <div className={`w-16 h-16 rounded-2xl ${c.bg} flex flex-col items-center justify-center shrink-0 shadow`}>
          <span className="text-white font-bold text-xl leading-none">{result.score}</span>
          <span className="text-white/70 text-xs">/100</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[#005088] truncate">
            {result.extracted_info?.ten_ung_vien || result.file_name}
          </p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {result.extracted_info?.vi_tri || "N/A"} · {result.extracted_info?.kinh_nghiem || "N/A"} · {result.extracted_info?.khu_vuc || "N/A"}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${result.score}%` }} />
          </div>
        </div>

        {/* Status + buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {result.trang_thai === "PASS CV" ? (
            <span className="badge-pass px-3 py-1 rounded-full text-xs font-semibold">✓ PASS CV</span>
          ) : (
            <span className="badge-fail px-3 py-1 rounded-full text-xs font-semibold">✗ FAIL</span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {!result.submitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#005088] hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Ghi Sheets
            </button>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
              <CheckCircle size={13} /> Đã ghi
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/40 px-5 pb-5 pt-4 grid grid-cols-2 gap-6 text-sm">
          {/* Left: skills */}
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-emerald-600 mb-1.5">✅ Kỹ năng tương thích</p>
              <ul className="space-y-1">
                {result.matching_skills.length ? result.matching_skills.map((s, i) => (
                  <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>
                )) : <li className="text-slate-400 text-xs italic">Không có</li>}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-rose-500 mb-1.5">❌ Kỹ năng còn thiếu</p>
              <ul className="space-y-1">
                {result.missing_skills.length ? result.missing_skills.map((s, i) => (
                  <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5"><span className="text-rose-300 mt-0.5">•</span>{s}</li>
                )) : <li className="text-slate-400 text-xs italic">Không có</li>}
              </ul>
            </div>
          </div>

          {/* Right: info + summary */}
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-600 mb-1.5">📋 Thông tin trích xuất</p>
              <div className="space-y-1 text-xs text-slate-500">
                {[
                  ["Email", result.extracted_info?.email],
                  ["SĐT", result.extracted_info?.sdt],
                  ["Bằng cấp", result.extracted_info?.bang_cap],
                  ["Chuyên ngành", result.extracted_info?.chuyen_nganh],
                  ["Phòng ban", result.extracted_info?.phong_ban],
                  ["Người đánh giá", result.extracted_info?.nguoi_danh_gia],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">{label}:</span>
                    <span className="text-slate-600">{val || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-600 mb-1">📝 Nhận xét AI</p>
              <p className="text-slate-500 text-xs leading-relaxed">{result.summary}</p>
              <p className="mt-1.5 text-xs font-medium">
                Khuyến nghị:{" "}
                <span className={result.recommendation === "Interview" ? "text-emerald-600" : result.recommendation === "Hold" ? "text-amber-500" : "text-rose-500"}>
                  {result.recommendation}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChamCVPage() {
  const [jdText, setJdText] = useState("");
  const [nguon, setNguon] = useState("TopCV");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [results, setResults] = useState<ScoringResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg";

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((f) => ({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` }));
    setFiles((prev) => {
      const existing = new Set(prev.map((x) => x.file.name));
      return [...prev, ...items.filter((x) => !existing.has(x.file.name))];
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [addFiles]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const startScoring = async () => {
    if (!jdText.trim()) { alert("Vui lòng nhập mô tả công việc (JD)."); return; }
    if (files.length === 0) { alert("Vui lòng chọn ít nhất 1 file CV."); return; }

    setProcessing(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });

    const newResults: ScoringResult[] = [];

    for (const item of files) {
      const formData = new FormData();
      formData.append("cv_file", item.file);
      formData.append("jd_text", jdText);
      formData.append("nguon", nguon);

      try {
        const res = await fetch("/api/score-cv", { method: "POST", body: formData });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const r: ScoringResult = {
          file_name: item.file.name,
          score: data.score ?? 0,
          recommendation: data.recommendation ?? "Reject",
          trang_thai: data.extracted_info?.trang_thai ?? "FAIL",
          matching_skills: data.matching_skills ?? [],
          missing_skills: data.missing_skills ?? [],
          summary: data.summary ?? "",
          extracted_info: data.extracted_info ?? {},
          submitted: false,
        };
        newResults.push(r);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        newResults.push({
          file_name: item.file.name, score: 0, recommendation: "Error",
          trang_thai: "FAIL", matching_skills: [], missing_skills: [],
          summary: "", extracted_info: {}, submitted: false, error: msg,
        });
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    // Sort by score desc
    newResults.sort((a, b) => b.score - a.score);
    setResults(newResults);
    setProcessing(false);
  };

  const submitToSheets = async (result: ScoringResult) => {
    try {
      const res = await fetch("/api/submit-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_info: result.extracted_info }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults((prev) =>
        prev.map((r) => r.file_name === result.file_name ? { ...r, submitted: true } : r)
      );
    } catch (e) {
      alert("Lỗi ghi Sheets: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const submitAll = async () => {
    const unsubmitted = results.filter((r) => !r.submitted && !r.error);
    for (const r of unsubmitted) await submitToSheets(r);
  };

  const reset = () => { setFiles([]); setResults([]); setProgress({ done: 0, total: 0 }); };

  const passCount = results.filter((r) => r.trang_thai === "PASS CV").length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <Header title="Chấm Điểm CV – AI" subtitle="Upload CV, AI phân tích & chấm điểm tự động" />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Config Panel ── */}
            <div className="grid grid-cols-3 gap-6">
              {/* JD Input */}
              <div className="col-span-2 glass rounded-2xl p-6 space-y-3">
                <label className="font-heading font-semibold text-[#005088] flex items-center gap-2">
                  <FileText size={16} /> Mô tả công việc (JD)
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={8}
                  placeholder="Paste Job Description vào đây…&#10;Ví dụ: Vị trí Trợ lý Giám đốc, yêu cầu tốt nghiệp CĐ/ĐH ngành Xây dựng..."
                  className="w-full resize-none text-sm bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-slate-700 placeholder:text-slate-400"
                />
              </div>

              {/* Settings */}
              <div className="glass rounded-2xl p-6 space-y-4 flex flex-col">
                <p className="font-heading font-semibold text-[#005088]">⚙️ Cấu hình</p>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nguồn CV</label>
                  <select
                    value={nguon}
                    onChange={(e) => setNguon(e.target.value)}
                    className="w-full text-sm bg-white/50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  >
                    {NGUON_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    id="btn-start-scoring"
                    onClick={startScoring}
                    disabled={processing || files.length === 0 || !jdText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#005088] hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : "🚀"}
                    {processing ? `Đang chấm ${progress.done}/${progress.total}...` : "Bắt đầu chấm điểm"}
                  </button>
                  {results.length > 0 && (
                    <>
                      <button
                        onClick={submitAll}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
                      >
                        <Send size={14} /> Ghi tất cả vào Google Sheets
                      </button>
                      <button
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm py-2 rounded-xl transition-colors"
                      >
                        <RotateCcw size={13} /> Làm lại
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Upload Zone ── */}
            {results.length === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`glass rounded-2xl border-2 border-dashed transition-all cursor-pointer p-10 text-center ${isDragging ? "border-[#005088] bg-blue-50/50 scale-[1.01]" : "border-slate-200 hover:border-[#005088]/50 hover:bg-blue-50/20"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={(e) => addFiles(Array.from(e.target.files || []))}
                />
                <Upload size={32} className="mx-auto text-[#005088]/50 mb-3" />
                <p className="font-heading font-semibold text-[#005088]">Kéo thả hoặc click để chọn CV</p>
                <p className="text-slate-400 text-sm mt-1">Hỗ trợ: PDF, DOCX, DOC, PNG, JPG, TXT · Nhiều file cùng lúc</p>
              </div>
            )}

            {/* ── File List ── */}
            {files.length > 0 && results.length === 0 && (
              <div className="glass rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-semibold text-[#005088] text-sm">{files.length} file đã chọn</p>
                  <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-rose-500 transition-colors">Xóa tất cả</button>
                </div>
                {files.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white/50 rounded-xl px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={14} className="text-[#005088] shrink-0" />
                      <span className="text-slate-700 truncate">{item.file.name}</span>
                      <span className="text-slate-400 text-xs shrink-0">({(item.file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button onClick={() => removeFile(item.id)} className="p-1 hover:text-rose-500 text-slate-400 transition-colors shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Progress ── */}
            {processing && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#005088]">Đang xử lý hồ sơ...</span>
                  <span className="text-sm text-slate-500">{progress.done}/{progress.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#005088] rounded-full transition-all duration-500" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {/* ── Results ── */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-[#005088]">
                    Kết quả – {results.length} ứng viên
                    {" "}· <span className="text-emerald-600">{passCount} PASS CV</span>
                    {" "}· <span className="text-rose-500">{results.length - passCount} FAIL</span>
                  </h2>
                  <button onClick={() => { setResults([]); }} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <RotateCcw size={12} /> Chấm lại
                  </button>
                </div>
                {results.map((r) => (
                  <ResultCard key={r.file_name} result={r} onSubmit={submitToSheets} />
                ))}
              </div>
            )}

            {/* ── Empty state ── */}
            {results.length === 0 && files.length === 0 && !processing && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CheckCircle size={40} className="mx-auto text-slate-200" />
                <p className="text-sm">Upload CV và nhập JD để bắt đầu chấm điểm AI</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
