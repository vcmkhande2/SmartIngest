import { useParams, Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, FileText, Send, Sparkles, XCircle, UploadCloud, Cpu, ShieldCheck, Mail, PartyPopper } from "lucide-react";

import { 
  useGetIngestionJob, 
  getGetIngestionJobQueryKey, 
  useListFieldMappings,
  getListFieldMappingsQueryKey,
  useListIngestionRecords,
  useGetEmailReport,
  useSendEmailReport,
  useUpdateFieldMappings
} from "@workspace/api-client-react";
import { useQueryClient, type Query } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PIPELINE_STAGES = [
  {
    key: "uploaded",
    label: "File Uploaded",
    description: "Data file received and parsed",
    icon: UploadCloud,
    activeStatuses: [] as string[],
    doneStatuses: ["mapping", "mapped", "processing", "completed", "partial", "failed"],
  },
  {
    key: "mapping",
    label: "AI Field Mapping",
    description: "Analyzing headers and mapping to canonical schema",
    icon: Cpu,
    activeStatuses: ["uploaded", "mapping"],
    doneStatuses: ["mapped", "processing", "completed", "partial", "failed"],
  },
  {
    key: "processing",
    label: "Data Quality Rules",
    description: "Validating every record against quality rules",
    icon: ShieldCheck,
    activeStatuses: ["mapped", "processing"],
    doneStatuses: ["completed", "partial", "failed"],
  },
  {
    key: "reporting",
    label: "Generating Report",
    description: "AI drafting error report for credit union",
    icon: Mail,
    activeStatuses: [] as string[],
    doneStatuses: ["completed", "partial", "failed"],
  },
  {
    key: "done",
    label: "Complete",
    description: "Pipeline finished successfully",
    icon: PartyPopper,
    activeStatuses: [] as string[],
    doneStatuses: ["completed", "partial", "failed"],
  },
];

