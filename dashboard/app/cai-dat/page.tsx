"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Settings, Database, ExternalLink, Info } from "lucide-react";

export default function CaiDatPage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <Header title="Cài Đặt" subtitle="Cấu hình hệ thống và kết nối dữ liệu" />
                <main className="flex-1 p-8 space-y-6">

                    {/* Thông tin hệ thống */}
                    <div className="glass rounded-2xl p-6 space-y-4">
                        <h2 className="font-heading font-semibold text-[#005088] flex items-center gap-2">
                            <Info size={18} /> Thông tin hệ thống
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-slate-400 text-xs uppercase mb-1">Phiên bản</p>
                                <p className="text-[#005088] font-semibold">HR Dashboard v2.0</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-slate-400 text-xs uppercase mb-1">Số phòng ban</p>
                                <p className="text-[#005088] font-semibold">9 Phòng</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-slate-400 text-xs uppercase mb-1">Phòng đã kết nối</p>
                                <p className="text-emerald-600 font-semibold">1 / 9 (Hành Chính Nhân Sự)</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-slate-400 text-xs uppercase mb-1">Trạng thái</p>
                                <p className="text-emerald-600 font-semibold">● Đang hoạt động</p>
                            </div>
                        </div>
                    </div>

                    {/* Kết nối dữ liệu */}
                    <div className="glass rounded-2xl p-6 space-y-4">
                        <h2 className="font-heading font-semibold text-[#005088] flex items-center gap-2">
                            <Database size={18} /> Kết nối Google Sheets
                        </h2>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div>
                                <p className="text-emerald-700 font-semibold text-sm">Kết nối thành công</p>
                                <p className="text-emerald-600 text-xs">Tuyển dụng – Phòng Hành Chính Nhân Sự đang cập nhật thời gian thực</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Các phòng ban khác sẽ được kết nối theo từng giai đoạn triển khai. Liên hệ quản trị viên để cấu hình thêm.
                        </p>
                    </div>

                    {/* Liên kết */}
                    <div className="glass rounded-2xl p-6 space-y-4">
                        <h2 className="font-heading font-semibold text-[#005088] flex items-center gap-2">
                            <Settings size={18} /> Liên kết nhanh
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="https://dashboard-tuyen-dung-tnec.vercel.app" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-[#005088]/5 hover:bg-[#005088]/10 border border-[#005088]/20 rounded-xl p-4 transition-all">
                                <ExternalLink size={16} className="text-[#005088]" />
                                <div>
                                    <p className="text-[#005088] font-semibold text-sm">Dashboard Online</p>
                                    <p className="text-slate-400 text-xs">dashboard-tuyen-dung-tnec.vercel.app</p>
                                </div>
                            </a>
                            <a href="https://docs.google.com" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-4 transition-all">
                                <Database size={16} className="text-emerald-600" />
                                <div>
                                    <p className="text-emerald-700 font-semibold text-sm">Google Sheets</p>
                                    <p className="text-slate-400 text-xs">Dữ liệu tuyển dụng HCNS</p>
                                </div>
                            </a>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
