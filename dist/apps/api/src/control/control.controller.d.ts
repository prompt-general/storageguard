import { ControlService } from './control.service';
export declare class ControlController {
    private readonly controlService;
    constructor(controlService: ControlService);
    findAll(): Promise<Control[]>;
    findOne(id: string): Promise<any>;
}
