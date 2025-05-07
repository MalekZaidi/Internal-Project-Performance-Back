import { PartialType } from "@nestjs/mapped-types";
import { CreateTaskDto } from "./create-task.dto";

 

 export class UpdateTaskDTO extends PartialType(CreateTaskDto) {




 }