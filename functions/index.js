import express from "express";
import cors from "cors";
import { google } from "googleapis";
import functions from "firebase-functions";
import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const busboy = require("busboy");
const getRawBody = require("raw-body");
import {
  getEmailTemplate,
  createNotificationEmailContent,
  createEnglishEmailContent,
  createHebrewEmailContent,
  createBriefConfirmationEmailContent,
  createBriefNotificationEmailContent,
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

async function sendEmail({ to, subject, htmlBody, attachments = [] }) {
  const gmail = await getGmailClient();

  let messageParts;

  // If no attachments, use simple HTML email
  if (!attachments || attachments.length === 0) {
    messageParts = [
      "Content-Type: text/html; charset=\"UTF-8\"",
      "MIME-Version: 1.0",
      `From: Automation by Meir <${NOTIFICATION_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      htmlBody,
    ];
  } else {
    // Use multipart/mixed for emails with attachments
    const boundary = `----=_Part_${uuidv4().replace(/-/g, "")}`;
    messageParts = [
      `MIME-Version: 1.0`,
      `From: Automation by Meir <${NOTIFICATION_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      "",
      htmlBody,
    ];

    // Add attachments
    for (const attachment of attachments) {
      messageParts.push(
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        "",
        attachment.content
      );
    }

    messageParts.push(`--${boundary}--`);
  }

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

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.automationbymeir.com",
  "https://automationbymeir.com",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const allowedOrigins = schedulingConfig.allowed_origins
  ? schedulingConfig.allowed_origins.split(",").map((origin) => origin.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware to handle multipart parsing using busboy directly
// MUST be defined before express.json() to avoid consuming the stream
const handleMultipart = async (req, res, next) => {
  // Log request info
  functions.logger.info("Brief request received", {
    method: req.method,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ success: false, error: "Request must be multipart/form-data" });
  }

  // Initialize body and files
  req.body = {};
  req.files = [];

  try {
    // Get the raw body as a buffer first (avoids streaming issues with Firebase Functions)
    const rawBody = await getRawBody(req, {
      length: req.headers['content-length'],
      limit: '50mb', // Total request size limit
      encoding: false // Return as buffer
    });

    return new Promise((resolve, reject) => {
      const busboyInstance = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
      let fileCount = 0;
      const maxFiles = 10;
      let hasError = false;

      busboyInstance.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        
        if (fileCount >= maxFiles) {
          file.resume(); // Drain the file stream
          return;
        }

        fileCount++;
        const chunks = [];
        let totalSize = 0;

        file.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > 10 * 1024 * 1024) {
            file.resume(); // Drain if too large
            return;
          }
          chunks.push(chunk);
        });

        file.on('end', () => {
          if (totalSize <= 10 * 1024 * 1024) {
            req.files.push({
              fieldname: name,
              originalname: filename,
              encoding: encoding,
              mimetype: mimeType,
              buffer: Buffer.concat(chunks),
              size: totalSize
            });
          }
        });

        file.on('error', (err) => {
          if (!hasError) {
            hasError = true;
            functions.logger.error("File stream error", { error: err.message });
          }
        });
      });

      busboyInstance.on('field', (name, value, info) => {
        req.body[name] = value;
      });

      busboyInstance.on('finish', () => {
        if (!hasError) {
          functions.logger.info("Multipart parsing finished", {
            bodyKeys: Object.keys(req.body),
            filesCount: req.files.length
          });
          resolve();
          next();
        }
      });

      busboyInstance.on('error', (err) => {
        if (!hasError) {
          hasError = true;
          functions.logger.error("Busboy error", { error: err.message, stack: err.stack });
          reject(err);
          res.status(400).json({ success: false, error: `File upload error: ${err.message}` });
        }
      });

      // Create a readable stream from the buffer and pipe to busboy
      const stream = require('stream');
      const readable = new stream.Readable();
      readable.push(rawBody);
      readable.push(null);
      readable.pipe(busboyInstance);
    }).catch((err) => {
      // Error already handled in busboy error handler
    });
  } catch (error) {
    functions.logger.error("Failed to read request body", { error: error.message });
    return res.status(400).json({ success: false, error: `Failed to read request: ${error.message}` });
  }
};

