import "reflect-metadata";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { NODE_ENV, PORT, LOG_FORMAT } from "@config";
import dbConnection from "./database"; 
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware";
import { logger, stream } from "./utils/logger";
import Container from "typedi";
import { AUTH_SERVICE_TOKEN } from "./interfaces/auth/IAuthService.interface";
import { AuthService } from "./services/auth/auth.service";
import { AuthRepository } from "./repositories/auth/auth.repository";
import { Routes } from "./types/routes.interface";
import { PROJECT_SERVICE_TOKEN } from "./interfaces/project/IProjectService";
import { ProjectRepository } from "./repositories/project/project.repository";
import { ProjectService } from "./services/project/project.service";
import { TASK_SERVICE_TOKEN } from "./interfaces/task/ITaskService.interface";
import { EMPLOYEE_SERVICE_TOKEN } from "./interfaces/employee/IEmployeeService";
import { EmployeeService } from "./services/employee/employee.service";
import { EmployeeRepository } from "./repositories/employee/employee.repository";
import { LEAVE_SERVICE_TOKEN } from "./interfaces/leave/ILeaveService.interface";
import { TaskService } from "./services/project/task.service";
import { TaskRepository } from "./repositories/project/task.repository";

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || "development";
    this.port = PORT || 3000;

    this.initializeInterfaces();
    this.connectToDatabase();

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 Identity Service listening on port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  public async connectToDatabase() {
    try {
      await dbConnection.authenticate();
      logger.info("Database connection established successfully.");
      console.log("Database connection established successfully.");


      await dbConnection.sync({ force: false }); 
      logger.info("Database tables synced successfully.");
    } catch (error) {
      logger.error("Unable to connect to the database:", error);
      process.exit(1); 
    }
  }

  private corsOptions = {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization"],
    credentials: true, 
  };

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    this.app.use(cors(this.corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser("X2nL0%@1kF9gB8yV7!pA&j5zZ0HgRpR4H"));
  }


  private initializeInterfaces() {
    Container.set(
      AUTH_SERVICE_TOKEN,
      new AuthService(Container.get(AuthRepository))
    );
    Container.set(
      PROJECT_SERVICE_TOKEN,
      new ProjectService(Container.get(ProjectRepository))
    );
   
    Container.set(
      TASK_SERVICE_TOKEN,
      new TaskService(Container.get(TaskRepository))
    );
    Container.set(
      EMPLOYEE_SERVICE_TOKEN,
      new EmployeeService(Container.get(EmployeeRepository))
    );
    Container.set(
      LEAVE_SERVICE_TOKEN,
      new EmployeeService(Container.get(EmployeeRepository))
    );
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use("/api", route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
