import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose"
export type RiskDocument = Document & Risk;

@Schema()
export class Risk {

        @Prop({required:true})
        name: string;

        @Prop({required:true})
        description : string;


        @Prop()
        probability : mongoose.Double;

}

export const RiskSchema= SchemaFactory.createForClass(Risk);
export const RiskModel =mongoose.models.Risk || mongoose.model<Risk>('Risk',RiskSchema);