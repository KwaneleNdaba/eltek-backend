import { EmployeeTimesheet, IProjectsHours, ITask, ITaskModification, MonthlyTasks } from "@/types/task.type";

export interface ITaskRepository {

    createTask(taskData: Partial<ITask>): Promise<ITask>;
    updateTask(taskData: Partial<ITask>): Promise<ITask>;
    getTasksByEmployee(employeeId: number): Promise<ITask[]>; 
    getTasksByProject(projectId: number): Promise<ITask[]>; 
    getAllTasks(): Promise<ITask[]>;
    deleteTask(id: number): Promise<void>;

    getTaskById(id: number): Promise<ITask | null>; 
    getTasksByDateRange(startDate: Date, endDate: Date): Promise<ITask[]>; 
    getTasksByEmployeeAndProject(employeeId: number, projectId: number): Promise<ITask[]>;
    getTotalHoursByEmployee(employeeId: number): Promise<number>; 
    getTaskSummary(employeeId: number, startDate: Date, endDate: Date): Promise<{ projectId: number; totalHours: number }[]>;
    approveTask(approvalData: ITaskModification): Promise<ITask>;
    rejectTask(rejectionData : ITaskModification): Promise<ITask>; 
    getProjectHoursSummary(): Promise<IProjectsHours>;
    getCurrentWeekHours(projectId: number): Promise<EmployeeTimesheet[]>
    getEmployeeMonthlyTasks(
      projectId: number,
      employeeId: number,
      year: number,
      month: number
    ): Promise<MonthlyTasks>
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
