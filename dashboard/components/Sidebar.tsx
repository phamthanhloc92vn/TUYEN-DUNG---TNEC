"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard, Building2, Settings, ChevronDown, ChevronRight,
    List, Users, Briefcase, Wrench, FolderKanban,
    ClipboardList, Package, ShieldAlert, UserCheck,
    UserCog, Calculator, Megaphone, FileText, MailOpen, Send
} from "lucide-react";

// ─── 9 Phòng Ban ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
    {
        id: "hanh-chinh-nhan-su",
        label: "Hành Chính Nhân Sự",
        icon: UserCheck,
        hasData: true,
        // Sub-sections trong phòng HCNS
        sections: [
            {
                id: "tuyen-dung",
                label: "Tuyển Dụng",
                icon: Megaphone,
                children: [
                    { label: "Tổng Hợp", href: "/tong-hop", icon: List },
                    { label: "Vòng 1", href: "/vong-1", icon: Users },
                    { label: "Vòng 2", href: "/vong-2", icon: Users },
                    { label: "Thử Việc", href: "/thu-viec", icon: Briefcase },
                ],
            },
            {
                id: "van-thu",
                label: "Văn Thư",
                icon: FileText,
                children: [
                    { label: "Tổng Quan", href: "/van-thu", icon: FileText },
                    { label: "Công Văn Đến", href: "/van-thu/cong-van-den", icon: MailOpen },
                    { label: "Công Văn Đi 1", href: "/van-thu/cong-van-di-1", icon: Send },
                    { label: "Công Văn Đi 2", href: "/van-thu/cong-van-di-2", icon: Send },
                    { label: "Công Văn HĐQT", href: "/van-thu/cong-van-hdqt", icon: Send },
                ],
            },
        ],
        // Tương lai: C&B, Hành Chính...
    },
    { id: "ky-thuat", label: "Kỹ Thuật", icon: Wrench },
    { id: "du-an", label: "Dự Án", icon: FolderKanban },
    { id: "ke-hoach", label: "Kế Hoạch", icon: ClipboardList },
    { id: "vat-tu-thiet-bi", label: "Vật Tư Thiết Bị", icon: Package },
    { id: "atld", label: "ATLĐ", icon: ShieldAlert },
    { id: "qlcc", label: "QLCC", icon: Building2 },
    { id: "tro-ly", label: "Trợ Lý", icon: UserCog },
    { id: "ke-toan", label: "Kế Toán", icon: Calculator },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [openDept, setOpenDept] = useState<string | null>("hanh-chinh-nhan-su");
    const [openSection, setOpenSection] = useState<string | null>("tuyen-dung");

    const recruitmentPaths = ["/tong-hop", "/vong-1", "/vong-2", "/thu-viec"];
    const vanThuPaths = ["/van-thu"];
    const isHCNSActive = [...recruitmentPaths, ...vanThuPaths].some(p => pathname.startsWith(p));
    const isRecruitActive = recruitmentPaths.some(p => pathname.startsWith(p));
    const isVanThuActive = vanThuPaths.some(p => pathname.startsWith(p));

    return (
        <aside className="glass-dark w-60 min-h-screen flex flex-col fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-400 flex items-center justify-center font-heading font-bold text-[#005088] text-sm shadow-lg">
                        TR
                    </div>
                    <div>
                        <p className="text-white font-heading font-bold text-sm leading-tight">TNEC</p>
                        <p className="text-cyan-300 text-xs">HR System V2</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {/* Dashboard */}
                <Link href="/"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
            ${pathname === "/" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </Link>

                {/* Phòng Ban */}
                <Link href="/phong-ban"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
            ${pathname === "/phong-ban" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                    <Building2 size={16} />
                    <span>Phòng Ban</span>
                </Link>

                {/* Divider */}
                <div className="pt-2 pb-1 px-3">
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                        Phòng Ban
                    </p>
                </div>

                {/* Departments */}
                {DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    const isOpen = openDept === dept.id;

                    if (dept.hasData && dept.sections) {
                        return (
                            <div key={dept.id}>
                                {/* Level 1: Phòng HCNS */}
                                <button
                                    onClick={() => setOpenDept(isOpen ? null : dept.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold
                    ${isHCNSActive ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "text-white hover:bg-white/10"}`}>
                                    <Icon size={16} />
                                    <span className="flex-1 text-left">{dept.label}</span>
                                    {isOpen ? <ChevronDown size={13} className="opacity-60" /> : <ChevronRight size={13} className="opacity-60" />}
                                </button>

                                {/* Level 2: Sub-sections (Tuyển Dụng, C&B, ...) */}
                                {isOpen && (
                                    <div className="ml-3 mt-1 space-y-0.5 border-l border-cyan-400/20 pl-3">
                                        {dept.sections.map((section) => {
                                            const SIcon = section.icon;
                                            const isSectionOpen = openSection === section.id;
                                            return (
                                                <div key={section.id}>
                                                    <button
                                                        onClick={() => setOpenSection(isSectionOpen ? null : section.id)}
                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-xs font-semibold
                              ${(isRecruitActive && section.id === "tuyen-dung") || (isVanThuActive && section.id === "van-thu")
                                                                ? "text-cyan-300 bg-cyan-400/10"
                                                                : "text-slate-200 hover:text-white hover:bg-white/8"}`}>
                                                        <SIcon size={13} />
                                                        <span className="flex-1 text-left">{section.label}</span>
                                                        {isSectionOpen ? <ChevronDown size={11} className="opacity-50" /> : <ChevronRight size={11} className="opacity-50" />}
                                                    </button>

                                                    {/* Level 3: Pages */}
                                                    {isSectionOpen && section.children && (
                                                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5">
                                                            {section.children.map(child => {
                                                                const active = pathname === child.href || pathname.startsWith(child.href);
                                                                const CIcon = child.icon;
                                                                return (
                                                                    <Link key={child.href} href={child.href}
                                                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium
                                      ${active ? "bg-cyan-400/15 text-cyan-300" : "text-slate-400 hover:text-white hover:bg-white/8"}`}>
                                                                        <CIcon size={12} />
                                                                        <span>{child.label}</span>
                                                                        {active && <ChevronRight size={10} className="ml-auto opacity-50" />}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Placeholder departments (no data yet)
                    return (
                        <div key={dept.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs cursor-not-allowed">
                            <Icon size={14} className="text-slate-300" />
                            <span className="flex-1 text-white font-bold tracking-wide">{dept.label}</span>
                            <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">Sắp kết nối</span>
                        </div>
                    );
                })}

                {/* Cài Đặt */}
                <div className="pt-2">
                    <Link href="/cai-dat"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
              ${pathname === "/cai-dat" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                        <Settings size={16} />
                        <span>Cài Đặt</span>
                    </Link>
                </div>
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">HR</div>
                    <div>
                        <p className="text-white text-xs font-medium">HR Admin</p>
                        <p className="text-slate-400 text-[10px]">Quản trị viên</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
