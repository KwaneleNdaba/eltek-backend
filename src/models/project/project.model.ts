import { Allocation } from '@/types/employee.types';
import { DataTypes, Model, Optional } from 'sequelize';
import { Sequelize } from 'sequelize';
import User from '../user/user.model';
import Employee from '../employee/employee.model';
import { IEstimatedCost, IProject, PauseLog, Phase, ProjectStatus, Role } from '@/types/project.types';
import Task from '../task/task.model';
import Client from '../client/client.model';

type ProjectCreationAttributes = Optional<IProject, 'id' | 'createdAt' | 'updatedAt'>;

class Project extends Model<IProject, ProjectCreationAttributes> implements IProject {
  public id: number;
  public name!: string;
  public description!: string;
  public status!: ProjectStatus;
  public startDate!: Date;
  public endDate!: Date;
  public estimatedCost?: IEstimatedCost;
  public budget!: number;
  public duration!: number;
  public clientName!: string;
  public clientEmail!: string;
  public clientId!:number;
  public clientCompany!: string;
  public isPaused!: boolean;
  public lastPausedAt?: Date | null;
  public pauseHistory!: PauseLog[];
  public phases!: Phase[];
  public resources!: Role[];
  public createdAt!: Date;
  public updatedAt!: Date;
  public createdBy!: number;

  public readonly employees?: Employee[];
  public readonly allocations!: Allocation[];
  public readonly tasks!: Task[];

  static initialize(sequelize: Sequelize) {
    Project.init(
      {
        id: { 
          type: DataTypes.INTEGER, 
          autoIncrement: true, 
          primaryKey: true 
        },
        name: { 
          type: DataTypes.STRING, 
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true
          }
        },
        description: { 
          type: DataTypes.TEXT, 
          allowNull: false 
        },
        status: {
          type: DataTypes.ENUM('planned', 'on going', 'cancelled', 'completed', 'on hold'),
          defaultValue: 'planned',
          allowNull: false
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            isDate: true
          }
        },
        endDate: { 
          type: DataTypes.DATEONLY,
          allowNull: false, 
          validate: {
            isDate: true,
            isAfterStartDate(value: Date) {
              if (value && this.startDate && value < this.startDate) {
                throw new Error('End date must be after start date');
              }
            }
          }
        },
        budget: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0
          }
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: false, 
          validate: {
            min: 0
          }
        },
        estimatedCost: { 
          type: DataTypes.JSON, 
          allowNull: true,
          defaultValue: {}, 
        },
        clientId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model:"clients",
            key: "id",
          },
        },
        clientName: {
          type: DataTypes.STRING,
          allowNull: false
        },
        clientEmail: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isEmail: true
          }
        },
        clientCompany: {
          type: DataTypes.STRING,
          allowNull: false
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: User,
            key: 'id'
          }
        },
        phases: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: []
        },
        resources: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: []
        },
    
        pauseHistory: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [] 
        },
        isPaused: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        lastPausedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      { 
        sequelize,
        modelName: 'Project',
        timestamps: true
      }
    );
  }
}

export default Project;