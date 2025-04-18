import { HttpException } from "@/exceptions/HttpException";
import { Op } from "sequelize";
import { Service } from "typedi";
import AllocationModel from "@/models/allocation/allocation.model";
import Employee from "@/models/employee/employee.model";
import Project from "@/models/project/project.model";
import { Allocation } from "@/types/employee.types";
import { IAllocationRepository } from "@/interfaces/allocation/IAllocationRepository.interface";

@Service()
export class AllocationRepository implements IAllocationRepository {
  public async createAllocation(allocationData: Partial<Allocation>): Promise<Allocation> {
    try {
      // Ensure phases is present and an array
      if (!allocationData.phases || !Array.isArray(allocationData.phases)) {
        throw new HttpException(400, "Phases must be a non-empty array");
      }
  
      // Normalize phases before saving
      const normalizedPhases = JSON.stringify([...allocationData.phases].sort());
  
      // Add normalizedPhases to the data
      const allocation = await AllocationModel.create({
        ...allocationData,
        normalizedPhases
      });
  
      return allocation.get({ plain: true });
  
    } catch (error) {
      console.error("Create allocation error:", error);
      throw new HttpException(500, "Error creating allocation");
    }
  }
  

  public async getAllocationById(id: number): Promise<Allocation | null> {
    return await AllocationModel.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ],
      raw: true
    });
  }

  public async updateAllocation(id: number, updates: Partial<Allocation>): Promise<Allocation> {
    const allocation = await AllocationModel.findByPk(id);
    if (!allocation) throw new HttpException(404, "Allocation not found");
    
    await allocation.update(updates);
    return allocation.get({ plain: true });
  }

  public async deleteAllocation(id: number): Promise<void> {
    const allocation = await AllocationModel.findByPk(id);
    if (!allocation) throw new HttpException(404, "Allocation not found");
    
    await allocation.destroy();
  }

  public async getEmployeeAllocations(employeeId: number): Promise<Allocation[]> {
    return await AllocationModel.findAll({
      where: { employeeId },
      include: [{ model: Project, as: 'project' }],
      raw: true
    });
  }

  public async getProjectAllocations(projectId: number): Promise<Allocation[]> {
    return await AllocationModel.findAll({
      where: { projectId },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: { exclude: ['password'] }, // Exclude sensitive fields
        include: [{
          model: AllocationModel,
          as: 'allocations',
          attributes: [
            'id',
            'projectName',
            'employeeId',
            'projectId',
            'phases',
            'start',
            'end',
            'hoursWeek',
            'status',
            'chargeOutRate',
            'chargeType',
            'createdAt',
            'updatedAt'
          ]
        }]
      }]   
    });
  }

  public async findExistingAllocation(
    employeeId: number,
    projectId: number,
    phases: string[]
  ): Promise<Allocation | null> {
    const normalizedPhases = JSON.stringify([...phases].sort());
  
    return await AllocationModel.findOne({
      where: {
        employeeId,
        projectId,
        normalizedPhases
      },
      raw: true
    });
  }
  
  
}