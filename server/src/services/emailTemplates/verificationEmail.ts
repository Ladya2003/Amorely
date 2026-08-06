/** Brand pink from Amorely primary theme */
const BRAND = '#ff4b8d';
const BRAND_DARK = '#e0437d';
const BG = '#140c14';
const CARD = '#241824';
const TEXT = '#f5eef2';
const MUTED = '#c4a8b6';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildVerificationEmailSubject = (): string => 'Confirm your Amorely email';

export const buildVerificationEmailText = (verifyUrl: string): string =>
  [
    'Welcome to Amorely!',
    '',
    'Please confirm your email address to finish creating your account:',
    verifyUrl,
    '',
    'This link expires in 24 hours.',
    '',
    'If you did not create an Amorely account, you can ignore this email.',
    '',
    '— Amorely',
  ].join('\n');

/**
 * HTML email styled like Amorely auth surfaces.
 * Table + inline CSS for broad client support (free on Resend — no paid add-on).
 */
export const buildVerificationEmailHtml = (verifyUrl: string): string => {
  const safeUrl = escapeHtml(verifyUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Confirm your Amorely email</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG};background-image:linear-gradient(180deg,#2a1420 0%,${BG} 42%);">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:28px;line-height:1;padding-right:10px;color:${BRAND};">♥</td>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:${TEXT};">
                    Amorely
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:${CARD};border:1px solid rgba(255,75,141,0.28);border-radius:24px;padding:36px 28px;box-shadow:0 18px 48px rgba(0,0,0,0.35);">
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;color:${TEXT};text-align:center;">
                Confirm your email
              </h1>
              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:${MUTED};text-align:center;">
                One quick step and your private space for two is ready.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 22px;">
                    <a href="${safeUrl}"
                       style="display:inline-block;padding:14px 32px;border-radius:999px;background:linear-gradient(120deg,${BRAND_DARK},${BRAND},#ff8fb3);color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;box-shadow:0 10px 28px rgba(255,75,141,0.35);">
                      Confirm email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
                Button not working? Paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.45;word-break:break-all;text-align:center;">
                <a href="${safeUrl}" style="color:${BRAND};text-decoration:underline;">${safeUrl}</a>
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
                This link expires in 24 hours. If you didn’t create an Amorely account, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">
              Made for couples · <a href="https://amorely.love" style="color:${BRAND};text-decoration:none;">amorely.love</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
