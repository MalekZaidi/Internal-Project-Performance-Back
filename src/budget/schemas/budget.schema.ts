// budget.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { Position } from "src/users/types/user-position.enum";

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Project' })
  projectId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  initialBudget: number;

  @Prop({ required: true })
  currentBudget: number;

  @Prop([{
    position: { type: String, enum: Object.values(Position), required: true },
    hourlyRate: { type: Number, required: true }
  }])
  rates: Array<{
    position: Position;
    hourlyRate: number;
  }>;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);