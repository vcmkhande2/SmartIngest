import { useListCanonicalFields, getListCanonicalFieldsQueryKey } from "@workspace/api-client-react";
import { BookOpen, Key, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CanonicalSchema() {
  const { data: fields, isLoading } = useListCanonicalFields({ query: { queryKey: getListCanonicalFieldsQueryKey() } });

  type FieldItem = NonNullable<typeof fields>[number];
  // Group fields by category
  const groupedFields = (fields ?? []).reduce<Record<string, FieldItem[]>>((acc, field) => {
    const cat = field.category || 'uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canonical Schema</h1>
          <p className="text-muted-foreground mt-1">The universal TruStage data model that all credit union data maps into.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : Object.keys(groupedFields).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([category, catFields]) => (
            <Card key={category}>
              <CardHeader className="bg-muted/20 border-b py-4">
                <CardTitle className="capitalize flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" /> {category} Data
                </CardTitle>
                <CardDescription>Fields related to {category} records.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 px-4 font-medium w-[250px]">Field Key</th>
                      <th className="py-3 px-4 font-medium w-[200px]">Label</th>
                      <th className="py-3 px-4 font-medium w-[100px]">Type</th>
                      <th className="py-3 px-4 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {catFields.map(field => (
                      <tr key={field.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-primary font-semibold flex items-center gap-2">
                          {field.isRequired && <Key className="w-3 h-3 text-destructive" />}
                          {field.fieldKey}
                        </td>
                        <td className="py-3 px-4 font-medium">{field.label}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono text-[10px]">{field.dataType}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground flex items-start gap-2">
                          {field.description ? (
                            <>{field.description}</>
                          ) : (
                            <span className="italic opacity-50">-</span>
                          )}
                          {field.isRequired && <Badge variant="outline" className="ml-auto text-[10px] border-destructive/30 text-destructive bg-destructive/5 shrink-0">Required</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">No schema definition found.</div>
      )}
    </div>
  );
}