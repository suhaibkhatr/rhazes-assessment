import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING as string;
const emailClient = new EmailClient(connectionString);

interface EmailProps {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailProps) {
  try {
    const message = {
      senderAddress: process.env.AZURE_SENDER_EMAIL as string,
      content: {
        subject,
        html,
      },
      recipients: {
        to: [
          {
            address: to,
          },
        ],
      },
    };

    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();

    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
