import { Service } from "typedi";
import { IProjectRepository } from "@/interfaces/project/IProjectRepository.interface";
import Project from "@/models/project/project.model";
import Employee from "@/models/employee/employee.model"; 
import EmployeeProject from "@/models/employee/projectEmployees.model";
import { HttpException } from "@/exceptions/HttpException";
import { Op, Transaction } from "sequelize";
import { IProject, ProjectStatus } from "@/types/project.types";

type UpdateProjectData = Partial<IProject> & { id: number };

@Service()
export class ProjectRepository implements IProjectRepository {
  public async createProject(projectData: IProject): Promise<IProject> {
    try {
      const project = await Project.create(projectData);
      return project.get({ plain: true }) as IProject;
    } catch (error) {
      throw new HttpException(500, "Error creating project");
    }
  }

  public async getProjectByName(name: string): Promise<IProject | null> {
    return await Project.findOne({ 
      where: { name }, 
      raw: true 
    }) as IProject | null;
  }

  public async updateProject(projectData: UpdateProjectData): Promise<IProject> {
    const transaction = await Project.sequelize!.transaction();
    
    try {
      const project = await Project.findByPk(projectData.id, { transaction });
      if (!project) throw new HttpException(404, "Project not found");
      
      await project.update(projectData, { transaction });
      await transaction.commit();
      
      return project.get({ plain: true }) as IProject;
    } catch (error) {
      await transaction.rollback();
      throw error instanceof HttpException 
        ? error 
        : new HttpException(500, "Error updating project");
    }
  }

  public async getAllProjects(): Promise<IProject[]> {
    try {
      const projects = await Project.findAll({
        order: [['createdAt', 'DESC']],
        raw: true
      });
      return projects as IProject[];
    } catch (error) {
      throw new HttpException(500, "Error fetching projects");
    }
  }

  public async getProjectById(projectId: number): Promise<IProject | null> {
    try {
      const project = await Project.findByPk(projectId, {           
        raw: true,
        nest: true
      });
      return project as IProject | null;
    } catch (error) {
      throw new HttpException(500, "Error fetching project");
    }
  }

  public async getProjectsByEmployee(employeeId: number): Promise<IProject[]> {
    try {
      const employeeProjects = await EmployeeProject.findAll({
        where: { employeeId },
        include: [{
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'description', 'duration', 'budget', 'startDate', 'endDate', 'status']
        }]
      });
    
      if (!employeeProjects.length) {
        throw new HttpException(404, "No projects assigned to this employee");
      }
    
      return employeeProjects.map(ep => ep.get('project') as IProject);
    } catch (error) {
      throw error instanceof HttpException 
        ? error 
        : new HttpException(500, "Error fetching employee projects");
    }
  }

  public async activeProject(projectData: UpdateProjectData): Promise<IProject> {
    const transaction = await Project.sequelize!.transaction();
  
    try {
      const project = await Project.findOne({ 
        where: { name: projectData.name },
        transaction
      });
  
      if (!project) {
        throw new HttpException(404, "Project not found");
      }
  
      await project.update(projectData, { transaction });
      await transaction.commit();
      
      return project.get({ plain: true }) as IProject;
    } catch (error) {
      await transaction.rollback();
      throw error instanceof HttpException
        ? error
        : new HttpException(500, "Error updating project");
    }
  }
      
  public async deleteProject(projectId: number): Promise<void> {
    const transaction = await Project.sequelize!.transaction();
    
    try {
      const project = await Project.findByPk(projectId, { transaction });
      if (!project) {
        throw new HttpException(404, "Project not found");
      }    
      
      await EmployeeProject.destroy({
        where: { projectId },
        transaction
      });    
      
      const assignedEmployees = await EmployeeProject.findAll({
        attributes: ['employeeId'],
        where: { projectId },
        transaction
      });

      const employeeIds = assignedEmployees.map(e => e.employeeId);
      
      if (employeeIds.length > 0) {
        const employeesWithNoOtherProjects = await Employee.findAll({
          where: {
            id: employeeIds,
            [Op.not]: {
              id: {
                [Op.in]: await EmployeeProject.findAll({
                  attributes: ['employeeId'],
                  where: {
                    employeeId: employeeIds,
                    projectId: { [Op.ne]: projectId }
                  },
                  transaction
                }).then(res => res.map(r => r.employeeId))
              }
            }
          },
          transaction
        });
        
        if (employeesWithNoOtherProjects.length > 0) {
          await Employee.update(
            { assigned: false },
            {
              where: { id: employeesWithNoOtherProjects.map(e => e.id) },
              transaction
            }
          );
        }
      }

      await project.update({ status: "cancelled" }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error instanceof HttpException 
        ? error 
        : new HttpException(500, "Error deleting project");
    }
  }
}