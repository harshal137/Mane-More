import {
  detailRow,
  emailButton,
  emailShell,
  escapeHtml,
  normalizeClientUrl,
  renderProductList,
} from "./base.template.js";

export const orderShippedTemplate = ({
  name,
  orderId,
  products,
  deliveryStatus,
  address,
  clientUrl,
}) => {
  const safeClientUrl = normalizeClientUrl(clientUrl);

  return emailShell({
    eyebrow: "Shipping update",
    title: "Your order is on the way",
    preview: `Order ${orderId} is now ${deliveryStatus}.`,
    body: `
      <p style="margin: 0 0 14px;">Hi ${escapeHtml(name || "there")},</p>
      <p style="margin: 0 0 20px;">Good news. Your Mane & More order has moved into delivery.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FBFAF8; border: 1px solid #E8E1DA; border-radius: 16px; padding: 0 16px; margin: 22px 0; border-collapse: separate;">
        ${detailRow("Order ID", orderId)}
        ${detailRow("Delivery status", deliveryStatus)}
      </table>

      <div style="background: #E8F1D8; color: #33451F; border-radius: 14px; padding: 14px 16px; font-size: 14px; font-weight: 700; margin-bottom: 22px;">
        Keep an eye out for your package today.
      </div>

      <h2 style="font-size: 16px; margin: 24px 0 10px; color: #111827;">Items in this order</h2>
      ${renderProductList(products)}

      ${
        address
          ? `<div style="margin-top: 22px; padding: 16px; background: #F8F5F1; border-radius: 14px;"><div style="font-size: 12px; font-weight: 700; color: #7A7488; text-transform: uppercase; letter-spacing: 0.08em;">Delivery address</div><div style="margin-top: 6px; color: #312B3D;">${escapeHtml(address)}</div></div>`
          : ""
      }

      ${emailButton({ href: `${safeClientUrl}/myorders`, label: "Track my order" })}
    `,
  });
};
