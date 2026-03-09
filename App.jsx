import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  ArrowUpDown, 
  Loader2, 
  X, 
  Briefcase,
  User,
  Zap,
  Award
} from 'lucide-react';

// --- MOCK DATA ---
const defaultJD = `Vị trí: Senior Frontend Developer (React)
Yêu cầu công việc:
- Ít nhất 3 năm kinh nghiệm làm việc với React.js và hệ sinh thái (Redux, Context API, React Router).
- Thành thạo TypeScript, HTML5, CSS3.
- Ưu tiên ứng viên có kinh nghiệm với Tailwind CSS, Next.js.
- Có khả năng thiết kế UI/UX cơ bản, hiểu biết về Responsive Design.
- Kỹ năng giải quyết vấn đề tốt, tư duy logic, làm việc nhóm hiệu quả.`;

const mockCandidates = [
  {
    id: 1,
    name: "Lê Thành Đạt",
    role: "Senior Frontend Developer",
    score: 95,
    matchedSkills: ["React", "TypeScript", "Tailwind CSS", "Redux", "HTML/CSS"],
    missingSkills: ["Next.js"],
    summary: "Ứng viên xuất sắc với nền tảng kỹ thuật vững chắc và kinh nghiệm sâu rộng về hệ sinh thái React.",
    fullAnalysis: "Lê Thành Đạt có 4.5 năm kinh nghiệm chuyên sâu về UI/UX và frontend architecture với React. Ứng viên này cực kỳ phù hợp với các tiêu chí chính của JD, đặc biệt là sự thành thạo TypeScript và Tailwind CSS. Điểm yếu duy nhất là chưa có dự án thực tế quy mô lớn sử dụng Next.js, nhưng nền tảng React vững chắc sẽ giúp việc học hỏi nhanh chóng."
  },
  {
    id: 2,
    name: "Phạm Minh Tâm",
    role: "Frontend Engineer",
    score: 82,
    matchedSkills: ["React", "HTML/CSS", "Next.js"],
    missingSkills: ["TypeScript", "Tailwind CSS"],
    summary: "Ứng viên giỏi, mạnh về Next.js và React nhưng cần đánh giá thêm về TypeScript.",
    fullAnalysis: "Phạm Minh Tâm đã làm việc với React 3 năm và có kinh nghiệm thực tế về Next.js. Tuy nhiên, các kỹ năng về TypeScript và Tailwind CSS chưa được thể hiện rõ trong CV. Ứng viên này rất có tiềm năng và sẵn sàng làm việc ngay, nhưng có thể cần một chút thời gian để làm quen với codebase nếu dùng thuần TypeScript."
  },
  {
    id: 3,
    name: "Trần Thị Mai",
    role: "Web Developer",
    score: 65,
    matchedSkills: ["HTML/CSS", "JavaScript", "React (Cơ bản)"],
    missingSkills: ["TypeScript", "Redux", "Tailwind CSS", "Next.js"],
    summary: "Ứng viên tiềm năng ở cấp độ Junior/Mid, thiếu hụt một số công nghệ cốt lõi.",
    fullAnalysis: "Trần Thị Mai có nền tảng web cơ bản tốt và đã tham gia một số dự án React nhỏ. Tuy nhiên, kinh nghiệm xử lý state management phức tạp (Redux) và TypeScript chưa đáp ứng yêu cầu Senior của JD. Phù hợp hơn nếu công ty có nhu cầu tuyển dụng vị trí cấp thấp hơn để đào tạo."
  },
  {
    id: 4,
    name: "Nguyễn Hoàng Huy",
    role: "Backend Developer",
    score: 25,
    matchedSkills: ["Tư duy logic", "Làm việc nhóm"],
    missingSkills: ["React", "TypeScript", "HTML/CSS", "Tailwind CSS", "Next.js"],
    summary: "Ứng viên không phù hợp do định hướng Backend và thiếu hụt hoàn toàn kỹ năng Frontend.",
    fullAnalysis: "Nguyễn Hoàng Huy có CV thiên hoàn toàn về Backend (Node.js, Python). Không có kinh nghiệm làm việc với React.js hay kiến thức về UI/UX như yêu cầu. Hệ thống đánh giá đây là hồ sơ nộp nhầm vị trí."
  }
];

