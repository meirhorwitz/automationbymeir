import express from "express";
import cors from "cors";
import { google } from "googleapis";
import functions from "firebase-functions";
import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import {
  getEmailTemplate,
  createNotificationEmailContent,
  createEnglishEmailContent,
  createHebrewEmailContent,
} from "./emailTemplates.js";

const runtimeConfig = functions.config() ?? {};
const schedulingConfig = runtimeConfig.scheduling ?? {};

const CALENDAR_ID = process.env.CALENDAR_ID ?? schedulingConfig.calendar_id;
const TIMEZONE = process.env.TIMEZONE ?? schedulingConfig.timezone ?? "Asia/Jerusalem";
const MEETING_DURATION_MINUTES = parseInt(
  process.env.MEETING_DURATION_MINUTES ?? schedulingConfig.meeting_duration ?? "30",
  10
);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL ?? schedulingConfig.notification_email;
const DELEGATED_USER = process.env.DELEGATED_USER ?? schedulingConfig.delegated_user;
const BUSINESS_START_HOUR = parseInt(
  process.env.BUSINESS_START_HOUR ?? schedulingConfig.start_hour ?? "9",
  10
);
const BUSINESS_END_HOUR = parseInt(
  process.env.BUSINESS_END_HOUR ?? schedulingConfig.end_hour ?? "17",
  10
);

if (!CALENDAR_ID) {
  throw new Error("CALENDAR_ID (scheduling.calendar_id) must be configured before deploying the function.");
}

if (!NOTIFICATION_EMAIL) {
  throw new Error(
    "NOTIFICATION_EMAIL (scheduling.notification_email) must be configured before deploying the function."
  );
}

if (!DELEGATED_USER) {
  throw new Error("DELEGATED_USER (scheduling.delegated_user) must be configured before deploying the function.");
}

let authClientPromise;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
];

async function getAuthorizedClient() {
  if (!authClientPromise) {
    const rawServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!rawServiceAccount) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT secret is missing. Upload the service account JSON as the GOOGLE_SERVICE_ACCOUNT secret."
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(rawServiceAccount);
    } catch (error) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT secret is not valid JSON.");
    }

    const jwtClient = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: SCOPES,
      subject: DELEGATED_USER,
    });

    authClientPromise = jwtClient.authorize().then(() => jwtClient);
  }

  return authClientPromise;
}

async function getCalendarClient() {
  const auth = await getAuthorizedClient();
  return google.calendar({ version: "v3", auth });
}

async function getGmailClient() {
  const auth = await getAuthorizedClient();
  return google.gmail({ version: "v1", auth });
}

function toDateTime(value) {
  return DateTime.fromISO(value, { zone: TIMEZONE });
}

async function fetchBusyEvents(calendar) {
  const now = DateTime.now().setZone(TIMEZONE);
  const timeMin = now.startOf("minute").toISO();
  const timeMax = now.plus({ days: 7 }).endOf("day").toISO();

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });

  return (
    response.data.items?.map((event) => ({
      start: event.start?.dateTime
        ? DateTime.fromISO(event.start.dateTime, { zone: TIMEZONE })
        : DateTime.fromISO(event.start?.date ?? "", { zone: TIMEZONE }).startOf("day"),
      end: event.end?.dateTime
        ? DateTime.fromISO(event.end.dateTime, { zone: TIMEZONE })
        : DateTime.fromISO(event.end?.date ?? "", { zone: TIMEZONE }).endOf("day"),
    })) ?? []
  );
}

function generateAvailableSlots(now, busySlots) {
  const slots = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const day = now.plus({ days: dayOffset }).set({ hour: BUSINESS_START_HOUR, minute: 0, second: 0, millisecond: 0 });
    const endOfDay = day.set({ hour: BUSINESS_END_HOUR, minute: 0, second: 0, millisecond: 0 });

    let slotStart = day;

    while (slotStart < endOfDay) {
      const slotEnd = slotStart.plus({ minutes: MEETING_DURATION_MINUTES });
      if (slotStart > now) {
        const isBusy = busySlots.some((busy) => slotStart < busy.end && slotEnd > busy.start);
        if (!isBusy) {
          slots.push(slotStart.toISO());
        }
      }
      slotStart = slotEnd;
    }
  }

  return slots;
}

async function sendEmail({ to, subject, htmlBody }) {
  const gmail = await getGmailClient();

  const messageParts = [
    "Content-Type: text/html; charset=\"UTF-8\"",
    "MIME-Version: 1.0",
    `From: Automation by Meir <${NOTIFICATION_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    htmlBody,
  ];

  const encodedMessage = Buffer.from(messageParts.join("\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/slots", async (req, res) => {
  try {
    const calendar = await getCalendarClient();
    const now = DateTime.now().setZone(TIMEZONE);
    const busySlots = await fetchBusyEvents(calendar);
    const available = generateAvailableSlots(now, busySlots);
    res.json({ success: true, slots: available });
  } catch (error) {
    functions.logger.error("Failed to fetch slots", error);
    res.status(500).json({ success: false, error: "Could not retrieve slots." });
  }
});

app.post("/book", async (req, res) => {
  const { name, email, details, dateTime, lang = "en" } = req.body ?? {};

  if (!name || !email || !details || !dateTime) {
    res.status(400).json({ success: false, error: "Missing required fields." });
    return;
  }

  try {
    const calendar = await getCalendarClient();
    const startTime = toDateTime(dateTime);

    if (!startTime.isValid) {
      res.status(400).json({ success: false, error: "Invalid dateTime provided." });
      return;
    }

    const endTime = startTime.plus({ minutes: MEETING_DURATION_MINUTES });

    const description = `Project Details:\n\n${details}\n\nClient Email: ${email}`;
    const requestId = uuidv4();

    const eventResponse = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: `Consultation: ${name}`,
        description,
        start: { dateTime: startTime.toISO(), timeZone: TIMEZONE },
        end: { dateTime: endTime.toISO(), timeZone: TIMEZONE },
        attendees: [{ email }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const eventData = eventResponse.data;
    const meetLink = eventData.hangoutLink ?? eventData.conferenceData?.entryPoints?.[0]?.uri ?? "";

    const emailPayload = { name, email, details, dateTime: startTime.toISO(), meetLink };

    try {
      const htmlBody = getEmailTemplate(
        lang === "he"
          ? createHebrewEmailContent(emailPayload, TIMEZONE, MEETING_DURATION_MINUTES)
          : createEnglishEmailContent(emailPayload, TIMEZONE, MEETING_DURATION_MINUTES)
      );
      await sendEmail({
        to: email,
        subject: lang === "he" ? "פגישת הייעוץ שלנו נקבעה!" : "Our Consultation is Scheduled!",
        htmlBody,
      });
    } catch (emailError) {
      functions.logger.error("Failed to send confirmation email", emailError);
    }

    try {
      const htmlBody = getEmailTemplate(
        createNotificationEmailContent(emailPayload, TIMEZONE, MEETING_DURATION_MINUTES)
      );
      await sendEmail({
        to: NOTIFICATION_EMAIL,
        subject: `New Project Inquiry from ${name}`,
        htmlBody,
      });
    } catch (emailError) {
      functions.logger.error("Failed to send notification email", emailError);
    }

    res.json({ success: true, message: "Meeting scheduled successfully.", meetLink });
  } catch (error) {
    functions.logger.error("Failed to schedule meeting", error);
    res.status(500).json({ success: false, error: "Failed to schedule meeting." });
  }
});

export const schedule = functions
  .runWith({ secrets: ["GOOGLE_SERVICE_ACCOUNT"] })
  .https.onRequest(app);
