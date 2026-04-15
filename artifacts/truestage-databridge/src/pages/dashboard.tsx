import { useGetDashboardSummary, useGetRecentJobs, useGetCreditUnionStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Building2, Database, AlertCircle, FileCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: ["/api/dashboard/summary"] } });
  const { data: recentJobs, isLoading: isLoadingJobs } = useGetRecentJobs({ query: { queryKey: ["/api/dashboard/recent-jobs"] } });
  const { data: cuStats, isLoading: isLoadingStats } = useGetCreditUnionStats({ query: { queryKey: ["/api/dashboard/credit-union-stats"] } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Processing Insights</h1>
        <p className="text-muted-foreground mt-1">Overview of data ingestion operations and quality metrics.</p>
      </div>

      {isLoadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Unions</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeCreditUnions} <span className="text-muted-foreground text-sm font-normal">/ {summary.totalCreditUnions} Active</span></div>
              <p className="text-xs text-muted-foreground mt-1">Platform wide onboarding</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs This Month</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.jobsThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.totalJobsAllTime} total all-time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRecordsProcessed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{(summary.totalRecordsAccepted / Math.max(1, summary.totalRecordsProcessed) * 100).toFixed(1)}% acceptance rate</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Hard Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.totalHardErrors.toLocaleString()}</div>
              <p className="text-xs text-destructive/80 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Ingestion Jobs</CardTitle>
            <CardDescription>Latest pipeline runs across all credit unions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingJobs ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <Link key={job.id} href={`/ingestion/${job.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group">
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold group-hover:text-accent transition-colors">{job.creditUnionName || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{job.fileName}</span>
                          <span>•</span>
                          <span>{format(new Date(job.createdAt), "MMM d, HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          job.status === "completed" ? "default" :
                          job.status === "failed" ? "destructive" : "secondary"
                        }>
                          {job.status}
                        </Badge>
                        {job.totalRecords ? (
                          <div className="text-xs text-muted-foreground">
                            {job.processedRecords} / {job.totalRecords} records
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent jobs.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Processing Insights</CardTitle>
            <CardDescription>Error rates and confidence scores by tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : cuStats && cuStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Credit Union</th>
                      <th className="pb-3 font-medium text-right">Jobs</th>
                      <th className="pb-3 font-medium text-right">Records</th>
                      <th className="pb-3 font-medium text-right">Hard Errors</th>
                      <th className="pb-3 font-medium text-right">Avg Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuStats.map(stat => (
                      <tr key={stat.creditUnionId} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-medium">
                          <Link href={`/credit-unions/${stat.creditUnionId}`} className="hover:underline">
                            {stat.creditUnionName}
                          </Link>
                        </td>
                        <td className="py-3 text-right">{stat.totalJobs}</td>
                        <td className="py-3 text-right">{stat.totalRecords.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={stat.hardErrors > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {stat.hardErrors.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded overflow-hidden">
                              <div 
                                className={`h-full ${stat.avgConfidence > 0.8 ? "bg-green-500" : stat.avgConfidence > 0.5 ? "bg-yellow-500" : "bg-destructive"}`} 
                                style={{ width: `${stat.avgConfidence * 100}%` }} 
                              />
                            </div>
                            <span className="text-xs w-8 text-right">{(stat.avgConfidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}