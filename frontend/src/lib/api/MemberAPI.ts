import type { MemberPayload, MemberPatches } from '@/lib/types/apiRequests';
import type { Member, WorkflowPreview } from '@/lib/types/apiResponses';
import axios from '@/lib/clients/axios';
import config from '@/lib/config';

/**
 * Get all members
 * @returns List of all members
 */
export const getAllMembers = async (): Promise<Member[]> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}`;
  const response = await axios.get<Member[]>(requestUrl);
  return response.data;
};

/**
 * Get a single member
 * @param id Member ID
 * @returns The member
 */
export const getMember = async (id: number): Promise<Member> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}/${id}`;
  const response = await axios.get<Member>(requestUrl);
  return response.data;
};

/**
 * Preview the workflow tasks that would run when creating a member
 * @param member Member to be created
 * @returns Workflow preview with a confirmation ID
 */
export const previewCreateMember = async (member: MemberPayload): Promise<WorkflowPreview> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.previewCreate}`;
  const response = await axios.post<WorkflowPreview>(requestUrl, member);
  return response.data;
};

/**
 * Preview the workflow tasks that would run when updating a member
 * @param id Member ID
 * @param patches Member changes
 * @returns Workflow preview with a confirmation ID
 */
export const previewUpdateMember = async (
  id: number,
  patches: MemberPatches,
): Promise<WorkflowPreview> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}/${id}/preview`;
  const response = await axios.post<WorkflowPreview>(requestUrl, patches);
  return response.data;
};

/**
 * Preview the workflow tasks that would run when deleting a member
 * @param id Member ID
 * @returns Workflow preview with a confirmation ID
 */
export const previewDeleteMember = async (id: number): Promise<WorkflowPreview> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}/${id}/delete-preview`;
  const response = await axios.post<WorkflowPreview>(requestUrl);
  return response.data;
};

/**
 * Create a member
 * @param member Member to be created
 * @param confirmationId Workflow confirmation ID from a preview
 * @returns The created member
 */
export const createMember = async (
  member: MemberPayload,
  confirmationId?: string,
): Promise<Member> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}`;
  const response = await axios.post<Member>(requestUrl, member, {
    headers: confirmationId
      ? { [config.header.workflowConfirmation]: confirmationId }
      : undefined,
  });
  return response.data;
};

/**
 * Update a member
 * @param id Member ID
 * @param patches Member changes
 * @param confirmationId Workflow confirmation ID from a preview
 * @returns The updated member
 */
export const updateMember = async (
  id: number,
  patches: MemberPatches,
  confirmationId?: string,
): Promise<Member> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}/${id}`;
  const response = await axios.patch<Member>(requestUrl, patches, {
    headers: confirmationId
      ? { [config.header.workflowConfirmation]: confirmationId }
      : undefined,
  });
  return response.data;
};

/**
 * Delete a member
 * @param id Member ID
 * @param confirmationId Workflow confirmation ID from a preview
 */
export const deleteMember = async (id: number, confirmationId?: string): Promise<void> => {
  const requestUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}/${id}`;
  await axios.delete(requestUrl, {
    headers: confirmationId
      ? { [config.header.workflowConfirmation]: confirmationId }
      : undefined,
  });
};
