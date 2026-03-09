"use client";

import { Bell } from "lucide-react";

interface Props { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: Props) {
    return (
        <header className="glass sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-white/40">
            <div>
                <h1 className="font-heading font-bold text-[#005088] text-lg">{title}</h1>
                {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-xl hover:bg-blue-50 transition-colors text-slate-500 hover:text-[#005088]">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#005088] to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow">
                    HR
                </div>
            </div>
        </header>
    );
}
