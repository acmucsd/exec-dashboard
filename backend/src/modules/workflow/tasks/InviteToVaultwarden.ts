import { toError } from '@lib/error';
import { Task, TaskResult } from '@modules/workflow/types/Task';
import { Member } from '@t/Member';
import 'dotenv/config';
export default class InviteToVaultwarden extends Task {
  label = 'Invite user to Vaultwarden';
  requiresConfirmation = true;

  async preview(member: Member) {
    const credentials = JSON.parse(process.env.VAULT_TEAM_CREDS!);
    const organizationId = credentials[member.team]?.organizationId;
    const collection = credentials[member.team]?.collections?.[0];
    return {
      description: `Invite ${member.acmEmail} to Vaultwarden organization ${organizationId} with collection ${collection}.`,
    };
  }

  async run(_member: Member): Promise<TaskResult> {
    const email = _member.acmEmail;
    const team = _member.team;

    const VAULT_TEAM_CREDS = JSON.parse(process.env.VAULT_TEAM_CREDS!);
    const organizationId = VAULT_TEAM_CREDS[team].organizationId;
    const collection = VAULT_TEAM_CREDS[team].collections[0];

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

      if (loginResponse.status != 200) {
        const { message: errorMessage } = await loginResponse.json();
        throw new Error(errorMessage);
      }

      const { access_token: accessToken } = await loginResponse.json();

      const inviteResponse = await fetch(
        `${process.env.VAULTWARDEN_INTERNAL_URL}/api/organizations/${organizationId}/users/invite`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          method: 'POST',
          body: JSON.stringify(VAULT_INVITE_PAYLOAD),
        },
      );

      if (inviteResponse.status != 200) {
        const { message: errorMessage } = await inviteResponse.json();
        throw new Error(errorMessage);
      }

      return this.TaskSuccess({
        feedback: `Successfully invited ${email} to Vaultwarden!`,
      });
    } catch (err) {
      return this.TaskFailure({
        error: toError(err),
        feedback: `Unable to invite ${email} to Vaultwarden!`,
      });
    }
  }
}
