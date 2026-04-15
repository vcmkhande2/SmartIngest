import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

export interface CanonicalFieldInfo {
  fieldKey: string;
  label: string;
  category: string;
  dataType: string;
  isRequired: boolean;
  description?: string | null;
}

export interface MappingResult {
  sourceField: string;
  canonicalField: string | null;
  canonicalFieldLabel: string | null;
  confidenceScore: number;
  aiReasoning: string;
}

export async function aiMapFields(
  sourceFields: string[],
  sampleRows: Record<string, string>[],
  canonicalFields: CanonicalFieldInfo[]
): Promise<MappingResult[]> {
  const sampleData: Record<string, string[]> = {};
  for (const field of sourceFields) {
    sampleData[field] = sampleRows.slice(0, 5).map((row) => row[field] ?? "").filter(Boolean);
  }

  const canonicalList = canonicalFields
    .map(
      (f) =>
        `- ${f.fieldKey} (${f.label}, category: ${f.category}, type: ${f.dataType}, required: ${f.isRequired}${f.description ? ", desc: " + f.description : ""})`
    )
    .join("\n");

  const sourceList = sourceFields
    .map((f) => {
      const samples = sampleData[f]?.slice(0, 3).join(", ") || "";
      return `- ${f} (sample values: ${samples})`;
    })
    .join("\n");

  const systemPrompt = `You are an expert financial data integration specialist helping TruStage Wealth Management map credit union member data files to TruStage's canonical schema.

TruStage provides wealth management services to credit union members. You must analyze source field names and sample values, then map each source field to the best matching canonical field.

Your response must be valid JSON: an array of mapping objects with these exact keys:
- sourceField: string (the original field name)
- canonicalField: string or null (the matching canonical field key, or null if no good match)
- canonicalFieldLabel: string or null (the canonical field's label)
- confidenceScore: number 0.0-1.0 (your confidence in this mapping)
- aiReasoning: string (brief 1-2 sentence explanation of why you chose this mapping)

Rules:
- Only map to canonical fields that actually exist in the provided list
- Use null for canonicalField when there is no reasonable match (confidence < 0.3)
- Be liberal with fuzzy matching: "mem_no" → "memberId", "dob" → "dateOfBirth", "bal" → "accountBalance" etc.
- Confidence > 0.8: near-certain match; 0.5-0.8: likely match with some uncertainty; < 0.5: uncertain
- Common financial data patterns: SSN, DOB, member/account numbers, names, addresses, balances, investment amounts`;

  const userPrompt = `Source fields from the credit union file:
${sourceList}

TruStage canonical schema fields available to map to:
${canonicalList}

Return a JSON array mapping each source field to the best canonical field. Return ONLY the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const mappings = JSON.parse(cleaned) as MappingResult[];
    return mappings;
  } catch (err) {
    logger.error({ err }, "AI mapping failed, returning empty mappings");
    return sourceFields.map((f) => ({
      sourceField: f,
      canonicalField: null,
      canonicalFieldLabel: null,
      confidenceScore: 0,
      aiReasoning: "AI mapping service unavailable",
    }));
  }
}

export async function aiGenerateEmailReport(params: {
  creditUnionName: string;
  recipientEmail: string;
  fileName: string;
  totalRecords: number;
  hardErrors: Array<{ rowNumber: number; errorDetails: string }>;
  softErrors: Array<{ rowNumber: number; errorDetails: string }>;
}): Promise<{ subject: string; bodyHtml: string }> {
  const hardErrorSummary = params.hardErrors
    .slice(0, 20)
    .map((e) => `Row ${e.rowNumber}: ${e.errorDetails}`)
    .join("\n");

  const systemPrompt = `You are a professional data operations specialist at TruStage Wealth Management. Write clear, professional, empathetic email reports to credit union data teams about data ingestion results. 

The email should:
- Be professional but friendly
- Clearly explain what was processed and what needs correction
- Provide specific row numbers and error descriptions for hard errors (rejected records)
- Mention soft errors as warnings that were processed but should be reviewed
- Include a clear action request for the credit union to correct and resubmit rejected records
- Be formatted as clean HTML (use <p>, <ul>, <li>, <table>, <strong> tags — no CSS classes, keep it inline-friendly)

Return ONLY a JSON object with: { "subject": "...", "bodyHtml": "..." }`;

  const userPrompt = `Write an email report for ${params.creditUnionName} about their data file "${params.fileName}".

Processing results:
- Total records in file: ${params.totalRecords}
- Hard errors (REJECTED - must be corrected and resubmitted): ${params.hardErrors.length}
- Soft errors (processed with warnings): ${params.softErrors.length}
- Successfully accepted: ${params.totalRecords - params.hardErrors.length}

Hard error details (rejected records):
${hardErrorSummary || "None"}

Soft error count by row: ${params.softErrors.length} records had data quality warnings but were processed.

Recipient: ${params.recipientEmail}

Return JSON with subject and bodyHtml only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned) as { subject: string; bodyHtml: string };
    return result;
  } catch (err) {
    logger.error({ err }, "AI email generation failed");
    return {
      subject: `TruStage Data Processing Report - ${params.creditUnionName} - ${params.fileName}`,
      bodyHtml: `<p>Dear ${params.creditUnionName} Team,</p><p>We have processed your file <strong>${params.fileName}</strong>. Of ${params.totalRecords} records, ${params.hardErrors.length} were rejected due to data quality issues and require correction before resubmission. Please contact your TruStage representative for details.</p>`,
    };
  }
}