// Brief submission endpoint (must be before express.json() to avoid stream consumption)
app.options("/api/brief", cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

app.post("/api/brief", cors(corsOptions), handleMultipart, async (req, res) => {
  try {
    functions.logger.info("Brief submission received", { 
      body: req.body, 
      files: req.files?.length || 0,
      contentType: req.headers['content-type']
    });
    
    const { name, email, brief } = req.body;

    functions.logger.info("Parsed form data", { 
      name: name ? `${name.substring(0, 20)}...` : 'missing',
      email: email ? `${email.substring(0, 20)}...` : 'missing',
      brief: brief ? `${brief.substring(0, 50)}...` : 'missing',
      bodyKeys: Object.keys(req.body || {}),
      filesCount: req.files?.length || 0
    });

    if (!name || !email || !brief) {
      const missing = [];
      if (!name) missing.push('name');
      if (!email) missing.push('email');
      if (!brief) missing.push('brief');
      functions.logger.warn("Missing required fields", { missing, bodyKeys: Object.keys(req.body || {}) });
      res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}. Please make sure all fields are filled out.` 
      });
      return;
    }

    // Process attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      // Filter to only actual file uploads (fieldname === 'files')
      const fileUploads = req.files.filter(file => file.fieldname === 'files');
      for (const file of fileUploads) {
        attachments.push({
          filename: file.originalname,
          contentType: file.mimetype,
          content: file.buffer.toString("base64"),
        });
      }
    }

    // Escape HTML in brief content for safety, but preserve line breaks
    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Escape names and email (simple text)
    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    // Brief content will be displayed with pre-wrap, so just escape HTML tags
    const escapedBrief = escapeHtml(brief);

    // Send confirmation email to user
    try {
      functions.logger.info("Sending confirmation email to user", { email });
      const confirmationHtml = getEmailTemplate(
        createBriefConfirmationEmailContent({ name: escapedName, brief: escapedBrief })
      );
      await sendEmail({
        to: email,
        subject: "We've Received Your Project Brief!",
        htmlBody: confirmationHtml,
      });
      functions.logger.info("Confirmation email sent successfully");
    } catch (emailError) {
      functions.logger.error("Failed to send confirmation email", { error: emailError.message, stack: emailError.stack });
      // Don't fail the request if confirmation email fails
    }

    // Send notification email to me with attachments
    try {
      functions.logger.info("Sending notification email", { to: NOTIFICATION_EMAIL, attachments: attachments.length });
      const notificationHtml = getEmailTemplate(
        createBriefNotificationEmailContent(
          { name: escapedName, email: escapedEmail, brief: escapedBrief, attachmentCount: attachments.length },
          attachments.length > 0
        )
      );
      await sendEmail({
        to: NOTIFICATION_EMAIL,
        subject: `New Custom Project Brief from ${escapedName}`,
        htmlBody: notificationHtml,
        attachments: attachments,
      });
      functions.logger.info("Notification email sent successfully");
    } catch (emailError) {
      functions.logger.error("Failed to send notification email", { error: emailError.message, stack: emailError.stack });
      // Still return success even if notification fails, but log it
    }

    res.json({
      success: true,
      message: "Brief submitted successfully. You will receive a confirmation email shortly.",
    });
  } catch (error) {
    functions.logger.error("Failed to process brief submission", { 
      error: error.message, 
      stack: error.stack,
      name: error.name 
    });
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to submit brief.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const scheduleRouter = express.Router();

scheduleRouter.get("/slots", async (req, res) => {
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

scheduleRouter.post("/book", async (req, res) => {
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

app.use(scheduleRouter);
app.use("/api/schedule", scheduleRouter);

export const schedule = functions
  .region("us-central1")
  .runWith({ secrets: ["GOOGLE_SERVICE_ACCOUNT"] })
  .https.onRequest(app);
