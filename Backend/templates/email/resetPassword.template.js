import { emailShell, escapeHtml } from "./base.template.js";

export const resetPasswordTemplate = ({ name, resetCode, resetUrl }) =>
  emailShell({
    eyebrow: "Security code",
    title: "Reset your password",
    preview: "Use your Mane & More verification code to reset your password.",
    body: `
      <p style="margin: 0 0 14px;">Hi ${escapeHtml(name || "there")},</p>
      <p style="margin: 0 0 20px;">Use this 6-digit verification code to reset your Mane & More password. The code expires in 15 minutes.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #F8F5F1; border: 1px solid #E8E1DA; border-radius: 18px; margin: 24px 0; border-collapse: separate;">
        <tr>
          <td align="center" style="padding: 26px 16px;">
            <div style="font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; color: #7A7488; text-transform: uppercase; letter-spacing: 0.12em;">Verification code</div>
            <div style="font-family: Arial, sans-serif; font-size: 38px; line-height: 1; font-weight: 800; letter-spacing: 8px; color: #4A315F; margin-top: 12px;">${escapeHtml(resetCode)}</div>
          </td>
        </tr>
      </table>

      ${
        resetUrl
          ? `<p style="font-size: 13px; color: #7A7488;">Reset page: <a href="${escapeHtml(resetUrl)}" style="color: #4A315F;">${escapeHtml(resetUrl)}</a></p>`
          : ""
      }

      <div style="background: #FFF7E0; border-radius: 14px; padding: 14px 16px; color: #5F4A10; font-size: 14px; margin-top: 22px;">
        If you did not request this password reset, ignore this email. Your password will stay unchanged.
      </div>
    `,
  });
