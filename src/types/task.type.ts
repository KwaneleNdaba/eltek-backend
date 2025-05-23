export type ITask = {
  id?: number;
  employeeName: string;
  employeeId: number;
  position: string;
  phaseId: string;
  createdBy: number;
  taskTitle: string;
  isSubmitted: boolean;
  taskDescription: string;
  phase : string ;
  estimatedHours : number;
  actualHours : number;
  comment?: IComment
  status: "pending" | "in-progress" | "completed" | "rejected";
  reasonForRejection?: string;
  taskDate: Date;
  modifiedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ITaskModification = {
  taskId: number;
  reasonForRejection?: string;
  modifiedBy: number;
  employeeId?: number
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
};

export type TimeTrackingReport = {
  today: TimeTrackingStats;
  yesterday: TimeTrackingStats;
};


export type IComment = {
  documments : string[];
  comment : string
}


// Add interval type
export type PhaseTimelineInterval = 'weekly' | 'biweekly' | 'monthly';

export type PhaseTimeline = {
  phaseId: string;
  phaseName: string;
  data: {
    date: string;
    completionRate: number;
  }[];
};

export type PhaseTimelineFilters = {
  projectId: number;
  phaseIds?: string[];
  startDate?: string;
  endDate?: string;
  interval?: PhaseTimelineInterval; // Add interval filter
};