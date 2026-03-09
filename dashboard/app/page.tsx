"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Users, CheckCircle, Briefcase, Building2,
  TrendingUp, RefreshCw, Plus, Pencil, Trash2, Search, FileCheck
} from "lucide-react";
import { fetchStats, fetchCandidates, deleteCandidate, type Stats, type Candidate } from "@/lib/api";
import AddCandidateModal from "@/components/AddCandidateModal";

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: string; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="font-heading font-bold text-3xl text-[#005088]">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
          <TrendingUp size={12} />
          {trend}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = String(status).trim().toUpperCase();
  if (s === "PASS CV") return <span className="badge-pass px-2.5 py-0.5 rounded-full text-xs font-semibold">✓ PASS CV</span>;
  if (s === "FAIL") return <span className="badge-fail px-2.5 py-0.5 rounded-full text-xs font-semibold">✗ FAIL</span>;
  return <span className="badge-wait px-2.5 py-0.5 rounded-full text-xs">{status}</span>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const DEPARTMENTS = [
    "Phòng Kỹ Thuật", "Phòng Dự Án", "Phòng Kế Hoạch",
    "Phòng Vật Tư Thiết Bị", "Phòng ATLĐ", "Phòng Hành Chính Nhân Sự",
    "Phòng QLCC", "Phòng Trợ Lý", "Phòng Kế Toán"
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([fetchStats(), fetchCandidates()]);
      setStats(s);
      setCandidates(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Charts data ──
  const deptChartData = stats
    ? Object.entries(stats.by_department)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([name, value]) => ({ name: name.replace("Phòng ", ""), value }))
    : [];

  const monthChartData = stats
    ? Object.entries(stats.by_month)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, total]) => ({ month: month.slice(5), "Tổng CV": total, "PASS CV": Math.round(total * (stats.pass_rate / 100)) }))
    : [];

  // ── Filter table ──
  const filtered = candidates.filter(c => {
    const name = String(c["Tên ứng viên"] || "").toLowerCase();
    const email = String(c["Email"] || "").toLowerCase();
    const sdt = String(c["SĐT"] || "").toLowerCase();
    const q = search.toLowerCase();
    const matchQ = !q || name.includes(q) || email.includes(q) || sdt.includes(q);
    const matchDept = filterDept === "all" || c["Phòng Ban"] === filterDept;
    const matchSt = filterStatus === "all" || String(c["Trạng thái"]).toUpperCase() === filterStatus;
    return matchQ && matchDept && matchSt;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (stt: number) => {
    if (!confirm(`Xóa ứng viên STT ${stt}?`)) return;
    await deleteCandidate(stt);
    load();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <Header title="Executive Dashboard" subtitle="Tổng quan nhân sự toàn công ty" />

        <main className="flex-1 p-8 space-y-8">

          {/* ── Refresh ── */}
          <div className="flex justify-end">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 text-sm text-[#005088] hover:text-blue-600 glass px-4 py-2 rounded-xl transition-all active:scale-95">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Đang tải..." : "Làm mới dữ liệu"}
            </button>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-5 gap-5">
            <KpiCard icon={Users} label="Tổng Ứng Viên" value={stats?.total_candidates ?? "–"} color="bg-[#005088]" trend={stats ? `${stats.pass_rate}% PASS CV` : undefined} />
            <KpiCard icon={CheckCircle} label="Tỷ lệ PASS CV" value={stats ? `${stats.pass_rate}%` : "–"} color="bg-emerald-500" trend={`${stats?.pass_count ?? 0} ứng viên`} />
            <KpiCard icon={Briefcase} label="Đang Thử Việc" value={stats?.thuviec_count ?? "–"} color="bg-violet-500" trend={`Vòng 2: ${stats?.vong2_count ?? 0}`} />
            <KpiCard icon={FileCheck} label="HĐ Chính Thức" value={stats?.hd_count ?? "–"} color="bg-rose-500" trend="Đã ký hợp đồng" />
            <KpiCard icon={Building2} label="Ứng Viên Vòng 1" value={stats?.vong1_count ?? "–"} color="bg-cyan-500" trend="Đang phỏng vấn" />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-[#005088] mb-5">Ứng Viên Theo Phòng Ban</h2>
              {deptChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={deptChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(59,130,246,0.05)" }} contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.9)" }} />
                    <Bar dataKey="value" fill="#005088" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
            </div>

            {/* Line Chart */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-[#005088] mb-5">Xu Hướng Tuyển Dụng Theo Tháng</h2>
              {monthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.9)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="Tổng CV" stroke="#005088" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="PASS CV" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
            </div>
          </div>

          {/* ── Filters + Table ── */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Filter bar */}
            <div className="p-5 border-b border-white/40 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm tên, email, SĐT..."
                  className="w-full pl-8 pr-4 py-2 text-sm bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              </div>
              <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                className="text-sm bg-white/50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30">
                <option value="all">Tất cả phòng ban</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="text-sm bg-white/50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30">
                <option value="all">Trạng thái</option>
                <option value="PASS CV">PASS CV</option>
                <option value="FAIL">FAIL</option>
              </select>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#005088] hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition-all active:scale-95 ml-auto shadow-md">
                <Plus size={15} /> Thêm ứng viên
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#005088]/5 to-blue-50 text-left">
                    {["STT", "Ngày", "Tên ứng viên", "Email", "SĐT", "Phòng Ban", "Vị trí", "Kinh nghiệm", "Chức danh gần nhất", "Công ty gần nhất", "Trạng thái", "Thao tác"].map(h => (
                      <th key={h} className="px-5 py-3.5 font-heading font-semibold text-[#005088] text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={15} className="text-center py-16 text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu từ Google Sheets...
                    </td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={15} className="text-center py-16 text-slate-400">Không có dữ liệu phù hợp</td></tr>
                  ) : paged.map((c, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-medium">{c.STT}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{c["Ngày"]}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#005088]">{c["Tên ứng viên"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">{c["Email"]}</td>
                      <td className="px-5 py-3.5 text-slate-600">{c["SĐT"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{c["Phòng Ban"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap max-w-[160px] truncate">{c["Vị trí"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{c["Kinh nghiệm"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap max-w-[140px] truncate">{c["Chức danh gần nhất"]}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap max-w-[140px] truncate">{c["Công ty gần nhất"]}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={c["Trạng thái"]} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500 transition-colors" title="Sửa">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(Number(c.STT))}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 transition-colors" title="Xóa">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} ứng viên</span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${p === page ? "bg-[#005088] text-white shadow" : "hover:bg-blue-50 text-slate-600"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && <AddCandidateModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
