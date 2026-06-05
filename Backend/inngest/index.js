import {
  sendOrderDeliveredEmail,
  sendOrderPlacedEmail,
  sendOrderShippedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testBrevoEmailFunction,
} from "./functions.js";

// Export every Inngest function from a single place for the Express serve handler.
export const functions = [
  sendOrderPlacedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testBrevoEmailFunction,
];
