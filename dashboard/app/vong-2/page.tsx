"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { fetchCandidates, updateCandidate, type Candidate } from "@/lib/api";
import { Users, CheckCircle, Clock, Search, RefreshCw, Eye } from "lucide-react";

export default function Vong2Page() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCandidates("Vòng 2");
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
        return !search || name.includes(search.toLowerCase());
    });

    const stats = {
        waiting: filtered.filter(c => !c["Kết quả V2"] || c["Kết quả V2"] === "Chờ đánh giá").length,
        passed: filtered.filter(c => c["Kết quả V2"] === "Đạt").length,
    };

    const updateStatus = async (stt: number, val: string) => {
        await updateCandidate(stt, { "Kết quả V2": val }, "Vòng 2");
        load();
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <Header title="Vòng 2 – Phỏng vấn Master" subtitle="Giai đoạn phỏng vấn chuyên sâu cuối cùng" />

                <main className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-5 w-1/2">
                        <div className="glass p-5 rounded-2xl flex items-center gap-4 border-l-4 border-blue-500">
                            <Clock size={24} className="text-blue-500" />
                            <div><p className="text-slate-500 text-xs font-bold">CHỜ PHỎNG VẤN</p><p className="text-3xl font-bold text-[#005088]">{stats.waiting}</p></div>
                        </div>
                        <div className="glass p-5 rounded-2xl flex items-center gap-4 border-l-4 border-emerald-500">
                            <CheckCircle size={24} className="text-emerald-500" />
                            <div><p className="text-slate-500 text-xs font-bold">VƯỢT QUA V2</p><p className="text-3xl font-bold text-[#005088]">{stats.passed}</p></div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/40 flex items-center justify-between">
                            <div className="relative w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ứng viên..." className="w-full pl-8 pr-4 py-2 text-sm bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
                            </div>
                            <button onClick={load}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
                        </div>

                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#005088]/5 text-[#005088] font-bold">
                                <tr>
                                    <th className="px-5 py-4">STT</th>
                                    <th className="px-5 py-4">Tên ứng viên</th>
                                    <th className="px-5 py-4">SĐT</th>
                                    <th className="px-5 py-4">Phòng Ban</th>
                                    <th className="px-5 py-4">Kinh nghiệm</th>
                                    <th className="px-5 py-4">Kết quả V1</th>
                                    <th className="px-5 py-4 bg-blue-100/50">Kết quả V2</th>
                                    <th className="px-5 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={8} className="py-10 text-center text-slate-400 italic">Đang tải...</td></tr> : filtered.map((c, i) => (
                                    <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/20">
                                        <td className="px-5 py-4 text-slate-400">{c.STT}</td>
                                        <td className="px-5 py-4 font-bold text-[#005088]">{c["Tên ứng viên"]}</td>
                                        <td className="px-5 py-4 text-slate-600">{c["SĐT"]}</td>
                                        <td className="px-5 py-4 text-slate-600 font-medium">{c["Phòng Ban"]}</td>
                                        <td className="px-5 py-4 text-slate-600">{c["Kinh nghiệm"]}</td>
                                        <td className="px-5 py-4"><span className="badge-dat px-2 py-0.5 rounded text-[10px] font-bold">✓ ĐẠT V1</span></td>
                                        <td className="px-5 py-4 bg-blue-50/10">
                                            <select value={String(c["Kết quả V2"] || "Chờ đánh giá")} onChange={e => updateStatus(Number(c.STT), e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-lg border-none cursor-pointer ${c["Kết quả V2"] === "Đạt" ? "badge-pass" : "badge-wait"}`}>
                                                <option value="Chờ đánh giá">Chờ đánh giá</option>
                                                <option value="Đạt">Đạt V2 (Sang Thử Việc)</option>
                                                <option value="Không đạt">Không đạt</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-center"><button className="text-slate-300 hover:text-blue-500"><Eye size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