// --- MAIN COMPONENT ---
export default function App() {
  const [jdText, setJdText] = useState(defaultJD);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  // UI States
  const [sortBy, setSortBy] = useState('score_desc');
  const [expandedId, setExpandedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message) => {
    setToastMessage(message);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      showToast(`Đã tải lên ${newFiles.length} CV thành công!`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      showToast(`Đã tải lên ${newFiles.length} CV thành công!`);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Simulate AI Analysis
  const analyzeCVs = () => {
    if (!jdText.trim()) {
      showToast('Vui lòng nhập Job Description trước khi phân tích!');
      return;
    }
    if (uploadedFiles.length === 0) {
      showToast('Vui lòng tải lên ít nhất 1 CV (PDF/DOCX) để phân tích!');
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setExpandedId(null);

    // Simulate Network/AI delay
    setTimeout(() => {
      setIsAnalyzing(false);
      // In a real app, this would be data returned from your backend AI service
      setResults([...mockCandidates]);
      showToast('Phân tích AI hoàn tất!');
    }, 3000);
  };

  // Sorting
  const getSortedResults = () => {
    if (!results) return [];
    const sorted = [...results];
    switch (sortBy) {
      case 'score_desc': return sorted.sort((a, b) => b.score - a.score);
      case 'score_asc':  return sorted.sort((a, b) => a.score - b.score);
      case 'name_asc':   return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default: return sorted;
    }
  };

  // Helpers
  const getScoreStyle = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' };
    if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', bar: 'bg-yellow-500' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-200" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-indigo-600" />
              AI CV Screening ATS
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Đánh giá và Chấm điểm Ứng viên tự động với Trí tuệ Nhân tạo</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <User className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-slate-700">HR Admin Panel</span>
          </div>
        </header>

        {/* TOP SECTION: JD & Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card: Job Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-500" />
                Mô tả Công việc (JD)
              </h2>
            </div>
            <textarea
              className="w-full h-48 md:h-64 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none transition-all text-sm leading-relaxed"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Dán nội dung Job Description vào đây..."
            />
          </div>

          {/* Card: CV Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-shadow hover:shadow-md flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-indigo-500" />
              Tải lên CV (PDF, DOCX)
            </h2>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
              <p className="text-slate-600 font-medium mb-2">Kéo thả file CV vào khu vực này</p>
              <p className="text-sm text-slate-400 mb-6">hoặc</p>
              
              <label className="cursor-pointer bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm">
                Chọn file từ máy
                <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-600 mb-2">Đã chọn ({uploadedFiles.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full border border-indigo-100 group">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{file}</span>
                      <button onClick={() => removeFile(idx)} className="text-indigo-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex justify-center py-6">
          <button
            onClick={analyzeCVs}
            disabled={isAnalyzing}
            className={`flex items-center gap-3 px-10 py-4 rounded-full text-lg font-bold text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
              isAnalyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-800 hover:shadow-indigo-500/30'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                AI Đang Phân Tích & Chấm Điểm...
              </>
            ) : (
              <>
                <Award className="w-6 h-6" />
                Phân tích {uploadedFiles.length > 0 ? uploadedFiles.length : ''} CV ngay
              </>
            )}
          </button>
        </div>

        {/* LOADING STATE OVERLAY */}
        {isAnalyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Animated scanning line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
            
            <div className="w-24 h-24 mb-6 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Trí tuệ nhân tạo đang làm việc...</h3>
            <p className="text-slate-500 max-w-md">Đang đọc, trích xuất dữ liệu, và đối chiếu kinh nghiệm của ứng viên với Job Description.</p>
          </div>
        )}

        {/* RESULTS DASHBOARD */}
        {results && !isAnalyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500" />
                Kết quả Xếp hạng Ứng viên
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="font-medium mr-1">Sắp xếp:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-semibold text-indigo-700 outline-none"
                  >
                    <option value="score_desc">Điểm AI (Cao - Thấp)</option>
                    <option value="score_asc">Điểm AI (Thấp - Cao)</option>
                    <option value="name_asc">Tên (A - Z)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-0">
              {getSortedResults().map((candidate, idx) => {
                const style = getScoreStyle(candidate.score);
                const isExpanded = expandedId === candidate.id;

                return (
                  <div key={candidate.id} className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row items-start gap-6">
                        
                        {/* SCORE BUBBLE */}
                        <div className={`flex flex-col items-center justify-center w-24 h-24 shrink-0 rounded-2xl border-2 ${style.border} ${style.bg}`}>
                          <span className={`text-4xl font-extrabold tracking-tighter ${style.text}`}>{candidate.score}</span>
                          <span className={`text-xs font-bold uppercase mt-1 ${style.text} opacity-80`}>Match</span>
                        </div>

                        {/* INFO & MAIN BADGES */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-xl font-extrabold text-slate-900">{candidate.name}</h3>
                              <p className="text-slate-500 font-medium">{candidate.role}</p>
                            </div>
                            
                            {/* Tags (Mobile wrapped, Desktop inline) */}
                            <div className="flex flex-wrap items-center gap-2">
                              {candidate.score >= 80 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                  Top Candidate
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2 md:line-clamp-none">
                            <strong>AI Tóm tắt:</strong> {candidate.summary}
                          </p>

                          {/* SKILLS BADGES */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {candidate.matchedSkills.slice(0, 4).map(skill => (
                              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                {skill}
                              </span>
                            ))}
                            {candidate.missingSkills.slice(0, 2).map(skill => (
                              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="shrink-0 flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                          >
                            {isExpanded ? 'Thu gọn' : 'Chi tiết AI'}
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                      </div>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-500" />
                            Phân tích Chi tiết từ Trí tuệ Nhân tạo
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {candidate.fullAnalysis}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4" /> Kỹ năng đã khớp hoàn toàn
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {candidate.matchedSkills.map(skill => (
                                  <span key={skill} className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-semibold text-rose-700 mb-3 flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4" /> Kỹ năng còn thiếu / Cần kiểm tra thêm
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {candidate.missingSkills.map(skill => (
                                  <span key={skill} className="bg-rose-100 text-rose-800 text-xs px-3 py-1.5 rounded-lg font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
