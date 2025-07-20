# Automation by Meir

This project is a small demo using PayPal, a Node Express server, and Google Apps Script.

## Serving the site securely

Firebase Hosting automatically provides HTTPS. Deploying the static site there resolves the browser's “Not Secure” warning.

### Prerequisites

- Install Node.js
- Install the Firebase CLI: `npm install -g firebase-tools`
- Log in to Firebase and set the default project:
  ```bash
  firebase login
  firebase use --add
  ```
  When prompted, select the Firebase project associated with this repo.

### Deployment steps

1. Build the static assets:
   ```bash
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

Firebase will host the files in `public/` over HTTPS.

### Optional: deploy the API

If you run the Express API separately, deploy it to a hosting provider that supports TLS, such as Google Cloud Run. Update the `vite.config.js` proxy target to the HTTPS URL of your API.

