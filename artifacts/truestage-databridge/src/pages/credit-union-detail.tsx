import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, User, Clock, ArrowLeft, Activity, FileStack, Settings, Database } from "lucide-react";

import { useGetCreditUnion, getGetCreditUnionQueryKey, useUpdateCreditUnion, useListIngestionJobs, getListIngestionJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const updateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactName: z.string().optional(),
  status: z.enum(["active", "inactive", "onboarding"]),
});

export default function CreditUnionDetail() {
  const { id } = useParams();
  const cuId = parseInt(id || "0", 10);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cu, isLoading: isLoadingCU } = useGetCreditUnion(cuId, { 
    query: { enabled: !!cuId, queryKey: getGetCreditUnionQueryKey(cuId) } 
  });

  const { data: jobs, isLoading: isLoadingJobs } = useListIngestionJobs(
    { creditUnionId: cuId },
    { query: { enabled: !!cuId, queryKey: getListIngestionJobsQueryKey({ creditUnionId: cuId }) } }
  );

  const updateMutation = useUpdateCreditUnion();

  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
  });

  useEffect(() => {
    if (cu) {
      form.reset({
        name: cu.name,
        contactEmail: cu.contactEmail,
        contactName: cu.contactName || "",
        status: cu.status as "active" | "inactive" | "onboarding",
      });
    }
  }, [cu, form]);

  const onSubmit = (values: z.infer<typeof updateFormSchema>) => {
    updateMutation.mutate({ id: cuId, data: values }, {
      onSuccess: (data) => {
        toast({ title: "Updated", description: "Credit union details updated successfully." });
        setIsEditing(false);
        queryClient.setQueryData(getGetCreditUnionQueryKey(cuId), data);
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
      }
    });
  };

  if (isLoadingCU) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!cu) {
    return <div>Credit Union not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/credit-unions" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Credit Unions
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{cu.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={
                  cu.status === "active" ? "default" :
                  cu.status === "onboarding" ? "secondary" : "outline"
                }>
                  {cu.status}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 
                  Added {format(new Date(cu.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel Editing" : <><Settings className="w-4 h-4 mr-2" /> Edit Details</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="onboarding">Onboarding</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator />
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><User className="w-4 h-4"/> Primary Contact</div>
                    <div className="font-medium">{cu.contactName || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Mail className="w-4 h-4"/> Email Address</div>
                    <div><a href={`mailto:${cu.contactEmail}`} className="text-accent hover:underline">{cu.contactEmail}</a></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Activity className="w-4 h-4"/> Lifetime Jobs</div>
                    <div className="font-medium">{cu.totalJobsRun}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Clock className="w-4 h-4"/> Last Ingestion</div>
                    <div className="font-medium">{cu.lastIngestionAt ? format(new Date(cu.lastIngestionAt), "MMM d, yyyy HH:mm") : "Never"}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle>Ingestion History</CardTitle>
                <CardDescription>Recent files processed for this tenant.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ingestion?creditUnionId=${cu.id}`}>View All <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingJobs ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="divide-y">
                  {jobs.map(job => (
                    <Link key={job.id} href={`/ingestion/${job.id}`}>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <FileStack className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium group-hover:text-accent transition-colors">{job.fileName}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="hidden sm:block">
                            {job.totalRecords ? (
                              <div className="text-sm">{job.processedRecords} / {job.totalRecords} recs</div>
                            ) : null}
                            {job.mappingConfidenceAvg ? (
                              <div className="text-xs text-muted-foreground">{(job.mappingConfidenceAvg * 100).toFixed(0)}% AI Conf</div>
                            ) : null}
                          </div>
                          <Badge variant={
                            job.status === "completed" ? "default" :
                            job.status === "failed" ? "destructive" : "secondary"
                          }>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No ingestion history</h3>
                  <p className="text-muted-foreground text-sm mt-1">This credit union hasn't uploaded any data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}