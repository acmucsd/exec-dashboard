import type {
  Member,
  MemberForm,
  MemberSnapshot,
  SnapshotApplyResult,
  SnapshotPreview,
  WorkflowPreview,
} from "../types";

import config from "@/lib/config";
import { get, httpDelete, patch, post } from "./requests";

const membersUrl = `${config.api.baseUrl}${config.api.endpoints.member.member}`;
const confirmationHeader = (confirmationId: string) => ({
  [config.header.workflowConfirmation]: confirmationId,
});

export const listMembers = () =>
  get(membersUrl, "Unable to load members") as Promise<Member[]>;

export const previewCreateMember = (form: MemberForm) =>
  post(
    `${config.api.baseUrl}${config.api.endpoints.member.previewCreate}`,
    "Unable to preview member changes",
    form,
  ) as Promise<WorkflowPreview>;

export const previewUpdateMember = (memberId: number, form: MemberForm) =>
  post(
    `${membersUrl}/${memberId}/preview`,
    "Unable to preview member changes",
    form,
  ) as Promise<WorkflowPreview>;

export const previewDeleteMember = (memberId: number) =>
  post(
    `${membersUrl}/${memberId}/delete-preview`,
    "Unable to preview member deletion",
  ) as Promise<WorkflowPreview>;

export const createMember = (form: MemberForm, confirmationId: string) =>
  post(
    membersUrl,
    "Unable to apply member changes",
    form,
    confirmationHeader(confirmationId),
  ) as Promise<Member>;

export const updateMember = (
  memberId: number,
  form: MemberForm,
  confirmationId: string,
) =>
  patch(
    `${membersUrl}/${memberId}`,
    "Unable to apply member changes",
    form,
    confirmationHeader(confirmationId),
  ) as Promise<Member>;

export const deleteMember = (memberId: number, confirmationId: string) =>
  httpDelete(
    `${membersUrl}/${memberId}`,
    "Unable to apply member changes",
    confirmationHeader(confirmationId),
  );

export const exportMemberSnapshot = () =>
  get(
    `${membersUrl}/snapshot`,
    "Unable to export member snapshot",
  ) as Promise<MemberSnapshot>;

export const previewMemberSnapshot = (snapshot: MemberSnapshot) =>
  post(
    `${membersUrl}/snapshot/preview`,
    "Unable to preview member snapshot",
    snapshot,
  ) as Promise<SnapshotPreview>;

export const applyMemberSnapshot = (
  snapshot: MemberSnapshot,
  confirmationId: string,
) =>
  post(
    `${membersUrl}/snapshot/apply`,
    "Unable to apply member snapshot",
    snapshot,
    confirmationHeader(confirmationId),
  ) as Promise<SnapshotApplyResult>;
