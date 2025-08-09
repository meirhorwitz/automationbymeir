// server.js

import express from "express";
import "dotenv/config";
import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrdersController,
} from "@paypal/paypal-server-sdk";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Basic validation for environment variables
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("FATAL ERROR: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in your .env file.");
    process.exit(1);
}

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: Environment.Sandbox, // Use Environment.Live for production
    logging: {
        logLevel: LogLevel.Info,
        logRequest: {
            logBody: true,
        },
        logResponse: {
            logHeaders: true,
        },
    },
});

const ordersController = new OrdersController(client);

// This function handles order creation
const createOrder = async(amount) => {
    const request = {
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [{
                amount: {
                    currencyCode: "USD",
                    value: amount, // Use the dynamic amount from the request
                },
            }, ],
        },
        prefer: "return=minimal",
    };

    try {
        const { body, ...httpResponse } = await ordersController.createOrder(request);
        return {
            jsonResponse: JSON.parse(body),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            console.error("PayPal API Error on Create:", error.message);
            throw new Error(error.message);
        }
        console.error("Generic Error on Create:", error);
        throw error;
    }
};

// This function handles order capture
const captureOrder = async(orderID) => {
    const request = {
        id: orderID,
        prefer: "return=minimal",
    };

    try {
        const { body, ...httpResponse } = await ordersController.captureOrder(request);
        return {
            jsonResponse: JSON.parse(body),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            console.error("PayPal API Error on Capture:", error.message);
            throw new Error(error.message);
        }
        console.error("Generic Error on Capture:", error);
        throw error;
    }
};

// API endpoint to create an order
app.post("/api/orders", async(req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: "Invalid amount provided." });
        }
        const { jsonResponse, httpStatusCode } = await createOrder(amount);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

// API endpoint to capture an order
app.post("/api/orders/:orderID/capture", async(req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to capture order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

// Interpret layout instructions via OpenAI
app.post("/api/layout", async (req, res) => {
    try {
        const { message } = req.body;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a layout assistant. Respond with a JSON array of objects, each with id, x, and y numbers. Example: [{\"id\":\"service-1\",\"x\":10,\"y\":20}]"
                },
                { role: "user", content: message }
            ]
        });

        const reply = completion.choices[0].message.content;
        res.json({ instructions: reply });
    } catch (error) {
        console.error("OpenAI request failed:", error);
        res.status(500).json({ error: "Error contacting OpenAI" });
    }
});

// Dynamic sitemap for SEO
app.get('/sitemap.xml', (req, res) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const pages = ['', 'index-he.html', 'automation-playground.html', 'payment.html', 'showcase1.html', 'showcase2.html', 'why-automation.html'];
    const urls = pages.map(p => `<url><loc>${base}/${p}</loc></url>`).join('');
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

app.listen(PORT, () => {
    console.log(`Node server listening at http://localhost:${PORT}/`);
});
