export interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  yearGraduating: number;
  email: string;
  acmEmail: string | null;
  githubUsername: string;
  discordUserId: string;
}

export interface WorkflowTaskPreview {
  taskId: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
}

export interface WorkflowPreview {
  confirmationId: string;
  summary: string;
  tasks: WorkflowTaskPreview[];
}
