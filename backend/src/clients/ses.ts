import { SESClient } from "@aws-sdk/client-ses";

export const sesClient = new SESClient({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
    },
})