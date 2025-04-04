export type ITask = {
  id?: number;
  employeeName: string;
  employeeId: number;
  position: string;
  taskTitle: string;
  taskDescription: string;
  hours: number;
  status: "pending" | "in-progress" | "completed" | "rejected";
  reasonForRejection?: string;
  modifiedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ITaskModification = {
  taskId: number;
  reasonForRejection?: string;
  modifiedBy: number;
};

export type IProjectsHours = {
  totalHours: number;
  pendingHours: number;
  completedHours: number;
  rejectedHours: number;
};

export interface TimesheetEntry {
  timesheet_id: string;
  name: string;
  work_date: string;
  description: string;
  hours_worked: string;
  status: string;
}

export type Week = {
  week_number: number;
  timesheets: TimesheetEntry[];
};
export type EmployeeTimesheet = {
  projectId: number;
  employeeId: number;
  employeeName: string;
  email: string;
  position: string;
  days: Record<string, number>;
};

export type MonthlyTasks = {
  totalHours: number;
  rate: number;
  totalCost: number;
  tasks: Array<{
    id: number;
    taskTitle: string;
    taskDescription: string;
    hours: number;
    position: string;
    employeeName: string;
    status: string;
    date: string;
  }>;
};



export type TimeTrackingStats = {
  totalHours: number;
  averageHoursDaily: number;
  completionRate: number;
  data: number[];
}

export type TimeTrackingReport = {
  today: TimeTrackingStats;
  yesterday: TimeTrackingStats;
}
