import { Service } from "typedi";
import  Task  from "@/models/task/task.model"; // Task model
import { Op, Sequelize } from "sequelize";
import { ITaskRepository } from "@/interfaces/task/ITaskRepository.interface";
import { EmployeeTimesheet, IProjectsHours, ITask, ITaskModification, MonthlyTasks, PhaseTimeline, PhaseTimelineFilters, PhaseTimelineInterval } from "@/types/task.type";
import Employee from "@/models/employee/employee.model";
import { HttpException } from "@/exceptions/HttpException";
import AllocationModel from "@/models/allocation/allocation.model";
import { IUtilization } from "@/types/employee.types";
import Project from "@/models/project/project.model";

@Service()
export class TaskRepository implements ITaskRepository {
  public async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const task = await Task.create(taskData);
    await this.calculateUtilization(taskData.employeeId);
    const project = await Project.findByPk(task.projectId);
    if (!project) return task.get({ plain: true });
    const phases = [...project.phases];
    const phaseIndex = phases.findIndex(p => p.id === task.phaseId);
    if (phaseIndex === -1) return task.get({ plain: true });
    const tasksInPhase = await Task.findAll({
        where: {
            projectId: task.projectId,
            phaseId: task.phaseId
        }
    });
    
    const totalTasks = tasksInPhase.length;
    const completedTasks = tasksInPhase.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
    phases[phaseIndex] = {
        ...phases[phaseIndex],
        numberOfTasks: tasksInPhase.length,
        completionRate:completionRate 
    };

    await project.update({ phases });

