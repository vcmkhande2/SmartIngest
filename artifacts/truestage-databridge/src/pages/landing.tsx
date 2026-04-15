import { Link } from "wouter";
import { ArrowRight, Cpu, ShieldCheck, Zap, Mail, FileStack, BarChart3, CheckCircle2, Database } from "lucide-react";

function ExlLogoLarge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="EXL">
      <text x="1" y="26" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="28" fill="#FF5A1F" letterSpacing="-1">EXL</text>
    </svg>
  );
}

const features = [
  {
    icon: Cpu,
    title: "AI Field Mapping",
    description: "GPT-powered analysis maps any source column to TruStage's canonical schema — with confidence scores and reasoning for every decision.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Data Quality Engine",
    description: "Configurable hard and soft rules validate every record. Hard errors reject rows outright; soft errors flag and proceed.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Automated Pipeline",
    description: "Upload a file and the entire pipeline fires automatically — mapping, DQ checks, processing, and report generation — no clicks required.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Mail,
    title: "Smart Error Reports",
    description: "AI drafts professional, ready-to-send rejection emails explaining exactly which records failed and why — per credit union.",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: FileStack,
    title: "Multi-Format Ingestion",
    description: "Native support for CSV, TSV, and JSON files. Drag and drop or click to upload — format is auto-detected.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: BarChart3,
    title: "Live Operations Dashboard",
    description: "Real-time visibility into acceptance rates, confidence scores, hard error counts, and credit union performance across all jobs.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
];

const stats = [
  { value: "23", label: "Canonical Fields" },
  { value: "10+", label: "DQ Rules Built-in" },
  { value: "~30s", label: "Avg. Pipeline Time" },
  { value: "95%+", label: "Avg. Mapping Confidence" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* Nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartIngest</span>
          <span className="hidden sm:block text-white/20 mx-1">|</span>
          <ExlLogoLarge className="hidden sm:block h-5 w-auto" />
        </div>
        <Link href="/dashboard">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Launch App <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 text-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-sky-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            Powered by EXL AI
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Credit Union Data
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              Onboarding, Automated.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartIngest replaces manual data mapping teams with an AI-powered pipeline — 
            smart ingestion, field mapping, quality enforcement, and error reporting in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95">
                Launch SmartIngest <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="text-slate-400 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/25 transition-colors text-base">
                View Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline flow */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">One Upload. Full Pipeline.</h2>
            <p className="text-slate-400 text-lg">Everything runs automatically — from raw file to clean data.</p>
          </div>

          <div className="relative flex flex-col md:flex-row items-stretch gap-0">
            {[
              { step: "01", label: "Upload", desc: "Drag & drop CSV, TSV, or JSON", icon: FileStack, color: "bg-indigo-500" },
              { step: "02", label: "AI Maps Fields", desc: "Headers matched to canonical schema", icon: Cpu, color: "bg-violet-500" },
              { step: "03", label: "DQ Validation", desc: "Every record checked against rules", icon: ShieldCheck, color: "bg-emerald-500" },
              { step: "04", label: "Report Generated", desc: "AI email drafted for credit union", icon: Mail, color: "bg-sky-500" },
            ].map((item, idx) => (
              <div key={item.step} className="flex-1 relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1px)] w-full h-px bg-gradient-to-r from-white/20 to-transparent z-10" />
                )}
                <div className="bg-slate-900 border border-white/8 rounded-xl p-5 mx-1 h-full">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-mono text-slate-500 mb-1">{item.step}</div>
                  <div className="font-bold text-white mb-1">{item.label}</div>
                  <div className="text-sm text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 px-6 md:px-12 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Built for TruStage Operations</h2>
            <p className="text-slate-400 text-lg">Every feature designed for the credit union data onboarding workflow.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className={`rounded-xl border p-5 ${f.bg}`}>
                <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's in the box */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-4">Everything You Need Out of the Box</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              SmartIngest ships with a fully seeded canonical schema, data quality rules, 
              and sample credit unions — ready for your first demo upload.
            </p>
            <ul className="space-y-3">
              {[
                "23-field canonical schema across Member, Contact, Account & Financial",
                "10 pre-built DQ rules — required fields, email/phone/ZIP formats, balance ranges",
                "5 credit unions pre-loaded with contacts",
                "Full email report generation with AI-written copy",
                "Dark-mode operations UI with live pipeline status",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-slate-500 mb-4">PIPELINE STATUS</div>
            {[
              { label: "midwest_federal_members.csv", status: "completed", pct: 100, color: "bg-emerald-500" },
              { label: "techworkers_cu_export.csv", status: "processing", pct: 68, color: "bg-indigo-500" },
              { label: "lakeside_community_data.tsv", status: "mapping", pct: 28, color: "bg-violet-500" },
            ].map((j) => (
              <div key={j.label} className="bg-slate-800/60 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">{j.label}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    j.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                    j.status === "processing" ? "bg-indigo-500/20 text-indigo-400" :
                    "bg-violet-500/20 text-violet-400"
                  }`}>{j.status}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${j.color} rounded-full transition-all`} style={{ width: `${j.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-20 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to Ingest?</h2>
          <p className="text-slate-400 mb-8 text-lg">Open the dashboard and upload your first file — the pipeline handles the rest.</p>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-95">
              Open SmartIngest <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>SmartIngest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Powered by</span>
          <ExlLogoLarge className="h-4 w-auto opacity-60" />
        </div>
      </footer>
    </div>
  );
}
