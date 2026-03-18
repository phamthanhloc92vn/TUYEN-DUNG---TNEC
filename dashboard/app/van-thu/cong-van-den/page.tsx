"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { fetchCongVan, type CongVan } from "@/lib/api";
import { RefreshCw, Search, MailOpen } from "lucide-react";

export default function CongVanDenPage() {
    const [rows, setRows] = useState<CongVan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCongVan("Công văn đến");
            setRows(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = rows.filter(r => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
            String(r["Số văn bản"] || "").toLowerCase().includes(q) ||
            String(r["Tóm nội dung chính"] || "").toLowerCase().includes(q) ||
            String(r["Đơn vị gửi đến"] || "").toLowerCase().includes(q) ||
            String(r["Người nhận"] || "").toLowerCase().includes(q)
        );
    });

    const COLS = ["STT", "Ngày/Tháng", "Số văn bản", "Ngày văn bản", "Tóm nội dung chính", "Đơn vị gửi đến", "Người nhận", "Bản Scan", "Bản gốc"];

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <Header title="Công Văn Đến" subtitle="Danh sách văn bản đến – Trung Nam E&C" />
                <main className="p-8 space-y-6">
                    <div className="glass rounded-2xl overflow-hidden shadow-xl border border-white/20">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-white/40 flex items-center justify-between bg-blue-50/20">
                            <div className="flex items-center gap-2 text-[#005088] font-semibold text-sm">
                                <MailOpen size={16} />
                                <span>{filtered.length} công văn đến</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Tìm số VB, nội dung, đơn vị..."
                                        className="pl-8 pr-4 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-400/20" />
                                </div>
                                <button onClick={load}
                                    className="flex items-center gap-2 text-sm font-semibold text-[#005088] glass px-4 py-2 rounded-xl transition-all">
                                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#005088] text-white">
                                    <tr>
                                        {COLS.map(h => (
                                            <th key={h} className="px-4 py-3.5 font-heading font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={COLS.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw size={24} className="animate-spin text-blue-500" />
                                                <p className="text-slate-400 italic">Đang tải dữ liệu từ Google Sheets...</p>
                                            </div>
                                        </td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={COLS.length} className="py-20 text-center text-slate-400">
                                            {rows.length === 0 ? "Chưa có dữ liệu công văn đến." : "Không tìm thấy kết quả phù hợp."}
                                        </td></tr>
                                    ) : filtered.map((r, i) => (
                                        <tr key={i} className={`border-b border-slate-100 transition-colors ${i % 2 === 0 ? "bg-white/40" : "bg-blue-50/10"} hover:bg-blue-100/20`}>
                                            <td className="px-4 py-3.5 text-slate-500 font-mono">{r.STT}</td>
                                            <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{r["Ngày/Tháng"]}</td>
                                            <td className="px-4 py-3.5 font-semibold text-[#005088] whitespace-nowrap">{r["Số văn bản"]}</td>
                                            <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{r["Ngày văn bản"]}</td>
                                            <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={String(r["Tóm nội dung chính"] || "")}>{r["Tóm nội dung chính"]}</td>
                                            <td className="px-4 py-3.5 text-slate-500 max-w-[160px] truncate whitespace-nowrap">{r["Đơn vị gửi đến"]}</td>
                                            <td className="px-4 py-3.5 text-slate-600 max-w-[140px] truncate whitespace-nowrap">{r["Người nhận"]}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                {r["Bản Scan"] ? <span className="text-emerald-600 font-semibold text-xs">✓</span> : <span className="text-slate-300 text-xs">–</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {r["Bản gốc"] ? <span className="text-emerald-600 font-semibold text-xs">✓</span> : <span className="text-slate-300 text-xs">–</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
