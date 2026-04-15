import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creditUnionsRouter from "./creditUnions";
import ingestionJobsRouter from "./ingestionJobs";
import fieldMappingsRouter from "./fieldMappings";
import processedRecordsRouter from "./processedRecords";
import dataQualityRulesRouter from "./dataQualityRules";
import canonicalFieldsRouter from "./canonicalFields";
import emailReportsRouter from "./emailReports";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creditUnionsRouter);
router.use(ingestionJobsRouter);
router.use(fieldMappingsRouter);
router.use(processedRecordsRouter);
router.use(dataQualityRulesRouter);
router.use(canonicalFieldsRouter);
router.use(emailReportsRouter);
router.use(dashboardRouter);

export default router;
