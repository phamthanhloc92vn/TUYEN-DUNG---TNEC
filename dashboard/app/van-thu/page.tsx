"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { fetchVanThuStats, type VanThuStats } from "@/lib/api";
import { FileText, MailOpen, Send, RefreshCw, TrendingUp, FileCheck2 } from "lucide-react";
import Link from "next/link";

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, href }: {
    icon: React.ElementType; label: string; value: number | string;
    color: string; href?: string;
}) {
    const inner = (
        <div className={`glass rounded-2xl p-5 flex flex-col gap-3 transition-all ${href ? "hover:scale-[1.02] cursor-pointer" : ""}`}>
            <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-medium">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} className="text-white" />
                </div>
            </div>
            <div className="font-heading font-bold text-3xl text-[#005088]">{value}</div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <TrendingUp size={12} /> công văn
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VanThuPage() {
    const [stats, setStats] = useState<VanThuStats | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const s = await fetchVanThuStats();
            setStats(s);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const cards = [
        { icon: FileCheck2, label: "Tổng Công Văn", value: stats?.tong_cong_van ?? "–", color: "bg-[#005088]" },
        { icon: MailOpen, label: "Công Văn Đến", value: stats?.cong_van_den ?? "–", color: "bg-emerald-500", href: "/van-thu/cong-van-den" },
        { icon: Send, label: "Công Văn Đi 1", value: stats?.cong_van_di_1 ?? "–", color: "bg-violet-500", href: "/van-thu/cong-van-di-1" },
        { icon: Send, label: "Công Văn Đi 2", value: stats?.cong_van_di_2 ?? "–", color: "bg-cyan-500", href: "/van-thu/cong-van-di-2" },
        { icon: FileText, label: "Công Văn HĐQT", value: stats?.cong_van_hdqt ?? "–", color: "bg-rose-500", href: "/van-thu/cong-van-hdqt" },
    ];

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <Header title="Văn Thư – Công Văn" subtitle="Quản lý công văn đến và đi – Trung Nam E&C" />

                <main className="flex-1 p-8 space-y-8">
                    {/* Refresh */}
                    <div className="flex justify-end">
                        <button onClick={load} disabled={loading}
                            className="flex items-center gap-2 text-sm text-[#005088] hover:text-blue-600 glass px-4 py-2 rounded-xl transition-all active:scale-95">
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            {loading ? "Đang tải..." : "Làm mới"}
                        </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-5 gap-5">
                        {cards.map((c) => (
                            <KpiCard key={c.label} icon={c.icon} label={c.label}
                                value={c.value} color={c.color} href={c.href} />
                        ))}
                    </div>

                    {/* Quick links */}
                    <div className="glass rounded-2xl p-8 text-center space-y-3">
                        <FileText size={40} className="mx-auto text-[#005088] opacity-40" />
                        <p className="text-slate-500 text-sm">
                            Chọn loại công văn từ menu bên trái hoặc click vào thẻ KPI để xem danh sách chi tiết.
                        </p>
                        <div className="flex justify-center gap-3 flex-wrap pt-2">
                            {[
                                { href: "/van-thu/cong-van-den", label: "→ Công Văn Đến" },
                                { href: "/van-thu/cong-van-di-1", label: "→ Công Văn Đi 1" },
                                { href: "/van-thu/cong-van-di-2", label: "→ Công Văn Đi 2" },
                                { href: "/van-thu/cong-van-hdqt", label: "→ Công Văn HĐQT" },
                            ].map((l) => (
                                <Link key={l.href} href={l.href}
                                    className="text-sm text-[#005088] font-medium glass px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
