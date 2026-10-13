export type KartanaAssignResponse = {
  success: string;
  error?: string;
};

export type KartanaAssignPreviewResponse = {
  message: string;
  assigned: string[];
  unAssigned: string[];
};
