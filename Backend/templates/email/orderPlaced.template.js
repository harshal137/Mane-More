import {
  detailRow,
  emailButton,
  emailShell,
  escapeHtml,
  formatCurrency,
  normalizeClientUrl,
  renderProductList,
} from "./base.template.js";

export const orderPlacedTemplate = ({
  name,
  orderId,
  products,
  totalAmount,
  paymentMode,
  paymentStatus,
  address,
  clientUrl,
}) => {
  const safeClientUrl = normalizeClientUrl(clientUrl);

  return emailShell({
    eyebrow: "Order placed",
    title: "Your order is confirmed",
    preview: `Order ${orderId} has been placed with Mane & More.`,
    body: `
      <p style="margin: 0 0 14px;">Hi ${escapeHtml(name || "there")},</p>
      <p style="margin: 0 0 20px;">Thank you for shopping with Mane & More. We have received your order and will keep you posted as it moves ahead.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FBFAF8; border: 1px solid #E8E1DA; border-radius: 16px; padding: 0 16px; margin: 22px 0; border-collapse: separate;">
        ${detailRow("Order ID", orderId)}
        ${detailRow("Total", formatCurrency(totalAmount))}
        ${detailRow("Payment mode", paymentMode)}
        ${detailRow("Payment status", paymentStatus)}
      </table>

      <h2 style="font-size: 16px; margin: 24px 0 10px; color: #111827;">Your items</h2>
      ${renderProductList(products, { showPrice: true })}

      ${
        address
          ? `<div style="margin-top: 22px; padding: 16px; background: #F8F5F1; border-radius: 14px;"><div style="font-size: 12px; font-weight: 700; color: #7A7488; text-transform: uppercase; letter-spacing: 0.08em;">Delivery address</div><div style="margin-top: 6px; color: #312B3D;">${escapeHtml(address)}</div></div>`
          : ""
      }

      ${emailButton({ href: `${safeClientUrl}/myorders`, label: "View my orders" })}
    `,
  });
};
