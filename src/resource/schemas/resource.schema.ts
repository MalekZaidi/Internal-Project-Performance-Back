import { Prop, Schema } from "@nestjs/mongoose";
import * as mongoose from "mongoose";


export type RessourceDocument = Document & Resource ; 

@Schema()
export class Resource {

    @Prop({required:true})
    resourceName : string

    @Prop({required : true})
    quantity: Number;
    
    @Prop({type:mongoose.Schema.Types.ObjectId})
    associatedProject: mongoose.ObjectId;

    @Prop({type:Boolean})
    isAvailable: Boolean;

}










