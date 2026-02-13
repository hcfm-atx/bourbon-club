import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_PHONE_NUMBER) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS Skipped] Twilio not configured");
    }
    return;
  }

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

export async function sendMeetingReminder(
  phones: string[],
  meetingTitle: string,
  meetingDate: Date,
  location?: string | null
) {
  const dateStr = meetingDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const locationStr = location ? ` at ${location}` : "";
  const body = `Bourbon Club Reminder: "${meetingTitle}" is coming up on ${dateStr}${locationStr}. See you there!`;

  await Promise.allSettled(phones.map((phone) => sendSMS(phone, body)));
}
