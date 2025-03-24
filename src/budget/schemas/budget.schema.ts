import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import * as mongoose from "mongoose"

export type BudgetDocument = Document & Budget ;

@Schema()
export class Budget { 

    @Prop({required: true})
    initialBudget:Number;

    @Prop({required: true})
    actualBudget : Number;

    @Prop({required:true, type:mongoose.Schema.Types. ObjectId })
    associatedProject : mongoose.ObjectId;  
}
export const BudgetSchema=SchemaFactory.createForClass(Budget);