import { EmployeeTimesheet, IProjectsHours, ITask, ITaskModification, MonthlyTasks, PhaseTimeline, PhaseTimelineFilters } from "@/types/task.type";

export interface ITaskRepository {

    createTask(taskData: Partial<ITask>): Promise<ITask>;
    updateTask(taskData: Partial<ITask>): Promise<ITask>;
    getTasksByEmployee(employeeId: number): Promise<ITask[]>; 
    getTasksByProject(projectId: number): Promise<ITask[]>; 
    getAllTasks(): Promise<ITask[]>;
    deleteTask(id: number): Promise<void>;
 getPhaseTimeline(filters: PhaseTimelineFilters): Promise<PhaseTimeline[]>
    getTaskById(id: number): Promise<ITask | null>; 
    getTasksByDateRange(startDate: Date, endDate: Date): Promise<ITask[]>; 
    getTasksByEmployeeAndProject(employeeId: number, projectId: number): Promise<ITask[]>;
    getTotalHoursByEmployee(employeeId: number): Promise<number>; 
    approveTask(approvalData: ITaskModification): Promise<ITask>;
    rejectTask(rejectionData : ITaskModification): Promise<ITask>; 
    getProjectHoursSummary(): Promise<IProjectsHours>;
    getTasksByPhaseId(phaseId: string): Promise<ITask[]> 

    getTaskTimeStatistics(): Promise<{
      today: { totalHours: number, average: number, completionRate: number, data: number[] },
      yesterday: { totalHours: number, average: number, completionRate: number, data: number[] }
  }>
  getWeeklyTaskStatistics(): Promise<{
    thisWeek: { totalHours: number, average: number, completionRate: number, data: number[] },
    lastWeek: { totalHours: number, average: number, completionRate: number, data: number[] }
}> 
getYearlyTaskStatistics(): Promise<{
  thisYear: { totalHours: number, average: number, completionRate: number, data: number[] },
  lastYear: { totalHours: number, average: number, completionRate: number, data: number[] }
}>


getEmployeeTaskTimeStatistics(employeeId:number): Promise<{
  today: { totalHours: number, average: number, completionRate: number, data: number[] },
  yesterday: { totalHours: number, average: number, completionRate: number, data: number[] }
}>
getEmployeeWeeklyTaskStatistics(employeeId:number): Promise<{
  thisWeek: { totalHours: number, average: number, completionRate: number, data: number[] },
  lastWeek: { totalHours: number, average: number, completionRate: number, data: number[] }
}>
getEmployeeYearlyTaskStatistics(employeeId:number): Promise<{
  thisYear: { totalHours: number, average: number, completionRate: number, data: number[] },
  lastYear: { totalHours: number, average: number, completionRate: number, data: number[] }
}>
 getEmployeeProjectHoursSummary(employeeId: string): Promise<IProjectsHours>
}