function PipelineProgress({ status, fileName, totalRecords }: { status: string; fileName: string; totalRecords: number | null }) {
  const activeStageIndex = PIPELINE_STAGES.findIndex(
    (s) => s.activeStatuses.includes(status)
  );
  const progressPct = status === "uploaded" ? 10
    : status === "mapping" ? 28
    : status === "mapped" ? 52
    : status === "processing" ? 70
    : 100;

  const statusMessage =
    status === "uploaded" ? "Starting AI field mapping…"
    : status === "mapping" ? "AI is analyzing your data headers and mapping them to TruStage's canonical schema…"
    : status === "mapped" ? "Mappings complete. Running data quality validation…"
    : status === "processing" ? `Applying quality rules across ${totalRecords?.toLocaleString() ?? "all"} records…`
    : "Wrapping up…";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-100">Pipeline Running</span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">{fileName}</p>
        </div>
        <span className="text-2xl font-bold text-white tabular-nums">{progressPct}%</span>
      </div>

      <div className="px-6 pt-4 pb-1">
        <Progress value={progressPct} className="h-1.5" />
      </div>

      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground mb-6 min-h-[1.25rem]">{statusMessage}</p>

        <div className="space-y-4">
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = stage.doneStatuses.includes(status);
            const isActive = stage.activeStatuses.includes(status);
            const isPending = !isDone && !isActive;

            return (
              <div key={stage.key} className="flex items-start gap-4">
                <div className="relative flex-shrink-0 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isDone ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" :
                    isActive ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(99,102,241,0.3)]" :
                    "bg-muted text-muted-foreground/40 border border-border"
                  }`}>
                    {isActive ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className={`w-px flex-1 mt-1 min-h-[1.5rem] transition-colors duration-500 ${
                      isDone ? "bg-emerald-500/30" : "bg-border"
                    }`} />
                  )}
                </div>

                <div className="pt-1.5 pb-4">
                  <p className={`text-sm font-semibold leading-none transition-colors duration-300 ${
                    isActive ? "text-foreground" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"
                  }`}>
                    {stage.label}
                    {isActive && (
                      <span className="ml-2 text-xs font-normal text-primary animate-pulse">running…</span>
                    )}
                  </p>
                  {(isActive || isDone) && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const IN_PROGRESS_STATUSES = ["uploaded", "mapping", "mapped", "processing"];

export default function JobDetail() {
  const { id } = useParams();
  const jobId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recordFilter, setRecordFilter] = useState<string>("all");
  
  const { data: job, isLoading: isLoadingJob } = useGetIngestionJob(jobId, { 
    query: { 
      enabled: !!jobId, 
      queryKey: getGetIngestionJobQueryKey(jobId),
      refetchInterval: (query: Query) => {
        const data = query.state.data as { status?: string } | undefined;
        if (!data?.status) return 2000;
        return IN_PROGRESS_STATUSES.includes(data.status) ? 1500 : false;
      },
    } 
  });

  const isInProgress = job && IN_PROGRESS_STATUSES.includes(job.status);

  const { data: mappings, isLoading: isLoadingMappings } = useListFieldMappings(jobId, { query: { enabled: !!jobId && !isInProgress, queryKey: getListFieldMappingsQueryKey(jobId) } });
  const { data: records, isLoading: isLoadingRecords } = useListIngestionRecords(jobId, { 
    status: recordFilter === "all" ? undefined : recordFilter 
  }, { query: { enabled: !!jobId && !isInProgress, queryKey: ["/api/ingestion-jobs", jobId, "records", recordFilter] } });
  
  const { data: emailReport } = useGetEmailReport(jobId, { query: { enabled: !!jobId && !isInProgress, queryKey: ["/api/ingestion-jobs", jobId, "email-report"] } });

  const updateMappingMutation = useUpdateFieldMappings();
  const sendEmailMutation = useSendEmailReport();

  const handleToggleApproval = (mappingId: number, currentStatus: boolean) => {
    updateMappingMutation.mutate({ 
      id: jobId, 
      data: { mappings: [{ id: mappingId, isApproved: !currentStatus }] } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFieldMappingsQueryKey(jobId) });
      }
    });
  };

  const handleSendEmail = () => {
    if (!emailReport) return;
    sendEmailMutation.mutate({ id: jobId, data: { recipientEmail: emailReport.recipientEmail } }, {
      onSuccess: () => {
        toast({ title: "Email Sent", description: "The error report has been sent to the credit union." });
        queryClient.invalidateQueries({ queryKey: ["/api/ingestion-jobs", jobId, "email-report"] });
      }
    });
  };

  if (isLoadingJob) return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (!job) return <div>Job not found.</div>;

  const isCompletePhase = job.status === "completed" || job.status === "partial" || job.status === "failed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/ingestion" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Ingestion Jobs
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {job.fileName}
            <Badge variant={
              job.status === "completed" ? "default" :
              job.status === "partial" ? "secondary" :
              job.status === "failed" ? "destructive" : 
              job.status === "uploaded" ? "outline" : "secondary"
            } className="text-sm">
              {isInProgress ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                  {job.status}
                </span>
              ) : job.status}
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
            <span>Credit Union: <Link href={`/credit-unions/${job.creditUnionId}`} className="font-medium text-foreground hover:underline">{job.creditUnionName}</Link></span>
            <span>•</span>
            <span>Uploaded: {format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}</span>
            <span>•</span>
            <span>Size: {job.fileSize ? (job.fileSize / 1024).toFixed(1) + " KB" : "Unknown"}</span>
            {job.totalRecords && <><span>•</span><span>{job.totalRecords.toLocaleString()} records</span></>}
          </div>
        </div>
      </div>

      {job.errorSummary && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Processing Error</h4>
            <p className="text-sm mt-1">{job.errorSummary}</p>
          </div>
        </div>
      )}

      {isInProgress && (
        <PipelineProgress status={job.status} fileName={job.fileName} totalRecords={job.totalRecords ?? null} />
      )}

      {isCompletePhase && job.totalRecords && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{job.totalRecords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{job.acceptedRecords?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{job.softErrorRecords?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Soft Errors</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{job.hardErrorRecords?.toLocaleString() || 0}</div>
              <p className="text-xs text-destructive/80 font-medium uppercase tracking-wider mt-1">Hard Errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isCompletePhase && (
        <Tabs defaultValue="mappings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="email" disabled={!emailReport}>Email Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mappings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Field Mapping</CardTitle>
                <CardDescription>How source fields were mapped to the TruStage canonical schema.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingMappings ? (
                  <div className="p-4 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : mappings && mappings.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-left text-muted-foreground">
                        <th className="py-3 px-4 font-medium">Source Field</th>
                        <th className="py-3 px-4 font-medium">Canonical Match</th>
                        <th className="py-3 px-4 font-medium">AI Confidence</th>
                        <th className="py-3 px-4 font-medium">Sample Values</th>
                        <th className="py-3 px-4 font-medium text-right">Approved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {mappings.map(mapping => {
                        let confColor = "bg-destructive";
                        if (mapping.confidenceScore > 0.8) confColor = "bg-green-500";
                        else if (mapping.confidenceScore > 0.5) confColor = "bg-yellow-500";

                        const samples = mapping.sampleValues ? JSON.parse(mapping.sampleValues) : [];

                        return (
                          <tr key={mapping.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs">{mapping.sourceField}</td>
                            <td className="py-3 px-4">
                              {mapping.canonicalField ? (
                                <Badge variant="outline" className="font-mono bg-background">
                                  {mapping.canonicalFieldLabel || mapping.canonicalField}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground italic">Unmapped (Ignored)</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                      <div className={`h-full ${confColor}`} style={{ width: `${mapping.confidenceScore * 100}%` }} />
                                    </div>
                                    <span className="text-xs">{(mapping.confidenceScore * 100).toFixed(0)}%</span>
                                    {mapping.aiReasoning && <Sparkles className="w-3 h-3 text-muted-foreground" />}
                                  </div>
                                </TooltipTrigger>
                                {mapping.aiReasoning && (
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm font-semibold mb-1">AI Reasoning</p>
                                    <p>{mapping.aiReasoning}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {samples.slice(0, 2).map((s: string, i: number) => (
                                  <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">{s}</span>
                                ))}
                                {samples.length > 2 && <span className="text-xs text-muted-foreground">+{samples.length - 2}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Switch 
                                checked={mapping.isApproved} 
                                onCheckedChange={() => handleToggleApproval(mapping.id, mapping.isApproved)}
                                disabled={updateMappingMutation.isPending}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No mappings found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle>Processed Records</CardTitle>
                  <CardDescription>View data validation results line by line.</CardDescription>
                </div>
                <Select value={recordFilter} onValueChange={setRecordFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="soft_error">Soft Errors</SelectItem>
                    <SelectItem value="hard_error">Hard Errors</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingRecords ? (
                  <div className="p-4 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : records && records.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-left text-muted-foreground">
                        <th className="py-3 px-4 font-medium w-16">Row</th>
                        <th className="py-3 px-4 font-medium w-24">Status</th>
                        <th className="py-3 px-4 font-medium">Mapped Data Sample</th>
                        <th className="py-3 px-4 font-medium">Error Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {records.map(record => {
                        const data = record.canonicalData ? JSON.parse(record.canonicalData) : {};
                        const displayData = Object.entries(data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", ");
                        const errors = record.errorDetails ? JSON.parse(record.errorDetails) : [];
                        
                        return (
                          <tr key={record.id} className={`hover:bg-muted/50 transition-colors ${
                            record.status === 'hard_error' ? 'bg-destructive/5' : 
                            record.status === 'soft_error' ? 'bg-yellow-500/5' : ''
                          }`}>
                            <td className="py-3 px-4 text-muted-foreground">{record.rowNumber}</td>
                            <td className="py-3 px-4">
                              {record.status === 'accepted' ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> :
                               record.status === 'soft_error' ? <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><AlertTriangle className="w-3 h-3 mr-1"/> Soft</Badge> :
                               <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> Hard</Badge>}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs truncate max-w-xs">{displayData}...</td>
                            <td className="py-3 px-4">
                              {errors.length > 0 ? (
                                <ul className="list-disc list-inside text-xs text-muted-foreground">
                                  {errors.map((e: {field: string; message: string; severity: string}, i: number) => (
                                    <li key={i} className={e.severity === 'hard' ? 'text-destructive font-medium' : ''}>
                                      {e.field}: {e.message}
                                    </li>
                                  ))}
                                </ul>
                              ) : <span className="text-muted-foreground">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No records match the current filter.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            {emailReport && (
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" /> AI Drafted Report
                    </CardTitle>
                    <CardDescription>Review and send the error report to the credit union.</CardDescription>
                  </div>
                  <Badge variant={emailReport.status === "sent" ? "default" : "secondary"}>
                    {emailReport.status === "sent" ? `Sent ${format(new Date(emailReport.sentAt || ""), "MMM d")}` : "Draft"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-background">
                    <div className="bg-muted/50 p-4 border-b space-y-2 text-sm">
                      <div className="flex"><span className="w-16 font-medium text-muted-foreground">To:</span> <span>{emailReport.recipientEmail}</span></div>
                      <div className="flex"><span className="w-16 font-medium text-muted-foreground">Subject:</span> <span className="font-semibold">{emailReport.subject}</span></div>
                    </div>
                    <div className="p-6 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: emailReport.bodyHtml }} />
                  </div>
                  
                  {emailReport.status === "draft" && (
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                        <Send className="w-4 h-4 mr-2" /> 
                        {sendEmailMutation.isPending ? "Sending..." : "Send Report"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {!emailReport && isCompletePhase && (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No email report generated — all records passed without errors.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
