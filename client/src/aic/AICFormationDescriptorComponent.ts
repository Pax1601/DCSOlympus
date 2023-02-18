interface ComponentInterface {
    "label"    : string;
    "value"    : string;
}

export class AICFormationDescriptorComponent implements ComponentInterface {

    label = "(not set)";
    value = "(not set)";

    constructor( value:any, label?:string ) {

        this.label = label || "(not set)";
        this.value = value;

    }

}