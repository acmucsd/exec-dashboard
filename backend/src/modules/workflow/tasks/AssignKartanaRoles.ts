import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { toError } from '@lib/error';
import {
  KartanaAssignPreviewResponse,
  KartanaAssignResponse,
} from '@modules/workflow/types/Response';
import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';

const getKartanaAuthHeaders = () => {
  const secret = process.env.KARTANA_API_SECRET;
  if (!secret) {
    throw new Error('KARTANA_API_SECRET is not configured.');
  }
  return { Authorization: `Bearer ${secret}` };
};

const getKartanaPreview = async (
  url: string,
  body: string,
  headers: { Authorization: string },
) => {
  const parsedUrl = new URL(url);
  const request = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error(`Unsupported Kartana URL protocol: ${parsedUrl.protocol}`);
  }

  return new Promise<{ statusCode: number | undefined; body: string }>(
    (resolve, reject) => {
      const req = request(
        parsedUrl,
        {
          method: 'GET',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (response) => {
          let responseBody = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => {
            responseBody += chunk;
          });
          response.on('error', reject);
          response.on('end', () => {
            resolve({ statusCode: response.statusCode, body: responseBody });
          });
        },
      );
      req.on('error', reject);
      req.end(body);
    },
  );
};

export default class AssignKartanaRoles extends Task {
  label = 'Assign Discord roles through Kartana';
  requiresConfirmation = true;

  async preview(member: Member) {
    const username = member.discordUserId;
    if (!username) {
      throw new Error('A Discord username is required to preview Kartana roles.');
    }
    const requestBody = JSON.stringify({
      username,
      team: member.team,
      position: member.position,
    });
    const response = await getKartanaPreview(
      `${process.env.KARTANA_INTERNAL_URL}/assign`,
      requestBody,
      getKartanaAuthHeaders(),
    );
    if (
      response.statusCode === undefined ||
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      throw new Error(
        `Kartana preview returned ${response.statusCode ?? 'an unknown status'}: ${response.body}`,
      );
    }
    const preview = JSON.parse(response.body) as KartanaAssignPreviewResponse;
    if (
      typeof preview.message !== 'string' ||
      !Array.isArray(preview.assigned) ||
      !Array.isArray(preview.unAssigned)
    ) {
      throw new Error(
        'Kartana GET /assign preview must return a message, assigned array, and unAssigned array.',
      );
    }
    if (preview.message.startsWith('No guild member found')) {
      throw new Error(`Kartana could not find the Discord user: ${preview.message}`);
    }

    const assigned = preview.assigned.filter(Boolean);
    const unAssigned = preview.unAssigned.filter(Boolean);
    return {
      description: [
        preview.message,
        `Roles to assign:\n${assigned.length ? assigned.join('\n') : 'None'}`,
        `Roles to unassign:\n${unAssigned.length ? unAssigned.join('\n') : 'None'}`,
      ].join('\n\n'),
    };
  }

  async run(member: Member): Promise<TaskResult> {
    const username = member.discordUserId;
    const team = member.team;
    const position = member.position;

    try {
      if (!username) {
        throw new Error('A Discord username is required to assign Kartana roles.');
      }
      const response = await fetch(
        `${process.env.KARTANA_INTERNAL_URL}/assign`,
        {
          method: 'POST',
          body: JSON.stringify({ username, team, position }),
          headers: {
            ...getKartanaAuthHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Kartana error body:', errorBody);
        throw new Error(`Kartana returned ${response.status}: ${errorBody}`);
      }
      const { success }: KartanaAssignResponse = await response.json();

      if (!success) {
        throw new Error(
          'Discord roles do not exist for this team or position.',
        );
      }

      return this.TaskSuccess({
        feedback: `Successfully assigned ${member.firstName} ${member.lastName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`,
      });
    } catch (err) {
      return this.TaskFailure({
        error: toError(err),
        feedback: `Failed to assign ${member.firstName} ${member.lastName} with discord ID ${member.discordUserId} roles for their team ${member.team} or position ${member.position}`,
      });
    }
  }
}
