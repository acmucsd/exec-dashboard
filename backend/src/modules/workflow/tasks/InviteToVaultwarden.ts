import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';
import 'dotenv/config';
import { z } from 'zod';

const credentialsSchema = z.record(z.string(), z.unknown());
const teamCredentialsSchema = z.object({
  organizationId: z.string().min(1),
  collections: z.tuple([z.string().min(1)]).rest(z.unknown()),
});
const loginResponseSchema = z.object({ access_token: z.string().min(1) });

function getTeamCredentials(team: Member['team']) {
  try {
    const credentials = credentialsSchema.parse(
      JSON.parse(process.env.VAULT_TEAM_CREDS ?? ''),
    );
    const { organizationId, collections } = teamCredentialsSchema.parse(
      credentials[team],
    );
    return { organizationId, collection: collections[0] };
  } catch {
    throw new Error(
      'VAULT_TEAM_CREDS must contain an organization ID and first collection ID for the selected team.',
    );
  }
}

export default class InviteToVaultwarden extends Task {
  label = 'Invite user to Vaultwarden';
  requiresConfirmation = true;

  async preview(member: Member) {
    // required to return a Promise
    await Promise.resolve();
    const { organizationId, collection } = getTeamCredentials(member.team);
    return {
      description: `Invite ${member.acmEmail} to Vaultwarden organization ${organizationId} with collection ${collection}.`,
    };
  }

  async run(member: Member): Promise<TaskResult> {
    const email = member.acmEmail;
    const { organizationId, collection } = getTeamCredentials(member.team);

    if (!process.env.VAULT_ADMIN_PASSWORD) {
      throw new Error('Missing VAULT_ADMIN_PASSWORD value!');
    }
    if (!process.env.VAULT_ADMIN_USERNAME) {
      throw new Error('Missing VAULT_ADMIN_USERNAME value!');
    }
    const VAULT_LOGIN_PAYLOAD = {
      grant_type: 'password',
      client_id: 'web',
      password: process.env.VAULT_ADMIN_PASSWORD,
      scope: 'api offline_access',
      username: process.env.VAULT_ADMIN_USERNAME,
      device_identifier: '0',
      device_name: 'chrome',
      device_type: '0',
    };
    const VAULT_INVITE_PAYLOAD = {
      emails: [email],
      collections: [
        { id: collection, readOnly: true, hidePasswords: false, manage: false },
      ],
      permissions: { response: null },
      type: 2,
      groups: [],
      accessSecretsManager: false,
    };

    const fail = (message: string) =>
      this.TaskFailure({
        error: new Error(message),
        feedback: `Unable to invite ${email} to Vaultwarden!`,
      });

    try {
      const loginResponse = await fetch(
        `${process.env.VAULTWARDEN_INTERNAL_URL}/identity/connect/token`,
        {
          method: 'POST',
          body: new URLSearchParams(VAULT_LOGIN_PAYLOAD),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Bitwarden-Client-Name': 'web',
            'Bitwarden-Client-Version': '2026.6.0',
          },
        },
      );

      if (loginResponse.status !== 200) {
        return fail(`Vaultwarden login failed (HTTP ${loginResponse.status}).`);
      }

      const token = loginResponseSchema.safeParse(
        await loginResponse.json().catch(() => null),
      );
      if (!token.success) {
        return fail('Vaultwarden login returned an invalid access token.');
      }

      const inviteResponse = await fetch(
        `${process.env.VAULTWARDEN_INTERNAL_URL}/api/organizations/${organizationId}/users/invite`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.data.access_token}`,
          },
          method: 'POST',
          body: JSON.stringify(VAULT_INVITE_PAYLOAD),
        },
      );

      if (inviteResponse.status !== 200) {
        return fail(
          `Vaultwarden invite failed (HTTP ${inviteResponse.status}).`,
        );
      }

      return this.TaskSuccess({
        feedback: `Successfully invited ${email} to Vaultwarden!`,
      });
    } catch {
      return fail('Unable to complete the Vaultwarden request.');
    }
  }
}
