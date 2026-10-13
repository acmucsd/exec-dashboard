export function accountSetupTemplate(params: {
  fullName: string;
  orgEmail: string;
  tempPassword: string;
}) {
  const { fullName, orgEmail, tempPassword } = params;

  return {
    subject: 'Your ACM UCSD Email Account',
    body: `
Hi ${fullName},

Your ACM UCSD email account has been created. Here are your login details:

	Email:		${orgEmail}
	Password:	${tempPassword}

You will be prompted to change your password on first login.

Sign in at: https://mail.google.com

Best,
ACM UCSD
		`.trim(),
  };
}