    return task.get({ plain: true });
}
  
  public async updateTask(taskData: Partial<ITask>): Promise<ITask> {
    const task = await Task.findByPk(taskData.id);
    if (!task) throw new Error("Task not found");    
    const prevEmployeeId = task.employeeId;
    await task.update(taskData);
    await this.calculateUtilization(prevEmployeeId);
    if (prevEmployeeId !== taskData.employeeId) {
      await this.calculateUtilization(taskData.employeeId);
    }
    
    return task.get({ plain: true });
  }
  
  public async deleteTask(id: number): Promise<void> {
    const task = await Task.findByPk(id);
    if (!task) throw new Error("Task not found");
    
    const employeeId = task.employeeId;
    const projectId = task.projectId;
    const phaseId = task.phaseId;
    
    await task.destroy();
    await this.calculateUtilization(employeeId);
    const project = await Project.findByPk(projectId);
    if (!project) return;

    const phases = [...project.phases];
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;
    const tasksInPhase = await Task.findAll({
        where: {
            projectId: projectId,
            phaseId: phaseId
        }
    });

    const totalTasks = tasksInPhase.length;
    const completedTasks = tasksInPhase.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
    phases[phaseIndex] = {
        ...phases[phaseIndex],
        numberOfTasks: totalTasks,
        completionRate: completionRate
    };

    await project.update({ phases });
}

    public adjustTimezone = (date: Date): Date => {
        const adjustedDate = new Date(date);
        adjustedDate.setHours(adjustedDate.getHours() + 2); 
        return adjustedDate;
      };


    public async getTasksByEmployee(employeeId: number): Promise<ITask[]> {
        return await Task.findAll({ 
            where: { employeeId },
            raw: true,
            order: [['taskTitle', 'ASC']]
        });
    }

    public async getTasksByProject(projectId: number): Promise<ITask[]> {
        return await Task.findAll({ 
            where: { projectId }, 
            raw: true,
            order: [['taskTitle', 'ASC']]
        });
    }

    public async getAllTasks(): Promise<ITask[]> {
        return await Task.findAll({
            raw: true,
            order: [['taskTitle', 'ASC']]
        });
    }



    public async getTaskById(id: number): Promise<ITask | null> {
        return await Task.findByPk(id, { raw: true });
    }

    public async getTasksByDateRange(startDate: Date, endDate: Date): Promise<ITask[]> {
        return await Task.findAll({
            where: {
                startDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            raw: true,
            order: [['startDate', 'ASC']]
        });
    }

    public async getTasksByEmployeeAndProject(employeeId: number, projectId: number): Promise<ITask[]> {
      return await Task.findAll({
          where: { employeeId, projectId },
          raw: true,
          order: [['taskDate', 'ASC']] 
      });
  }


  public async getTasksByPhaseId(phaseId: string): Promise<ITask[]> {
    return await Task.findAll({
        where: { phaseId },
        raw: true,
        order: [['taskDate', 'ASC']] 
    });
}

public async approveTask(approvalData: ITaskModification): Promise<ITask> {
  const task = await Task.findByPk(approvalData.taskId);
  if (!task) throw new Error("Task not found");
    await task.update({ status: 'completed', modifiedBy: approvalData.modifiedBy });
    await this.calculateUtilization(approvalData.employeeId);
  const project = await Project.findByPk(task.projectId);
  if (!project) throw new Error("Project not found");
  const phases = [...project.phases];
  const phaseIndex = phases.findIndex(p => p.id === task.phaseId);
  if (phaseIndex === -1) throw new Error(`Phase ${task.phaseId} not found`);
  const tasksInPhase = await Task.findAll({
      where: {
          projectId: task.projectId,
          phaseId: task.phaseId
      }
  });
  const totalTasks = tasksInPhase.length;
  const completedTasks = tasksInPhase.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
  phases[phaseIndex] = {
      ...phases[phaseIndex],
      numberOfTasks: totalTasks,
      completionRate: completionRate
  };
  await project.update({ phases });
  return task.get({ plain: true });
}

    public async rejectTask(rejectionData : ITaskModification): Promise<ITask> {
        const task = await Task.findByPk(rejectionData.taskId);
        if (!task) throw new Error("Task not found");
        await task.update({ status: 'rejected', reasonForRejection : rejectionData.reasonForRejection, modifiedBy : rejectionData.modifiedBy });
        return task.get({ plain: true });
    }

    public async getProjectHoursSummary(): Promise<IProjectsHours> {
        const result = await Task.findOne({
          attributes: [
            [Sequelize.fn('SUM', Sequelize.col('hours')), 'totalHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'pending' THEN hours ELSE 0 END)`), 'pendingHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'completed' THEN hours ELSE 0 END)`), 'completedHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'rejected' THEN hours ELSE 0 END)`), 'rejectedHours']
          ],
          raw: true
        });
      
        return {
          totalHours: Number(result?.totalHours || 0),
          pendingHours: Number(result?.pendingHours || 0),
          completedHours: Number(result?.completedHours || 0),
          rejectedHours: Number(result?.rejectedHours || 0)
        };
      }

      public async getEmployeeProjectHoursSummary(employeeId: string): Promise<IProjectsHours> {
        const result = await Task.findOne({
          attributes: [
            [Sequelize.fn('SUM', Sequelize.col('hours')), 'totalHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'pending' THEN hours ELSE 0 END)`), 'pendingHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'completed' THEN hours ELSE 0 END)`), 'completedHours'],
            [Sequelize.literal(`SUM(CASE WHEN status = 'rejected' THEN hours ELSE 0 END)`), 'rejectedHours']
          ],
          where: {
            employeeId: employeeId
          },
          raw: true
        });
      
        return {
          totalHours: Number(result?.totalHours || 0),
          pendingHours: Number(result?.pendingHours || 0),
          completedHours: Number(result?.completedHours || 0),
          rejectedHours: Number(result?.rejectedHours || 0)
        };
    }
     
  public async getTotalHoursByEmployee(employeeId: number): Promise<number> {
    const result = await Task.findOne({
        where: { employeeId },
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('hours')), 'totalHours']
        ],
        raw: true
    });
    return result?.actualHours || 0;
}
      

        public async getTaskTimeStatistics(): Promise<{
          today: { totalHours: number, average: number, completionRate: number, data: number[] },
          yesterday: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getDateRange = (daysOffset: number) => {
            const date = new Date();
            date.setDate(date.getDate() - daysOffset);
            date.setHours(0, 0, 0, 0);
            const start = new Date(date);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          };
      
          const getTimeBucket = (createdAt: Date) => {
            const adjustedDate = this.adjustTimezone(createdAt);
            const hours = adjustedDate.getHours();
            if (hours >= 9 && hours < 12) return 0;
            if (hours >= 12 && hours < 15) return 1;
            if (hours >= 15 && hours < 18) return 2;
            if (hours >= 18 && hours < 21) return 3;
            if (hours >= 21) return 4;
            return -1;
          };
      
          const processDay = async (daysOffset: number) => {
            const { start, end } = getDateRange(daysOffset);
            const tasks = await Task.findAll({
              where: { createdAt: { [Op.between]: [start, end] } },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = [0, 0, 0, 0, 0];
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const bucket = getTimeBucket(new Date(task.createdAt));
                if (bucket !== -1) {
                  data[bucket] += task.actualHours;
                }
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            today: await processDay(0),
            yesterday: await processDay(1)
          };
        }
      
        public async getWeeklyTaskStatistics(): Promise<{
          thisWeek: { totalHours: number, average: number, completionRate: number, data: number[] },
          lastWeek: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getWeekRange = (weeksOffset: number) => {
            const date = new Date();
            date.setDate(date.getDate() - (weeksOffset * 7));
            const dayOfWeek = date.getDay();
            const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const start = new Date(date.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          };
      
          const getDayIndex = (createdAt: Date) => {
            const adjustedDate = this.adjustTimezone(createdAt);
            const day = adjustedDate.getDay();
            return day === 0 ? 6 : day - 1;
          };
      
          const processWeek = async (weeksOffset: number) => {
            const { start, end } = getWeekRange(weeksOffset);          
            const tasks = await Task.findAll({
              where: { createdAt: { [Op.between]: [start, end] } },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = new Array(7).fill(0);
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const dayIndex = getDayIndex(new Date(task.createdAt));
                data[dayIndex] += task.actualHours;
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            thisWeek: await processWeek(0),
            lastWeek: await processWeek(1)
          };
        }
      
        public async getYearlyTaskStatistics(): Promise<{
          thisYear: { totalHours: number, average: number, completionRate: number, data: number[] },
          lastYear: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getYearRange = (yearOffset: number) => {
            const now = new Date();
            const year = now.getFullYear() - yearOffset;
            const start = new Date(year, 0, 1); 
            start.setHours(0, 0, 0, 0);
            const end = new Date(year, 11, 31); 
            end.setHours(23, 59, 59, 999);
            return { start, end, year };
          };
      
          const processYear = async (yearOffset: number) => {
            const { start, end, year } = getYearRange(yearOffset);
            const tasks = await Task.findAll({
              where: { createdAt: { [Op.between]: [start, end] } },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = new Array(12).fill(0);
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const taskDate = this.adjustTimezone(new Date(task.createdAt));
                if (taskDate.getFullYear() === year) {
                  const monthIndex = taskDate.getMonth();
                  data[monthIndex] += task.actualHours;
                }
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            thisYear: await processYear(0),
            lastYear: await processYear(1)
          };
        }
      
        public async getEmployeeTaskTimeStatistics(employeeId: number): Promise<{
          today: { totalHours: number, average: number, completionRate: number, data: number[] },
          yesterday: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getDateRange = (daysOffset: number) => {
            const date = new Date();
            date.setDate(date.getDate() - daysOffset);
            date.setHours(0, 0, 0, 0);
            const start = new Date(date);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          };
      
          const getTimeBucket = (createdAt: Date) => {
            const adjustedDate = this.adjustTimezone(createdAt);
            const hours = adjustedDate.getHours();
            if (hours >= 9 && hours < 12) return 0;
            if (hours >= 12 && hours < 15) return 1;
            if (hours >= 15 && hours < 18) return 2;
            if (hours >= 18 && hours < 21) return 3;
            if (hours >= 21) return 4;
            return -1;
          };
      
          const processDay = async (daysOffset: number) => {
            const { start, end } = getDateRange(daysOffset);
            const tasks = await Task.findAll({
              where: { 
                employeeId,
                createdAt: { [Op.between]: [start, end] }
              },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = [0, 0, 0, 0, 0];
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const bucket = getTimeBucket(new Date(task.createdAt));
                if (bucket !== -1) {
                  data[bucket] += task.actualHours;
                }
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            today: await processDay(0),
            yesterday: await processDay(1)
          };
        }
      
        public async getEmployeeWeeklyTaskStatistics(employeeId: number): Promise<{
          thisWeek: { totalHours: number, average: number, completionRate: number, data: number[] },
          lastWeek: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getWeekRange = (weeksOffset: number) => {
            const date = new Date();
            date.setDate(date.getDate() - (weeksOffset * 7));
            const dayOfWeek = date.getDay();
            const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const start = new Date(date.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          };
      
          const getDayIndex = (createdAt: Date) => {
            const adjustedDate = this.adjustTimezone(createdAt);
            const day = adjustedDate.getDay();
            return day === 0 ? 6 : day - 1;
          };
      
          const processWeek = async (weeksOffset: number) => {
            const { start, end } = getWeekRange(weeksOffset);          
            const tasks = await Task.findAll({
              where: { 
                employeeId,
                createdAt: { [Op.between]: [start, end] }
              },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = new Array(7).fill(0);
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const dayIndex = getDayIndex(new Date(task.createdAt));
                data[dayIndex] += task.actualHours;
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            thisWeek: await processWeek(0),
            lastWeek: await processWeek(1)
          };
        }
      
        public async getEmployeeYearlyTaskStatistics(employeeId: number): Promise<{
          thisYear: { totalHours: number, average: number, completionRate: number, data: number[] },
          lastYear: { totalHours: number, average: number, completionRate: number, data: number[] }
        }> {
          const getYearRange = (yearOffset: number) => {
            const now = new Date();
            const year = now.getFullYear() - yearOffset;
            const start = new Date(year, 0, 1); 
            start.setHours(0, 0, 0, 0);
            const end = new Date(year, 11, 31); 
            end.setHours(23, 59, 59, 999);
            return { start, end, year };
          };
      
          const processYear = async (yearOffset: number) => {
            const { start, end, year } = getYearRange(yearOffset);
            const tasks = await Task.findAll({
              where: { 
                employeeId,
                createdAt: { [Op.between]: [start, end] }
              },
              raw: true
            });
      
            let totalHours = 0;
            let completedTasks = 0;
            let totalTaskCount = 0;
            const data = new Array(12).fill(0);
      
            tasks.forEach(task => {
              totalHours += task.actualHours;
              totalTaskCount++;
      
              if (task.status === 'completed') {
                completedTasks++;
                const taskDate = this.adjustTimezone(new Date(task.createdAt));
                if (taskDate.getFullYear() === year) {
                  const monthIndex = taskDate.getMonth();
                  data[monthIndex] += task.actualHours;
                }
              }
            });
      
            return {
              totalHours,
              average: totalTaskCount > 0 ? totalHours / totalTaskCount : 0,
              completionRate: totalTaskCount > 0 ? (completedTasks / totalTaskCount) * 100 : 0,
              data
            };
          };
      
          return {
            thisYear: await processYear(0),
            lastYear: await processYear(1)
          };
        }
        

        public async calculateUtilization(employeeId: number): Promise<IUtilization> {
          try {
            const [tasks, allocations] = await Promise.all([
              Task.findAll({
                where: { 
                  employeeId,
                  status: 'completed'
                },
                raw: true
              }),
              AllocationModel.findAll({
                where: { employeeId },
                raw: true
              })
            ]);
        
            const utilizationMap: {
              [year: number]: {
                [month: string]: {
                  [week: string]: { actual: number; allocated: number }
                }
              }
            } = {};
        
            // Pre-process allocations into weekly buckets
            const allocationMap = new Map<string, number>();
            for (const allocation of allocations) {
              const start = new Date(allocation.start);
              const end = new Date(allocation.end);
              const weeks = this.getWeeksBetweenDates(start, end);
              const weeklyHours = Number(allocation.hoursWeek) || 0;
              
              // Distribute allocation hours evenly across weeks
              const hoursPerWeek = weeklyHours / weeks;
              
              let current = new Date(start);
              while (current <= end) {
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const week = this.getWeekOfMonth(current);
                const key = `${year}-${month}-${week}`;
        
                allocationMap.set(key, (allocationMap.get(key) || 0) + hoursPerWeek);
                
                current.setDate(current.getDate() + 7);
              }
            }
        
            // Process tasks
            for (const task of tasks) {
              const taskDate = new Date(task.taskDate);
              const year = taskDate.getFullYear();
              const month = String(taskDate.getMonth() + 1).padStart(2, '0');
              const week = this.getWeekOfMonth(taskDate);
              const key = `${year}-${month}-${week}`;
        
              // Initialize structure
              if (!utilizationMap[year]) utilizationMap[year] = {};
              if (!utilizationMap[year][month]) utilizationMap[year][month] = {};
              if (!utilizationMap[year][month][week]) {
                utilizationMap[year][month][week] = { 
                  actual: 0, 
                  allocated: allocationMap.get(key) || 0 
                };
              }
        
              // Accumulate actual hours
              utilizationMap[year][month][week].actual += Number(task.actualHours) || 0;
            }
        
            // Convert to IUtilization format and calculate percentages
            const utilization: IUtilization = {};
            for (const [yearStr, months] of Object.entries(utilizationMap)) {
              const year = Number(yearStr);
              utilization[year] = {};
              
              for (const [month, weeks] of Object.entries(months)) {
                utilization[year][month] = { 
                  week1: 0, 
                  week2: 0, 
                  week3: 0, 
                  week4: 0 
                };
        
                for (const [week, data] of Object.entries(weeks)) {
                  const weekNumber = Number(week);
                  if (weekNumber > 4) continue; // Only support up to week4
        
                  const weekKey = `week${weekNumber}` as keyof typeof utilization[number][string];
                  const utilizationPercent = data.allocated > 0 
                    ? Math.min((data.actual / data.allocated) * 100, 100)
                    : 0;
        
                  utilization[year][month][weekKey] = Number(utilizationPercent.toFixed(1));
                }
              }
            }
        
            // Update employee record
            await Employee.update(
              { utilization },
              { where: { id: employeeId } }
            );
        
            return utilization;
        
          } catch (error) {
            console.error('Utilization calculation error:', error);
            throw new HttpException(500, 'Failed to calculate utilization');
          }
        }
        
        // Helper to get number of weeks between dates
        private getWeeksBetweenDates(start: Date, end: Date): number {
          const msPerWeek = 1000 * 60 * 60 * 24 * 7;
          return Math.ceil((end.getTime() - start.getTime()) / msPerWeek);
        }
        
        // Improved week of month calculation
        private getWeekOfMonth(date: Date): number {
          const start = new Date(date);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
        
          const day = date.getDay() || 7; // Convert Sunday to 7
          const diff = date.getDate() - start.getDate() + ((start.getDay() || 7) - day);
          return Math.ceil((diff + 1) / 7);
        }

        
        public async getPhaseTimeline(filters: PhaseTimelineFilters): Promise<PhaseTimeline[]> {
          const project = await Project.findByPk(filters.projectId);
          if (!project) throw new HttpException(404, "Project not found");
      
          // Filter phases if specified
          const phases = project.phases.filter(p => 
              !filters.phaseIds || filters.phaseIds.includes(p.id)
          );
      
          // Process each phase
          const timelineData = await Promise.all(phases.map(async (phase) => {
              const tasks = await Task.findAll({
                  where: {
                      phaseId: phase.id,
                      projectId: project.id
                  },
                  attributes: ['createdAt', 'updatedAt', 'status'],
                  raw: true
              });
      
              // Get interval days based on filter
              const intervalDays = this.getDaysFromInterval(filters.interval || 'biweekly');
      
              // Generate intervals based on selected interval
              const intervals = this.generateIntervals(
                  new Date(phase.startDate),
                  new Date(phase.endDate),
                  filters.startDate ? new Date(filters.startDate) : undefined,
                  filters.endDate ? new Date(filters.endDate) : undefined,
                  intervalDays
              );
      
              // Calculate completion rates for each interval
              const dataPoints = intervals.map(interval => {
                  const relevantTasks = tasks.filter(task => {
                      const taskCreated = new Date(task.createdAt);
                      const taskUpdated = new Date(task.updatedAt);
                      return taskCreated <= interval.endDate && 
                             taskUpdated <= interval.endDate;
                  });
      
                  const totalTasks = relevantTasks.length;
                  const completedTasks = relevantTasks.filter(t => t.status === 'completed').length;
                  
                  return {
                      date: interval.endDate.toISOString().split('T')[0],
                      completionRate: totalTasks > 0 
                          ? Math.round((completedTasks / totalTasks) * 100)
                          : 0
                  };
              });
      
              return {
                  phaseId: phase.id,
                  phaseName: phase.name,
                  data: dataPoints
              };
          }));
      
          return timelineData;
      }
      
      // Add interval to days conversion
      private getDaysFromInterval(interval: PhaseTimelineInterval): number {
          switch(interval) {
              case 'weekly': return 7;
              case 'biweekly': return 15;
              case 'monthly': return 30;
              default: return 15; // default to biweekly
          }
      }
      
      // Update generateIntervals to use dynamic interval
      private generateIntervals(
          phaseStart: Date,
          phaseEnd: Date,
          filterStart?: Date,
          filterEnd?: Date,
          intervalDays: number = 15 // Default to biweekly
      ): { startDate: Date; endDate: Date }[] {
          const intervals = [];
          let currentStart = new Date(Math.max(phaseStart.getTime(), (filterStart || phaseStart).getTime()));
          const finalEnd = filterEnd 
              ? Math.min(phaseEnd.getTime(), filterEnd.getTime()) 
              : phaseEnd.getTime();
      
          while (currentStart.getTime() <= finalEnd) {
              const currentEnd = new Date(currentStart);
              currentEnd.setDate(currentEnd.getDate() + intervalDays);
              
              if (currentEnd.getTime() > finalEnd) {
                  intervals.push({
                      startDate: new Date(currentStart),
                      endDate: new Date(finalEnd)
                  });
                  break;
              }
      
              intervals.push({
                  startDate: new Date(currentStart),
                  endDate: currentEnd
              });
      
              currentStart = new Date(currentEnd);
              currentStart.setDate(currentStart.getDate() + 1);
          }
      
          return intervals;
      }



     }



