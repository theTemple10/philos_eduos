import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: "Philos EDU <noreply@philosedu.com>",
      to: email,
      subject: "Your Verification Code",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#1e293b;padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Philos EDU</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Verification Code</h2>
              <p style="color:#64748b;margin:0 0 32px;font-size:14px;">Use the code below to verify your email address.</p>
              <div style="background-color:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:20px;margin:0 0 32px;">
                <span style="font-size:32px;font-weight:700;color:#1e293b;letter-spacing:8px;">${otp}</span>
              </div>
              <p style="color:#94a3b8;margin:0;font-size:12px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;margin:0;font-size:12px;">Philos EDU - School Management Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
