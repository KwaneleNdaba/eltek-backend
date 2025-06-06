import { ProjectCostDataResponse } from "@/types/report.types";
import { Token } from "typedi";


export interface IReportService {
    getPhaseCompletionPercentages(projectId: number): Promise<[number, number]>;
    getProjectCostData(projectId: number): Promise<ProjectCostDataResponse[]>;
    getStructuredAllocations(projectId: number): Promise<any[]>
}

export const REPORT_SERVICE_TOKEN = new Token<IReportService>(
  "IReportService"
);
