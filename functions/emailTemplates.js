const getEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .button { width: 100% !important; max-width: 300px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #202124; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d30;">
                    <tr>
                        <td style="padding: 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); height: 4px;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #202124;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <span style="font-family: Arial, sans-serif; font-size: 28px; font-weight: 600; color: #f8f9fa; vertical-align: middle;">
                                            <span style="color: #4285F4;">Automation</span> <span style="color: #34A853;">by</span> <span style="color: #FBBC04;">Meir</span>
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 40px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #2d2d30; padding: 30px 40px; border-top: 1px solid #424242;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-family: Arial, sans-serif; font-size: 14px; color: #5f6368; line-height: 1.6;">
                                        <p style="margin: 0 0 10px 0;">Automation by Meir</p>
                                        <p style="margin: 0;">Transform Your Business with Intelligent Automation</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const createNotificationEmailContent = (data, timezone, meetingDurationMinutes) => {
  const formattedDate = new Date(data.dateTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  });

  const meetButton = data.meetLink
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${data.meetLink}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 50px;">
            Join Google Meet
          </a>
        </td>
      </tr>
    </table>`
    : '';

  return `
    <h1 style="font-family: 'Inter', Arial, sans-serif; font-size: 24px; color: #f8f9fa; margin: 0 0 20px 0; text-align: center;">
      New Consultation Scheduled! 🎉
    </h1>
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; width: 80px;">Client:</td>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #4285F4; font-weight: 600;">${data.name}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; width: 80px;">Email:</td>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #34A853;">
                  <a href="mailto:${data.email}" style="color: #34A853; text-decoration: none;">${data.email}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; width: 80px;">Time:</td>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #FBBC04; font-weight: 600;">${formattedDate} · ${meetingDurationMinutes} min</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    ${meetButton}
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #f8f9fa; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #4285F4;">
        Project Details
      </h2>
      <div style="background-color: #2d2d30; border-radius: 8px; padding: 20px;">
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #cbd5e1; margin: 0; white-space: pre-wrap; line-height: 1.6;">
          ${data.details}
        </p>
      </div>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-top: 20px;">
          <a href="https://calendar.google.com" style="display: inline-block; padding: 12px 32px; background-color: #2d2d30; color: #cbd5e1; font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 50px; border: 1px solid #424242;">
            View in Calendar
          </a>
        </td>
      </tr>
    </table>`;
};

const createEnglishEmailContent = (data, timezone, meetingDurationMinutes) => {
  const formattedDate = new Date(data.dateTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  });

  const meetSection = data.meetLink
    ? `
    <tr>
      <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; padding-top: 12px;">
        <strong style="color: #4285F4;">💻 Meeting Link:</strong><br>
        <a href="${data.meetLink}" style="color: #4285F4; text-decoration: none;">Join Google Meet</a>
      </td>
    </tr>`
    : '';

  return `
    <h1 style="font-family: 'Inter', Arial, sans-serif; font-size: 24px; color: #f8f9fa; margin: 0 0 20px 0;">
      Hi ${data.name},
    </h1>
    
    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">
      Thank you for reaching out! I'm excited to discuss your project and explore how we can transform your business with intelligent automation.
    </p>
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #4285F4; margin: 0 0 16px 0;">
        Meeting Details
      </h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa;">
            <strong style="color: #FBBC04;">📅 Date & Time:</strong><br>
            ${formattedDate} (${timezone})
          </td>
        </tr>
        <tr>
          <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; padding-top: 12px;">
            <strong style="color: #34A853;">⏱️ Duration:</strong><br>
            ${meetingDurationMinutes} minutes
          </td>
        </tr>
        ${meetSection}
      </table>
    </div>
    
    ${data.meetLink
      ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <a href="${data.meetLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);">
            Join Google Meet
          </a>
        </td>
      </tr>
    </table>`
      : ''}
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #4285F4; margin: 0 0 12px 0;">
        Your Project Details:
      </h3>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #cbd5e1; margin: 0; white-space: pre-wrap; line-height: 1.6;">
        ${data.details}
      </p>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; margin: 0 0 20px 0;">
            A calendar invitation has been sent to your email.
          </p>
        </td>
      </tr>
    </table>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #424242;">
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; margin: 0;">
        Looking forward to speaking with you!
      </p>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #f8f9fa; margin: 10px 0 0 0; font-weight: 600;">
        Meir Horwitz
      </p>
    </div>`;
};

const createHebrewEmailContent = (data, timezone, meetingDurationMinutes) => {
  const formattedDate = new Date(data.dateTime).toLocaleString('he-IL', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  });

  const meetSection = data.meetLink
    ? `
    <tr>
      <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; padding-top: 12px; text-align: right;">
        <strong style="color: #4285F4;">💻 קישור לפגישה:</strong><br>
        <a href="${data.meetLink}" style="color: #4285F4; text-decoration: none;">הצטרף ל-Google Meet</a>
      </td>
    </tr>`
    : '';

  return `
    <div dir="rtl" style="text-align: right;">
      <h1 style="font-family: 'Inter', Arial, sans-serif; font-size: 24px; color: #f8f9fa; margin: 0 0 20px 0;">
        שלום ${data.name},
      </h1>
      
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.8; margin: 0 0 24px 0;">
        תודה על פנייתך! אני נרגש לדון בפרויקט שלך ולחקור כיצד נוכל לשנות את העסק שלך עם אוטומציה חכמה.
      </p>
      
      <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #4285F4; margin: 0 0 16px 0;">
          פרטי הפגישה
        </h2>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; text-align: right;">
              <strong style="color: #FBBC04;">📅 תאריך ושעה:</strong><br>
              ${formattedDate} (${timezone})
            </td>
          </tr>
          <tr>
            <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; padding-top: 12px; text-align: right;">
              <strong style="color: #34A853;">⏱️ משך הפגישה:</strong><br>
              ${meetingDurationMinutes} דקות
            </td>
          </tr>
          ${meetSection}
        </table>
      </div>
      
      ${data.meetLink
        ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <a href="${data.meetLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);">
              הצטרף ל-Google Meet
            </a>
          </td>
        </tr>
      </table>`
        : ''}
      
      <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #4285F4; margin: 0 0 12px 0;">
          פרטי הפרויקט שלך:
        </h3>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #cbd5e1; margin: 0; white-space: pre-wrap; line-height: 1.8;">
          ${data.details}
        </p>
      </div>
      
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; margin: 0 0 20px 0;">
              הזמנה לאירוע ביומן נשלחה למייל שלך.
            </p>
          </td>
        </tr>
      </table>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #424242;">
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; margin: 0;">
          מצפה לדבר איתך!
        </p>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #f8f9fa; margin: 10px 0 0 0; font-weight: 600;">
          מאיר הורביץ
        </p>
      </div>
    </div>`;
};

const createBriefConfirmationEmailContent = (data) => {
  return `
    <h1 style="font-family: 'Inter', Arial, sans-serif; font-size: 24px; color: #f8f9fa; margin: 0 0 20px 0;">
      Hi ${data.name},
    </h1>
    
    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">
      Thank you for submitting your project brief! We've received your request and are excited to learn more about your automation needs.
    </p>
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #4285F4; margin: 0 0 16px 0;">
        What Happens Next?
      </h2>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0;">
        Our team will carefully review your brief and get back to you with a customized offer within <strong style="color: #34A853;">1-3 business days</strong>. We'll provide you with:
      </p>
      <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.8; margin: 16px 0 0 0; padding-left: 24px;">
        <li>A detailed proposal tailored to your requirements</li>
        <li>Timeline and delivery estimates</li>
        <li>Pricing information</li>
        <li>Next steps to get started</li>
      </ul>
    </div>
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #4285F4; margin: 0 0 12px 0;">
        Your Project Brief:
      </h3>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #cbd5e1; margin: 0; white-space: pre-wrap; line-height: 1.6;">
        ${data.brief}
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #424242;">
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #cbd5e1; margin: 0;">
        We're looking forward to working with you!
      </p>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #f8f9fa; margin: 10px 0 0 0; font-weight: 600;">
        Meir Horwitz
      </p>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; margin: 10px 0 0 0;">
        Automation by Meir
      </p>
    </div>`;
};

const createBriefNotificationEmailContent = (data, hasAttachments) => {
  const attachmentsNote = hasAttachments 
    ? `<tr>
        <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #f8f9fa; padding-top: 12px;">
          <strong style="color: #34A853;">📎 Attachments:</strong><br>
          ${data.attachmentCount} file(s) attached to this email
        </td>
      </tr>`
    : '';

  return `
    <h1 style="font-family: 'Inter', Arial, sans-serif; font-size: 24px; color: #f8f9fa; margin: 0 0 20px 0; text-align: center;">
      New Custom Project Brief Received! 🎉
    </h1>
    
    <div style="background-color: #2d2d30; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; width: 80px;">Client:</td>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #4285F4; font-weight: 600;">${data.name}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; width: 80px;">Email:</td>
                <td style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #34A853;">
                  <a href="mailto:${data.email}" style="color: #34A853; text-decoration: none;">${data.email}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${attachmentsNote}
      </table>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #f8f9fa; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #4285F4;">
        Project Brief
      </h2>
      <div style="background-color: #2d2d30; border-radius: 8px; padding: 20px;">
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #cbd5e1; margin: 0; white-space: pre-wrap; line-height: 1.6;">
          ${data.brief}
        </p>
      </div>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-top: 20px;">
          <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5f6368; margin: 0;">
            Please review the brief and respond with a customized offer within 1-3 business days.
          </p>
        </td>
      </tr>
    </table>`;
};

export { 
  getEmailTemplate, 
  createNotificationEmailContent, 
  createEnglishEmailContent, 
  createHebrewEmailContent,
  createBriefConfirmationEmailContent,
  createBriefNotificationEmailContent
};
