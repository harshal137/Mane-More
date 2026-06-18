export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(amount || 0));

export const normalizeClientUrl = (clientUrl = "") =>
  String(clientUrl || "http://localhost:5173").replace(/\/+$/, "");

export const emailButton = ({ href, label }) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 10px;">
    <tr>
      <td style="border-radius: 999px; background: #4A315F;">
        <a href="${escapeHtml(href)}" style="display: inline-block; padding: 14px 24px; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

export const detailRow = (label, value) => {
  if (value === undefined || value === null || value === "") return "";

  return `
    <tr>
      <td style="padding: 10px 0; font-size: 13px; color: #7A7488;">${escapeHtml(label)}</td>
      <td style="padding: 10px 0; font-size: 14px; color: #111827; font-weight: 700; text-align: right;">${escapeHtml(value)}</td>
    </tr>
  `;
};

export const renderProductList = (products = [], { showPrice = false } = {}) => {
  if (!Array.isArray(products) || products.length === 0) {
    return `
      <div style="padding: 16px; border: 1px solid #E8E1DA; border-radius: 14px; background: #FBFAF8; color: #7A7488; font-size: 14px;">
        No products listed.
      </div>
    `;
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
      ${products
        .map((product) => {
          const title = product.title || product.name || "Product";
          const quantity = product.quantity || 1;
          const price = showPrice ? product.price : undefined;

          return `
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #EFE8E1;">
                <div style="font-size: 15px; font-weight: 700; color: #111827;">${escapeHtml(title)}</div>
                <div style="font-size: 13px; color: #7A7488; margin-top: 3px;">Quantity: ${escapeHtml(quantity)}</div>
              </td>
              ${
                showPrice
                  ? `<td style="padding: 14px 0; border-bottom: 1px solid #EFE8E1; text-align: right; font-size: 14px; font-weight: 700; color: #4A315F;">${formatCurrency(price)}</td>`
                  : ""
              }
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
};

export const emailShell = ({ eyebrow, title, preview, body }) => `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background: #F8F5F1;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
        ${escapeHtml(preview || title)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #F8F5F1; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 28px 14px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; border-collapse: collapse;">
              <tr>
                <td style="padding: 0 4px 16px; text-align: center;">
                  <div style="font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #7A7488;">${escapeHtml(eyebrow || "Mane & More")}</div>
                  <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.15; font-weight: 700; color: #4A315F; margin-top: 8px;">Mane & More</div>
                </td>
              </tr>
              <tr>
                <td style="background: #ffffff; border: 1px solid #E8E1DA; border-radius: 22px; overflow: hidden;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="background: #4A315F; padding: 26px 28px;">
                        <div style="font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #EFC65A;">${escapeHtml(eyebrow || "Update")}</div>
                        <h1 style="font-family: Arial, sans-serif; font-size: 26px; line-height: 1.25; margin: 8px 0 0; color: #ffffff;">${escapeHtml(title)}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px; font-family: Arial, sans-serif; color: #312B3D; font-size: 15px; line-height: 1.65;">
                        ${body}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 8px 0; text-align: center; font-family: Arial, sans-serif; color: #7A7488; font-size: 12px; line-height: 1.5;">
                  You are receiving this email because of activity on your Mane & More account.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
