"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { fetchCandidates, deleteCandidate, updateCandidate, type Candidate } from "@/lib/api";
import { Users, CheckCircle, XCircle, Clock, Search, RefreshCw, Pencil, Trash2, Eye } from "lucide-react";

export default function Vong1Page() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCandidates("Vòng 1");
            setCandidates(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = candidates.filter(c => {
        const name = String(c["Tên ứng viên"] || "").toLowerCase();
        const q = search.toLowerCase();
        return !q || name.includes(q);
    });

    const stats = {
        waiting: filtered.filter(c => !c["Kết quả V1"] || c["Kết quả V1"] === "Chờ đánh giá").length,
        passed: filtered.filter(c => c["Kết quả V1"] === "Đạt").length,
        failed: filtered.filter(c => c["Kết quả V1"] === "Không đạt").length,
    };

    const updateStatus = async (stt: number, val: string) => {
        await updateCandidate(stt, { "Kết quả V1": val }, "Vòng 1");
        load();
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <Header title="Vòng 1 – Phỏng vấn" subtitle="Quản lý ứng viên giai đoạn phỏng vấn bước 1" />

                <main className="p-8 space-y-6">
                    {/* KPI Mini */}
                    <div className="grid grid-cols-3 gap-5">
                        <div className="glass p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white"><Clock size={20} /></div>
                            <div><p className="text-slate-500 text-xs font-medium uppercase">Đang chờ PV</p><p className="text-2xl font-bold text-[#005088]">{stats.waiting}</p></div>
                        </div>
                        <div className="glass p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><CheckCircle size={20} /></div>
                            <div><p className="text-slate-500 text-xs font-medium uppercase">Đã PV - Đạt</p><p className="text-2xl font-bold text-[#005088]">{stats.passed}</p></div>
                        </div>
                        <div className="glass p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white"><XCircle size={20} /></div>
                            <div><p className="text-slate-500 text-xs font-medium uppercase">Không đạt</p><p className="text-2xl font-bold text-[#005088]">{stats.failed}</p></div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/40 flex items-center justify-between">
                            <div className="relative w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên ứng viên..." className="w-full pl-8 pr-4 py-2 text-sm bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
                            </div>
                            <button onClick={load} className="text-slate-500 hover:text-[#005088]"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-blue-50/50 text-left">
                                        {["STT", "Ngày vào V1", "Tên ứng viên", "SĐT", "Phòng Ban", "Vị trí", "Kinh nghiệm", "Người đánh giá", "Kết quả V1", "Thao tác"].map(h => (
                                            <th key={h} className="px-5 py-3 font-heading font-semibold text-[#005088] text-xs uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={10} className="py-12 text-center text-slate-400">Đang tải...</td></tr>
                                    ) : filtered.map((c, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-white/40">
                                            <td className="px-5 py-3 text-slate-500">{c.STT}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["Ngày"] || "–"}</td>
                                            <td className="px-5 py-3 font-semibold text-[#005088]">{c["Tên ứng viên"]}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["SĐT"]}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["Phòng Ban"]}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["Vị trí"]}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["Kinh nghiệm"]}</td>
                                            <td className="px-5 py-3 text-slate-600">{c["Người đánh giá"]}</td>
                                            <td className="px-5 py-3">
                                                <select
                                                    value={String(c["Kết quả V1"] || "Chờ đánh giá")}
                                                    onChange={(e) => updateStatus(Number(c.STT), e.target.value)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer
                            ${c["Kết quả V1"] === "Đạt" ? "badge-pass" : c["Kết quả V1"] === "Không đạt" ? "badge-fail" : "badge-wait"}`}
                                                >
                                                    <option value="Chờ đánh giá">⏳ Chờ</option>
                                                    <option value="Đạt">✅ Đạt</option>
                                                    <option value="Không đạt">❌ Loại</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <button className="hover:text-blue-500"><Eye size={14} /></button>
                                                    <button className="hover:text-blue-500"><Pencil size={14} /></button>
                                                </div>
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
