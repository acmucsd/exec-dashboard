import { google, gmail_v1, admin_directory_v1 } from 'googleapis'

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
    scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.group',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
    ],
    clientOptions: {
        subject: process.env.GOOGLE_WORKSPACE_ADMIN,
    },
})

export const googleAdminClient = new admin_directory_v1.Admin({ auth })

export const gmailClient = new gmail_v1.Gmail({ auth })