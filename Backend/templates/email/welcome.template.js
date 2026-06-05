import { emailButton, emailShell, escapeHtml, normalizeClientUrl } from "./base.template.js";

export const welcomeTemplate = ({ name, clientUrl }) => {
  const safeClientUrl = normalizeClientUrl(clientUrl);

  return emailShell({
    eyebrow: "Welcome",
    title: "Your Mane & More account is ready",
    preview: "Welcome to Mane & More. Start shopping your essentials.",
    body: `
      <p style="margin: 0 0 14px;">Hi ${escapeHtml(name || "there")},</p>
      <p style="margin: 0 0 20px;">Welcome to Mane & More. Your account is ready, and your next grooming and beauty essentials are just a few clicks away.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FBFAF8; border: 1px solid #E8E1DA; border-radius: 16px; margin: 22px 0; border-collapse: separate;">
        <tr>
          <td style="padding: 18px; font-size: 14px; color: #312B3D;">
            <strong style="color: #4A315F;">What you can do now</strong>
            <div style="margin-top: 10px;">Browse products, place orders, and track every purchase from your account.</div>
          </td>
        </tr>
      </table>

      ${emailButton({ href: safeClientUrl, label: "Start shopping" })}
    `,
  });
};
