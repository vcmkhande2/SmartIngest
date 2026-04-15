import { useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Upload, File, AlertCircle, Database } from "lucide-react";

import { useListIngestionJobs, getListIngestionJobsQueryKey, useCreateIngestionJob, useListCreditUnions, getListCreditUnionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function IngestionList() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCU, setSelectedCU] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: jobs, isLoading: isLoadingJobs } = useListIngestionJobs({}, { query: { queryKey: getListIngestionJobsQueryKey({}) } });
  const { data: creditUnions } = useListCreditUnions({ query: { queryKey: getListCreditUnionsQueryKey() } });
  
  const createJobMutation = useCreateIngestionJob();

  const handleFile = (file: File) => {
    if (!selectedCU) {
      toast({ title: "Error", description: "Please select a Credit Union first", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileContent = content.includes('base64,') ? content.split('base64,')[1] : btoa(content);

      createJobMutation.mutate({
        data: {
          creditUnionId: parseInt(selectedCU, 10),
          fileName: file.name,
          fileType: file.type || "text/csv",
          fileSize: file.size,
          fileContent,
        }
      }, {
        onSuccess: (job) => {
          setIsUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: getListIngestionJobsQueryKey({}) });
          navigate(`/ingestion/${job.id}`);
        },
        onError: (error) => {
          toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ingestion Pipeline</h1>
          <p className="text-muted-foreground mt-1">Upload and monitor data mapping jobs.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}><Upload className="w-4 h-4 mr-2" /> Upload Data</Button>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Data File</DialogTitle>
            <DialogDescription>Select a credit union and upload their raw data extract.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Credit Union</label>
              <Select value={selectedCU} onValueChange={setSelectedCU}>
                <SelectTrigger>
                  <SelectValue placeholder="Select credit union" />
                </SelectTrigger>
                <SelectContent>
                  {creditUnions?.map(cu => (
                    <SelectItem key={cu.id} value={cu.id.toString()}>{cu.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data File</label>
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                } ${!selectedCU ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={onChange}
                  accept=".csv,.json,.tsv,.xlsx"
                  disabled={!selectedCU || createJobMutation.isPending} 
                />
                <Upload className={`w-10 h-10 mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {createJobMutation.isPending ? (
                  <>
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm font-medium">Uploading and launching pipeline...</p>
                  </>
                ) : isDragActive ? (
                  <p className="text-sm font-medium text-primary">Drop the file here ...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drag & drop file here, or click to select</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports CSV, TSV, JSON</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoadingJobs ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4 font-medium">File</th>
                  <th className="py-3 px-4 font-medium">Credit Union</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Progress</th>
                  <th className="py-3 px-4 font-medium text-right">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="py-3 px-4">
                      <Link href={`/ingestion/${job.id}`} className="flex items-center gap-2 font-medium group-hover:text-accent transition-colors">
                        <File className="w-4 h-4 text-muted-foreground" /> {job.fileName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{job.creditUnionName}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        job.status === "completed" ? "default" :
                        job.status === "failed" ? "destructive" : 
                        job.status === "uploaded" ? "outline" : "secondary"
                      }>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.totalRecords ? (
                        <div className="flex flex-col items-end">
                          <span>{job.processedRecords} / {job.totalRecords}</span>
                          {job.hardErrorRecords ? (
                            <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {job.hardErrorRecords} errors</span>
                          ) : null}
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                      {format(new Date(job.createdAt), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No ingestion jobs</h3>
              <p className="text-muted-foreground text-sm mt-1">Upload a file to start processing data.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
