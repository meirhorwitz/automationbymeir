# Firebase scheduling service setup (step-by-step)

Follow the numbered checklist below to wire the new Firebase Cloud Function to your Google Workspace domain (`service@automationbymeir.com`) and move the project ownership. Do not skip any step—the later commands assume the earlier configuration is complete.

## 1. Prepare your workstation

1. Install the latest **gcloud CLI** and **Firebase CLI**.
2. Authenticate both CLIs against the target project:

   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project <PROJECT_ID>

   firebase login
   firebase use <PROJECT_ID>
   ```

3. Confirm you can see the Firebase project in the Firebase console and you have Workspace admin access for `automationbymeir.com`.

## 2. Enable the required Google Cloud APIs

The function needs Calendar, Gmail, and Secret Manager. Enable them **before** creating credentials so the service account can access them immediately.

```bash
gcloud services enable \
  calendar.googleapis.com \
  gmail.googleapis.com \
  secretmanager.googleapis.com \
  --project <PROJECT_ID>
```

You can also verify in the Cloud console under **APIs & Services → Enabled APIs & services**.

## 3. Create the service account and share the calendar

1. In the Cloud console navigate to **IAM & Admin → Service Accounts → Create Service Account**.
2. Name it something like `scheduler-fire-functions` and click **Create and continue**.
3. Assign these roles:
   - **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`)
   - **Calendar Admin** (`roles/calendar.admin`)
4. Finish the wizard, then click the new account → **Keys → Add key → Create new key** → **JSON**. Save the JSON file securely (used in later steps) and delete any local copies once the secret upload (step 5) succeeds.
5. Open Google Calendar with the target calendar (`c02776ec8607a45db9642162d044291e27efa559df388c8190ca267018482661@group.calendar.google.com`), click **Settings & sharing → Share with specific people** and grant the service account **Make changes to events**.

## 4. Grant Workspace domain-wide delegation

1. In the Workspace Admin console open **Security → API controls → Domain-wide delegation**.
2. Click **Add new** and enter:
   - **Client ID:** the service account's unique ID (visible in the JSON file or the service account details page).
   - **OAuth scopes:**
     ```
     https://www.googleapis.com/auth/calendar,
     https://www.googleapis.com/auth/calendar.events,
     https://www.googleapis.com/auth/gmail.send
     ```
3. Save the delegation, then ensure the `service@automationbymeir.com` mailbox is active with Gmail enabled (no additional UI changes are required).

## 5. Store the service account key in Secret Manager

1. Upload the JSON key you downloaded in step 3 to Secret Manager. **Do not commit this key to Git or store it in the repository**—the secret should live only in Secret Manager (or an encrypted secrets vault):

   ```bash
   gcloud secrets create GOOGLE_SERVICE_ACCOUNT \
     --project <PROJECT_ID> \
     --replication-policy="automatic"
   ```

2. Add the first version containing the downloaded key:

   ```bash
   gcloud secrets versions add GOOGLE_SERVICE_ACCOUNT \
     --project <PROJECT_ID> \
     --data-file=/absolute/path/to/service-account-key.json
   ```

> **Tip:** If the secret already exists, skip `gcloud secrets create` and only run the `versions add` command to update it.

## 6. Configure Firebase Functions runtime settings

1. From the repository root, set the function configuration values once:

   ```bash
   firebase functions:config:set \
     scheduling.calendar_id="c02776ec8607a45db9642162d044291e27efa559df388c8190ca267018482661@group.calendar.google.com" \
     scheduling.notification_email="service@automationbymeir.com" \
     scheduling.delegated_user="service@automationbymeir.com" \
     scheduling.timezone="Asia/Jerusalem" \
     scheduling.meeting_duration="30" \
     scheduling.start_hour="9" \
     scheduling.end_hour="17"
   ```

2. (Optional) Inspect the saved values with `firebase functions:config:get scheduling`.

## 7. Attach the secret to the Firebase function

1. Register the Secret Manager secret so Firebase can mount it during deploys:

   ```bash
   firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT \
     --project <PROJECT_ID> \
     --data-file=/absolute/path/to/service-account-key.json
   ```

2. Firebase automatically keeps the secret in sync on future deploys. If you prefer the gcloud CLI, use:

   ```bash
   gcloud functions deploy schedule \
     --project <PROJECT_ID> \
     --region=us-central1 \
     --runtime=nodejs20 \
     --source=functions \
     --entry-point=schedule \
     --trigger-http \
     --allow-unauthenticated \
     --set-secrets=GOOGLE_SERVICE_ACCOUNT=GOOGLE_SERVICE_ACCOUNT:latest
   ```

## 8. Deploy the updated backend and hosting rewrite

Run the deploy after the configuration and secret are in place:

```bash
firebase deploy --only hosting,functions:schedule --project <PROJECT_ID>
```

This publishes the Cloud Function and the `/api/schedule/**` Hosting rewrite. The English and Hebrew contact forms will automatically use the new endpoints.

> **Local testing:** when using `firebase emulators:start`, export the same values locally (for example `export GOOGLE_SERVICE_ACCOUNT=$(cat key.json)` and `export FUNCTIONS_CONFIG_SCHEDULING='{"calendar_id":"…"}'`).

## 9. Transfer project ownership to `service@automationbymeir.com`

1. Cloud console → **IAM & Admin → IAM → Grant Access** → add `service@automationbymeir.com` with the **Owner** role.
2. Verify the new owner appears, then (optionally) remove or downgrade the previous owner from the same page.
3. Confirm the ownership change in the Firebase console under **Project Settings → Users and permissions**.

CLI equivalents:

```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="user:service@automationbymeir.com" \
  --role="roles/owner"

# Optional: remove the old owner once the new owner is confirmed
gcloud projects remove-iam-policy-binding <PROJECT_ID> \
  --member="user:old-owner@example.com" \
  --role="roles/owner"
```

At this point, the scheduling function runs entirely on Firebase/GCP with the new domain account as the project owner—no Google Apps Script proxy required.
