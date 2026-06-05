import { BrevoClient } from "@getbrevo/brevo";

let brevoClient;

const getBrevoClient = () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is required to send Brevo email");
  }

  if (!brevoClient) {
    brevoClient = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });
  }

  return brevoClient;
};

// Reusable Brevo transactional email sender for all future backend emails.
export const sendBrevoEmail = async ({
  to,
  subject,
  html,
  senderEmail,
  senderName,
}) => {
  if (!to) {
    throw new Error("Brevo email recipient `to` is required");
  }

  if (!subject) {
    throw new Error("Brevo email `subject` is required");
  }

  if (!html) {
    throw new Error("Brevo email `html` is required");
  }

  if (!senderEmail) {
    throw new Error("Brevo email `senderEmail` is required");
  }

  console.log("Brevo email sending started", { to, subject, senderEmail });

  try {
    const result = await getBrevoClient().transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        email: senderEmail,
        name: senderName || "Mane & More",
      },
      to: [{ email: to }],
    });

    console.log("Brevo email sent successfully", { to, subject });
    return result;
  } catch (error) {
    console.error("Brevo email failed", {
      to,
      subject,
      statusCode: error.statusCode,
      message: error.message,
      body: error.body,
    });
    throw error;
  }
};
