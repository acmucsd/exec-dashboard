import { Member } from "../../../types/Member";
import { WorkflowContext } from "./WorkflowContext";
import { TaskId, TaskRegistry } from "../taskRegistry";

export interface WorkflowStepDefinition {
    taskId: TaskId;
    next?: WorkflowStepDefinition[];
}

export class WorkflowDefinition {
    constructor(
        public readonly steps: WorkflowStepDefinition[],
    ) {}

    instantiate(): Workflow {
        return new Workflow(this.steps);
    }
}

export class Workflow {
    private context: WorkflowContext;

    constructor(
        private workflowSteps: WorkflowStepDefinition[],
    ) {}

    async run(member: Member) {
        this.context = {
            member,
            secrets: {}
        };
        await Promise.all(this.workflowSteps.map(step => this.executeStep(step)));
    }

    private async executeStep(step: WorkflowStepDefinition): Promise<void> {
        const task = TaskRegistry.getTask(step.taskId);
        const result = await task.run(this.context);

        if (!result.success) {
            throw result.error ?? new Error(result.feedback);
        }

        // patch the context if needed
        if (result.memberPatch) { Object.assign(this.context.member, result.memberPatch); }
        if (result.secretsPatch) { this.context.secrets = { ...this.context.secrets, ...result.secretsPatch }; }

        if (step.next) {
            await Promise.all(step.next.map(next => this.executeStep(next)));
        }
    }
}