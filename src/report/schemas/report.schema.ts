import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Date } from "mongoose";
import * as mongoose from 'mongoose';



export type ReportDocument= Document & Report; 


@Schema()
export class Report {

  @Prop({required:true})  
  reportName : string;

  @Prop({required:true})
  creationDate : Date;

  @Prop({required:true, type: mongoose.Schema.Types.ObjectId, ref:'Project' })
  associatedProject; 
}


  export const ReportSchema=SchemaFactory.createForClass(Report);
  export const ProjectModel=mongoose.models.Report || mongoose.model<Report>('Report',ReportSchema) ; 



