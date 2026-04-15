import { db } from "./index";
import { canonicalFieldsTable, dataQualityRulesTable, creditUnionsTable } from "./schema";
import { count } from "drizzle-orm";

const canonicalFieldsSeed = [
  { fieldKey: "memberId", label: "Member ID", category: "member", dataType: "string", isRequired: true, description: "Unique member identifier at the credit union" },
  { fieldKey: "firstName", label: "First Name", category: "member", dataType: "string", isRequired: true, description: "Member first name" },
  { fieldKey: "lastName", label: "Last Name", category: "member", dataType: "string", isRequired: true, description: "Member last name" },
  { fieldKey: "dateOfBirth", label: "Date of Birth", category: "member", dataType: "date", isRequired: true, description: "Member date of birth in YYYY-MM-DD format" },
  { fieldKey: "socialSecurityNumber", label: "Social Security Number", category: "member", dataType: "string", isRequired: false, description: "Member SSN (last 4 or full)" },
  { fieldKey: "membershipDate", label: "Membership Date", category: "member", dataType: "date", isRequired: false, description: "Date member joined the credit union" },
  { fieldKey: "memberStatus", label: "Member Status", category: "member", dataType: "string", isRequired: false, description: "Active, inactive, deceased etc." },
  { fieldKey: "emailAddress", label: "Email Address", category: "contact", dataType: "email", isRequired: false, description: "Primary email for member communication" },
  { fieldKey: "phoneNumber", label: "Phone Number", category: "contact", dataType: "phone", isRequired: false, description: "Primary phone number" },
  { fieldKey: "streetAddress", label: "Street Address", category: "contact", dataType: "string", isRequired: false, description: "Street address line 1" },
  { fieldKey: "city", label: "City", category: "contact", dataType: "string", isRequired: false, description: "City of residence" },
  { fieldKey: "state", label: "State", category: "contact", dataType: "string", isRequired: false, description: "State abbreviation (e.g. WI, CA)" },
  { fieldKey: "zipCode", label: "ZIP Code", category: "contact", dataType: "string", isRequired: false, description: "Postal ZIP code" },
  { fieldKey: "accountNumber", label: "Account Number", category: "account", dataType: "string", isRequired: true, description: "Credit union account number" },
  { fieldKey: "accountType", label: "Account Type", category: "account", dataType: "string", isRequired: false, description: "Savings, checking, IRA, 401k etc." },
  { fieldKey: "accountOpenDate", label: "Account Open Date", category: "account", dataType: "date", isRequired: false, description: "Date account was opened" },
  { fieldKey: "accountBalance", label: "Account Balance", category: "financial", dataType: "number", isRequired: false, description: "Current account balance in USD" },
  { fieldKey: "investmentBalance", label: "Investment Balance", category: "financial", dataType: "number", isRequired: false, description: "Total investment portfolio balance" },
  { fieldKey: "loanBalance", label: "Loan Balance", category: "financial", dataType: "number", isRequired: false, description: "Outstanding loan balance" },
  { fieldKey: "retirementBalance", label: "Retirement Account Balance", category: "financial", dataType: "number", isRequired: false, description: "Total retirement account balance (IRA/401k)" },
  { fieldKey: "monthlyContribution", label: "Monthly Contribution", category: "financial", dataType: "number", isRequired: false, description: "Monthly investment or retirement contribution amount" },
  { fieldKey: "riskProfile", label: "Risk Profile", category: "financial", dataType: "string", isRequired: false, description: "Conservative, moderate, aggressive" },
  { fieldKey: "annualIncome", label: "Annual Income", category: "financial", dataType: "number", isRequired: false, description: "Reported annual household income" },
];

const dataQualityRulesSeed = [
  { name: "Member ID Required", description: "Every record must have a valid member ID", field: "memberId", ruleType: "required", severity: "hard", ruleConfig: "{}" },
  { name: "Account Number Required", description: "Every record must have an account number", field: "accountNumber", ruleType: "required", severity: "hard", ruleConfig: "{}" },
  { name: "First Name Required", description: "Member first name is required", field: "firstName", ruleType: "required", severity: "hard", ruleConfig: "{}" },
  { name: "Last Name Required", description: "Member last name is required", field: "lastName", ruleType: "required", severity: "hard", ruleConfig: "{}" },
  { name: "Valid Email Format", description: "Email address must be in valid format", field: "emailAddress", ruleType: "format", severity: "soft", ruleConfig: JSON.stringify({ regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }) },
  { name: "Valid US Phone", description: "Phone must be 10 digits", field: "phoneNumber", ruleType: "format", severity: "soft", ruleConfig: JSON.stringify({ regex: "^[0-9]{10}$" }) },
  { name: "Valid ZIP Code", description: "ZIP code must be 5 digits", field: "zipCode", ruleType: "format", severity: "soft", ruleConfig: JSON.stringify({ regex: "^[0-9]{5}$" }) },
  { name: "Account Balance Non-Negative", description: "Account balance cannot be negative", field: "accountBalance", ruleType: "range", severity: "soft", ruleConfig: JSON.stringify({ min: 0 }) },
  { name: "Investment Balance Non-Negative", description: "Investment balance cannot be negative", field: "investmentBalance", ruleType: "range", severity: "soft", ruleConfig: JSON.stringify({ min: 0 }) },
  { name: "Monthly Contribution Range", description: "Monthly contribution must be between 0 and 100000", field: "monthlyContribution", ruleType: "range", severity: "soft", ruleConfig: JSON.stringify({ min: 0, max: 100000 }) },
];

const creditUnionsSeed = [
  { name: "Midwest Federal CU", contactEmail: "data@midwestfcu.org", contactName: "Sarah Chen", status: "active", totalJobsRun: 7 },
  { name: "Lakeside Community CU", contactEmail: "operations@lakesidecu.com", contactName: "Marcus Thompson", status: "active", totalJobsRun: 1 },
  { name: "Heritage Savings CU", contactEmail: "admin@heritagecu.net", contactName: "Jennifer Walsh", status: "onboarding", totalJobsRun: 0 },
  { name: "TechWorkers CU", contactEmail: "it@techworkersCU.org", contactName: "David Park", status: "active", totalJobsRun: 6 },
  { name: "Sunrise Financial CU", contactEmail: "finance@sunrisefcu.com", contactName: "Amanda Rodriguez", status: "onboarding", totalJobsRun: 0 },
];

export async function seedDatabase(): Promise<void> {
  const [cfCount] = await db.select({ value: count() }).from(canonicalFieldsTable);
  if ((cfCount?.value ?? 0) === 0) {
    await db.insert(canonicalFieldsTable).values(canonicalFieldsSeed);
    console.log(`Seeded ${canonicalFieldsSeed.length} canonical fields`);
  }

  const [dqrCount] = await db.select({ value: count() }).from(dataQualityRulesTable);
  if ((dqrCount?.value ?? 0) === 0) {
    await db.insert(dataQualityRulesTable).values(dataQualityRulesSeed);
    console.log(`Seeded ${dataQualityRulesSeed.length} data quality rules`);
  }

  const [cuCount] = await db.select({ value: count() }).from(creditUnionsTable);
  if ((cuCount?.value ?? 0) === 0) {
    await db.insert(creditUnionsTable).values(creditUnionsSeed);
    console.log(`Seeded ${creditUnionsSeed.length} credit unions`);
  }
}
