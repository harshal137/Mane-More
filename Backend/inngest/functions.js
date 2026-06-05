import { inngest } from "./client.js";
import { sendBrevoEmail } from "../services/brevoEmail.service.js";
import { orderPlacedTemplate } from "../templates/email/orderPlaced.template.js";
import { orderShippedTemplate } from "../templates/email/orderShipped.template.js";
import { orderDeliveredTemplate } from "../templates/email/orderDelivered.template.js";
import { welcomeTemplate } from "../templates/email/welcome.template.js";
import { resetPasswordTemplate } from "../templates/email/resetPassword.template.js";

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

export const sendOrderPlacedEmail = inngest.createFunction(
  {
    id: "send-order-placed-email",
    triggers: [{ event: "order.placed" }],
  },
  async ({ event, step }) => {
    await step.run("send-order-placed-email", async () => {
      await sendBrevoEmail({
        to: event.data.email,
        subject: "Your Mane & More order has been placed",
        html: orderPlacedTemplate({
          ...event.data,
          clientUrl: getClientUrl(),
        }),
        senderEmail: process.env.EMAIL_FROM_ORDERS,
        senderName: "Mane & More",
      });
    });

    return { success: true };
  }
);

export const sendOrderShippedEmail = inngest.createFunction(
  {
    id: "send-order-shipped-email",
    triggers: [{ event: "order.shipped" }],
  },
  async ({ event, step }) => {
    await step.run("send-order-shipped-email", async () => {
      await sendBrevoEmail({
        to: event.data.email,
        subject: "Your Mane & More order is arriving today",
        html: orderShippedTemplate({
          ...event.data,
          clientUrl: getClientUrl(),
        }),
        senderEmail: process.env.EMAIL_FROM_ORDERS,
        senderName: "Mane & More",
      });
    });

    return { success: true };
  }
);

export const sendOrderDeliveredEmail = inngest.createFunction(
  {
    id: "send-order-delivered-email",
    triggers: [{ event: "order.delivered" }],
  },
  async ({ event, step }) => {
    await step.run("send-order-delivered-email", async () => {
      await sendBrevoEmail({
        to: event.data.email,
        subject: "Your Mane & More order has been delivered",
        html: orderDeliveredTemplate({
          ...event.data,
          clientUrl: getClientUrl(),
        }),
        senderEmail: process.env.EMAIL_FROM_ORDERS,
        senderName: "Mane & More",
      });
    });

    return { success: true };
  }
);

export const sendWelcomeEmail = inngest.createFunction(
  {
    id: "send-welcome-email",
    triggers: [{ event: "user.registered" }],
  },
  async ({ event, step }) => {
    await step.run("send-welcome-email", async () => {
      await sendBrevoEmail({
        to: event.data.email,
        subject: "Welcome to Mane & More",
        html: welcomeTemplate({
          ...event.data,
          clientUrl: getClientUrl(),
        }),
        senderEmail: process.env.EMAIL_FROM_MARKETING,
        senderName: "Mane & More",
      });
    });

    return { success: true };
  }
);

export const sendPasswordResetEmail = inngest.createFunction(
  {
    id: "send-password-reset-email",
    triggers: [{ event: "user.password.reset" }],
  },
  async ({ event, step }) => {
    await step.run("send-password-reset-email", async () => {
      await sendBrevoEmail({
        to: event.data.email,
        subject: "Reset your Mane & More password",
        html: resetPasswordTemplate(event.data),
        senderEmail: process.env.EMAIL_FROM_SUPPORT,
        senderName: "Mane & More Support",
      });
    });

    return { success: true };
  }
);

// Dummy Brevo function used to verify the full route -> Inngest -> Brevo flow.
export const testBrevoEmailFunction = inngest.createFunction(
  {
    id: "test-brevo-email",
    triggers: [{ event: "test/brevo.email" }],
  },
  async ({ event, step }) => {
    const { email, name, message } = event.data;

    await step.run("send-test-brevo-email", async () => {
      await sendBrevoEmail({
        to: email,
        subject: "Test email from Mane & More",
        senderEmail: process.env.EMAIL_FROM_ORDERS,
        senderName: "Mane & More Orders",
        html: `
          <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
            <h1>Brevo + Inngest test email</h1>
            <p>Hi ${name || "Test User"},</p>
            <p>${message || "Brevo + Inngest is working."}</p>
            <p>This confirms that Brevo + Inngest is working for Mane & More.</p>
          </div>
        `,
      });
    });

    return {
      success: true,
    };
  }
);

console.log("Inngest function loaded");
