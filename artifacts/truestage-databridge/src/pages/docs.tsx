import { Download as DownloadIcon, FileSpreadsheet } from "lucide-react";

const SPEC_FILE = `${import.meta.env.BASE_URL}TruStage_SmartIngest_DataSpec.xlsx`;

export default function Docs() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground mt-1">
            SmartIngest system architecture, data flow reference, and submission requirements.
          </p>
        </div>
        <a
          href={SPEC_FILE}
          download="TruStage_SmartIngest_DataSpec.xlsx"
          className="inline-flex items-center gap-2 shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          Download Data Submission Spec
          <span className="text-[10px] font-mono opacity-60">.xlsx</span>
        </a>
      </div>

      {/* Spec highlight banner */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 text-emerald-500 mt-0.5">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Credit Union Data Submission Requirements</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share the Excel spec with your credit union partners. It contains all 23 canonical field definitions,
            format rules, data quality validation requirements, a correctly formatted sample record, and a
            full FAQ — everything they need to prepare a compliant data file.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Cover page", "23 canonical fields", "10 DQ rules", "Sample record", "12-question FAQ"].map(tag => (
              <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{tag}</span>
            ))}
          </div>
        </div>
        <a
          href={SPEC_FILE}
          download="TruStage_SmartIngest_DataSpec.xlsx"
          className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Download .xlsx
        </a>
      </div>

      {/* System Architecture Diagram */}
      <section>
        <h2 className="text-lg font-semibold mb-4">System Architecture</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ArchitectureDiagram />
        </div>
      </section>

      {/* Pipeline Stages */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Ingestion Pipeline Stages</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 rounded-xl border border-border overflow-hidden">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={stage.title}
              className={`p-5 ${i < PIPELINE_STAGES.length - 1 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-3 ${stage.color}`}>
                {i + 1}
              </div>
              <h3 className="font-semibold text-sm mb-1">{stage.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{stage.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {stage.tags.map(t => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stack Reference */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STACK_SECTIONS.map(section => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div key={item.name} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Model */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Data Model</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3">
            {DATA_TABLES.map((table, i) => (
              <div
                key={table.name}
                className={`p-5 ${i % 3 !== 2 ? "border-r border-border" : ""} ${i < 3 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-mono text-xs font-semibold text-foreground">{table.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{table.description}</p>
                <div className="space-y-0.5">
                  {table.columns.map(col => (
                    <div key={col} className="text-[10px] font-mono text-muted-foreground/70">{col}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="bg-slate-950 p-8 select-none">
      {/* Top layer: Credit Unions → Platform */}
      <div className="flex flex-col gap-6">

        {/* Row 1: External data sources */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 text-center">External — Credit Unions</div>
          <div className="flex justify-center gap-4">
            {["CSV", "JSON", "TSV"].map(fmt => (
              <div key={fmt} className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-10 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-slate-300">.{fmt.toLowerCase()}</span>
                </div>
                <span className="text-[9px] text-slate-500">{fmt} File</span>
              </div>
            ))}
          </div>
          {/* Arrow down */}
          <div className="flex justify-center mt-3">
            <ArrowDown label="HTTP Upload" />
          </div>
        </div>

        {/* Row 2: Platform layer */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 text-center">SmartIngest Platform</div>
          <div className="flex items-start justify-center gap-4">
            {/* Frontend */}
            <ServiceBox
              title="Frontend"
              subtitle="React + Vite"
              color="indigo"
              badges={["wouter", "shadcn/ui", "react-query"]}
            />

            <div className="flex flex-col items-center self-center gap-0.5 mx-1">
              <ArrowHoriz />
            </div>

            {/* API Server */}
            <ServiceBox
              title="API Server"
              subtitle="Express 5 · Node 24"
              color="violet"
              badges={["REST", "Drizzle ORM", "Zod"]}
            />

            <div className="flex flex-col items-center self-center gap-0.5 mx-1">
              <ArrowHoriz />
            </div>

            {/* Database */}
            <ServiceBox
              title="PostgreSQL"
              subtitle="Database · v16"
              color="emerald"
              badges={["6 tables", "Drizzle schema"]}
            />
          </div>

          {/* Arrow down from API Server */}
          <div className="flex justify-center mt-3" style={{ marginLeft: "0" }}>
            <ArrowDown label="OpenAI API calls" />
          </div>
        </div>

        {/* Row 3: AI Service */}
        <div className="flex justify-center">
          <ServiceBox
            title="OpenAI GPT"
            subtitle="AI Integrations Proxy"
            color="orange"
            badges={["Field Mapping", "Email Generation"]}
            wide
          />
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-slate-700 my-2 relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-950 px-3 text-[10px] text-slate-500 uppercase tracking-widest">
            Ingestion Pipeline
          </span>
        </div>

        {/* Row 4: Pipeline stages */}
        <div className="flex items-center justify-center gap-0">
          <PipelineStage num={1} label="File Upload" sub="Parse & store raw content" color="blue" />
          <PipelineArrow />
          <PipelineStage num={2} label="AI Mapping" sub="GPT maps source → canonical fields" color="violet" />
          <PipelineArrow />
          <PipelineStage num={3} label="DQ Rules" sub="Soft & hard error validation" color="amber" />
          <PipelineArrow />
          <PipelineStage num={4} label="Email Report" sub="AI drafts rejection email" color="rose" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2">
          {[
            { color: "bg-indigo-500", label: "Frontend" },
            { color: "bg-violet-500", label: "API / AI" },
            { color: "bg-emerald-500", label: "Database" },
            { color: "bg-orange-500", label: "External AI" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[10px] text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceBox({
  title,
  subtitle,
  color,
  badges,
  wide = false,
}: {
  title: string;
  subtitle: string;
  color: "indigo" | "violet" | "emerald" | "orange";
  badges: string[];
  wide?: boolean;
}) {
  const colorMap = {
    indigo: { border: "border-indigo-500/40", bg: "bg-indigo-500/10", dot: "bg-indigo-400", badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
    violet: { border: "border-violet-500/40", bg: "bg-violet-500/10", dot: "bg-violet-400", badge: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
    emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    orange: { border: "border-orange-500/40", bg: "bg-orange-500/10", dot: "bg-orange-400", badge: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  }[color];

  return (
    <div className={`rounded-lg border ${colorMap.border} ${colorMap.bg} p-3 ${wide ? "w-64" : "w-40"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${colorMap.dot}`} />
        <span className="text-xs font-semibold text-slate-200">{title}</span>
      </div>
      <p className="text-[10px] text-slate-400 mb-2">{subtitle}</p>
      <div className="flex flex-wrap gap-1">
        {badges.map(b => (
          <span key={b} className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${colorMap.badge}`}>{b}</span>
        ))}
      </div>
    </div>
  );
}

function PipelineStage({ num, label, sub, color }: { num: number; label: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/20 border-blue-500/40 text-blue-400",
    violet: "bg-violet-500/20 border-violet-500/40 text-violet-400",
    amber: "bg-amber-500/20 border-amber-500/40 text-amber-400",
    rose: "bg-rose-500/20 border-rose-500/40 text-rose-400",
  };
  return (
    <div className={`rounded-lg border px-3 py-3 w-[108px] text-center ${colorMap[color]}`}>
      <div className="text-[10px] font-bold opacity-60 mb-1">Stage {num}</div>
      <div className="text-xs font-semibold text-slate-200 leading-tight">{label}</div>
      <div className="text-[9px] text-slate-400 mt-1 leading-tight">{sub}</div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex items-center mx-0.5">
      <div className="w-4 h-px bg-slate-600" />
      <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
        <path d="M0 0L6 4L0 8V0Z" fill="#4B5563" />
      </svg>
    </div>
  );
}

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-px h-5 bg-slate-600" />
      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
        <path d="M0 0H8L4 6L0 0Z" fill="#4B5563" />
      </svg>
      <span className="text-[9px] text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

function ArrowHoriz() {
  return (
    <div className="flex items-center">
      <div className="w-5 h-px bg-slate-600" />
      <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
        <path d="M0 0L6 4L0 8V0Z" fill="#4B5563" />
      </svg>
    </div>
  );
}

const PIPELINE_STAGES = [
  {
    title: "File Upload",
    description: "Credit union uploads a member data file (CSV, JSON, or TSV). The platform parses headers and raw rows, storing them against the ingestion job.",
    color: "bg-blue-500/15 text-blue-400",
    tags: ["CSV", "JSON", "TSV", "multipart/form-data"],
  },
  {
    title: "AI Field Mapping",
    description: "GPT analyzes source column names and sample values, then maps each to a TruStage canonical field with a confidence score and reasoning.",
    color: "bg-violet-500/15 text-violet-400",
    tags: ["OpenAI GPT", "confidence score", "canonical schema"],
  },
  {
    title: "DQ Rule Engine",
    description: "Every record is evaluated against active data quality rules. Soft errors flag-and-continue; hard errors reject the record. Counts are tallied per job.",
    color: "bg-amber-500/15 text-amber-400",
    tags: ["required", "format regex", "range", "soft/hard"],
  },
  {
    title: "Email Report",
    description: "When errors exist, GPT drafts a professional rejection email addressed to the credit union's data team. Staff can review and send it in one click.",
    color: "bg-rose-500/15 text-rose-400",
    tags: ["OpenAI GPT", "HTML email", "draft → send"],
  },
];

const STACK_SECTIONS = [
  {
    title: "Frontend",
    items: [
      { name: "React 18 + Vite", detail: "SPA framework & build tool", color: "#6366f1" },
      { name: "Tailwind CSS + shadcn/ui", detail: "Utility CSS + component library", color: "#8b5cf6" },
      { name: "TanStack Query", detail: "Server state & caching", color: "#06b6d4" },
      { name: "wouter", detail: "Lightweight client-side routing", color: "#a78bfa" },
      { name: "Orval codegen", detail: "Typed hooks from OpenAPI spec", color: "#7c3aed" },
    ],
  },
  {
    title: "Backend",
    items: [
      { name: "Express 5 + Node 24", detail: "HTTP API server", color: "#8b5cf6" },
      { name: "PostgreSQL 16", detail: "Primary relational database", color: "#10b981" },
      { name: "Drizzle ORM", detail: "Type-safe SQL query builder", color: "#34d399" },
      { name: "Zod v4", detail: "Runtime schema validation", color: "#6ee7b7" },
      { name: "OpenAI (via AI Integrations)", detail: "Field mapping & email generation", color: "#f97316" },
    ],
  },
  {
    title: "Monorepo Packages",
    items: [
      { name: "@workspace/db", detail: "Drizzle schema + migrations", color: "#10b981" },
      { name: "@workspace/api-spec", detail: "OpenAPI contract (source of truth)", color: "#6366f1" },
      { name: "@workspace/api-zod", detail: "Zod schemas generated from spec", color: "#8b5cf6" },
      { name: "@workspace/api-client-react", detail: "React hooks generated from spec", color: "#a78bfa" },
    ],
  },
  {
    title: "Canonical Schema (23 Fields)",
    items: [
      { name: "Member (7)", detail: "memberId, firstName, lastName, DOB, SSN, membershipDate, status", color: "#6366f1" },
      { name: "Contact (6)", detail: "email, phone, address, city, state, zip", color: "#8b5cf6" },
      { name: "Account (3)", detail: "accountNumber, type, openDate", color: "#a78bfa" },
      { name: "Financial (7)", detail: "balances, contributions, riskProfile, annualIncome", color: "#c4b5fd" },
    ],
  },
];

const DATA_TABLES = [
  {
    name: "credit_unions",
    description: "Onboarded partner credit union organizations.",
    columns: ["id", "name", "contact_email", "total_jobs_run", "last_ingestion_at"],
  },
  {
    name: "ingestion_jobs",
    description: "Each file upload processed through the pipeline.",
    columns: ["id", "credit_union_id", "file_name", "file_type", "status", "error_summary"],
  },
  {
    name: "field_mappings",
    description: "AI-generated source → canonical field mappings per job.",
    columns: ["id", "ingestion_job_id", "source_field", "canonical_field", "confidence_score", "is_approved"],
  },
  {
    name: "processed_records",
    description: "Row-level results after DQ rule evaluation.",
    columns: ["id", "ingestion_job_id", "row_number", "status", "canonical_data", "error_details"],
  },
  {
    name: "data_quality_rules",
    description: "Configurable validation rules applied to every job.",
    columns: ["id", "name", "field", "rule_type", "severity", "rule_config", "is_active"],
  },
  {
    name: "email_reports",
    description: "AI-drafted rejection emails per job.",
    columns: ["id", "ingestion_job_id", "subject", "body_html", "recipient_email", "status"],
  },
];
