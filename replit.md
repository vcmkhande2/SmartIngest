# SmartIngest by EXL

## Overview

AI-powered data ingestion and mapping platform for TruStage Wealth Management. Automates credit union member data onboarding — replacing manual teams doing data mapping, quality checks, and email reporting.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (wouter routing)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Core Features
1. **Smart File Ingestion** — Drag-and-drop upload supporting CSV, JSON, TSV from credit unions
2. **AI Field Mapping** — GPT-powered source→canonical field mapping with confidence scores and reasoning
3. **Data Quality Engine** — Soft errors (flag-and-process) and Hard errors (reject-and-report) with configurable rules
4. **Processing Pipeline** — Applies approved mappings + quality rules, stores records
5. **AI Email Reports** — Auto-generates professional rejection emails for credit union data teams

### Pages
- `/` — Dashboard (Mission Control): platform stats + recent jobs + per-CU performance
- `/credit-unions` — Credit union list and management
- `/credit-unions/:id` — Credit union detail with recent jobs
- `/ingestion` — File upload and ingestion pipeline
- `/ingestion/:id` — Job detail with Field Mappings | Records | Email Report tabs
- `/data-quality` — Data quality rules management (soft/hard severity)
- `/canonical-schema` — TruStage canonical schema browser

### Database Tables
- `credit_unions` — Onboarded credit union partners
- `ingestion_jobs` — File upload and processing jobs
- `field_mappings` — AI-suggested + approved field mappings per job
- `processed_records` — Per-row processing results (accepted/soft_error/hard_error)
- `data_quality_rules` — Configurable validation rules
- `canonical_fields` — TruStage's standard schema definition (23 fields across member/account/contact/financial)
- `email_reports` — AI-generated email reports for credit union data teams

### Services / Workflows
- **API Server** (`artifacts/api-server`) — Express 5, port 8080
- **Frontend** (`artifacts/truestage-databridge`) — React + Vite

### Key Files
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/lib/aiMappingService.ts` — AI field mapping + email generation
- `artifacts/api-server/src/lib/fileParser.ts` — CSV/JSON/TSV parser
- `artifacts/api-server/src/routes/ingestionJobs.ts` — All ingestion routes + `runAutoPipeline`

## Canonical Schema Categories
- **Member**: memberId, firstName, lastName, dateOfBirth, SSN, membershipDate, memberStatus
- **Contact**: emailAddress, phoneNumber, streetAddress, city, state, zipCode
- **Account**: accountNumber, accountType, accountOpenDate
- **Financial**: accountBalance, investmentBalance, loanBalance, retirementBalance, monthlyContribution, riskProfile, annualIncome

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
