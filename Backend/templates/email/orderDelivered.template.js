import {
  detailRow,
  emailButton,
  emailShell,
  escapeHtml,
  formatCurrency,
  normalizeClientUrl,
  renderProductList,
} from "./base.template.js";

export const orderDeliveredTemplate = ({
  name,
  orderId,
  products,
  totalAmount,
  clientUrl,
}) => {
  const safeClientUrl = normalizeClientUrl(clientUrl);

  return emailShell({
    eyebrow: "Delivered",
    title: "Your order has arrived",
    preview: `Order ${orderId} has been delivered.`,
    body: `
      <p style="margin: 0 0 14px;">Hi ${escapeHtml(name || "there")},</p>
      <p style="margin: 0 0 20px;">Your Mane & More order has been delivered. We hope everything arrived beautifully.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FBFAF8; border: 1px solid #E8E1DA; border-radius: 16px; padding: 0 16px; margin: 22px 0; border-collapse: separate;">
        ${detailRow("Order ID", orderId)}
        ${detailRow("Total", formatCurrency(totalAmount))}
      </table>

      <h2 style="font-size: 16px; margin: 24px 0 10px; color: #111827;">Delivered items</h2>
      ${renderProductList(products)}

      <div style="background: #F8F5F1; border-radius: 14px; padding: 16px; margin-top: 22px; color: #312B3D;">
        Thank you for choosing Mane & More. Your support means a lot to us.
      </div>

      ${emailButton({ href: `${safeClientUrl}/myorders`, label: "View order details" })}
    `,
  });
};
