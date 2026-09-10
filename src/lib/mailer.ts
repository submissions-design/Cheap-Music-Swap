/**
 * Outbound email. Currently logs to the server console so registration and
 * order flows are fully testable with no external account required.
 *
 * To send real email, set EMAIL_PROVIDER (e.g. "smtp", "sendgrid", "ses")
 * and implement the corresponding branch here — the rest of the app only
 * calls sendEmail(), so swapping providers is contained to this file. See
 * README.md "Email configuration".
 */
export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const provider = process.env.EMAIL_PROVIDER || "console";

  if (provider === "console") {
    // eslint-disable-next-line no-console
    console.log(
      `\n----- [mailer:console] -----\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n-----------------------------\n`
    );
    return { ok: true };
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}". Implement it in lib/mailer.ts.`);
}

export function verificationEmailText(firstName: string, verifyUrl: string) {
  return `Hi ${firstName},

Thanks for creating an account with Cheap Music Swap. Please confirm your email address and verify your account details by visiting the link below:

${verifyUrl}

If you didn't create this account, you can ignore this message.

— Cheap Music Swap`;
}

export function orderConfirmationEmailText(firstName: string, orderNumber: string, totalFormatted: string) {
  return `Hi ${firstName},

Thanks for your order! Your order ${orderNumber} has been placed for a total of ${totalFormatted}.

You can view your order status any time from your account's Order History.

— Cheap Music Swap`;
}
