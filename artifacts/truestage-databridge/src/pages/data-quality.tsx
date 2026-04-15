import { useListDataQualityRules, getListDataQualityRulesQueryKey, useCreateDataQualityRule, useUpdateDataQualityRule, useDeleteDataQualityRule, useListCanonicalFields, getListCanonicalFieldsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldCheck, ShieldAlert, Trash2, Edit2, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  field: z.string().min(1, "Field is required"),
  ruleType: z.enum(["required", "format", "range", "uniqueness", "reference"]),
  severity: z.enum(["soft", "hard"]),
  ruleConfig: z.string().min(2, "Config (JSON) is required"),
  isActive: z.boolean().default(true),
});

export default function DataQuality() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules, isLoading: isLoadingRules } = useListDataQualityRules({ query: { queryKey: getListDataQualityRulesQueryKey() } });
  const { data: fields } = useListCanonicalFields({ query: { queryKey: getListCanonicalFieldsQueryKey() } });

  const createMutation = useCreateDataQualityRule();
  const updateMutation = useUpdateDataQualityRule();
  const deleteMutation = useDeleteDataQualityRule();

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      description: "",
      field: "",
      ruleType: "required",
      severity: "hard",
      ruleConfig: "{}",
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      name: "", description: "", field: "", ruleType: "required", severity: "hard", ruleConfig: "{}", isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingId(rule.id);
    form.reset({
      name: rule.name,
      description: rule.description || "",
      field: rule.field,
      ruleType: rule.ruleType,
      severity: rule.severity,
      ruleConfig: rule.ruleConfig || "{}",
      isActive: rule.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof ruleSchema>) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          toast({ title: "Rule Updated", description: "Data quality rule saved." });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListDataQualityRulesQueryKey() });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Rule Created", description: "New data quality rule added." });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListDataQualityRulesQueryKey() });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this rule?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Rule Deleted" });
          queryClient.invalidateQueries({ queryKey: getListDataQualityRulesQueryKey() });
        }
      });
    }
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDataQualityRulesQueryKey() })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Quality Rules</h1>
          <p className="text-muted-foreground mt-1">Define validation rules applied during AI ingestion.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Rule</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Rule" : "Create Rule"}</DialogTitle>
            <DialogDescription>Configure validation logic for canonical fields.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="field" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Field</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {fields?.map(f => <SelectItem key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="ruleType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="format">Format (Regex)</SelectItem>
                        <SelectItem value="range">Range</SelectItem>
                        <SelectItem value="uniqueness">Uniqueness</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="severity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="hard">Hard Error (Rejects record)</SelectItem>
                      <SelectItem value="soft">Soft Error (Flags record)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="ruleConfig" render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration (JSON)</FormLabel>
                  <FormControl><Textarea className="font-mono text-xs" rows={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save Rule</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoadingRules ? (
            <div className="p-4 space-y-4"><Skeleton className="h-16 w-full" /></div>
          ) : rules && rules.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-left text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Rule</th>
                  <th className="py-3 px-4 font-medium">Target Field</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rules.map(rule => (
                  <tr key={rule.id} className={`hover:bg-muted/50 transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4">
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggleActive(rule.id, rule.isActive)} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium flex items-center gap-2">
                        {rule.name}
                        {rule.severity === 'hard' ? 
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 h-5 text-[10px] uppercase">Hard</Badge> : 
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 h-5 text-[10px] uppercase">Soft</Badge>
                        }
                      </div>
                      {rule.description && <div className="text-xs text-muted-foreground mt-0.5">{rule.description}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{rule.field}</td>
                    <td className="py-3 px-4 capitalize">{rule.ruleType}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Settings className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No data quality rules configured.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}