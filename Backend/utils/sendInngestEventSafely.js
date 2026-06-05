import { inngest } from "../inngest/client.js";

export const sendInngestEventSafely = async ({ name, data }) => {
  try {
    await inngest.send({ name, data });
    console.log(`Inngest event sent: ${name}`);
  } catch (error) {
    console.error(`Failed to send Inngest event: ${name}`, error);
  }
};
