import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

// Stripe Client Lazy Initialization
let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

// Gemini Client Lazy Initialization
let genAI: GoogleGenAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ 
          error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.",
          isDemo: true 
        });
      }

      const { amount, currency, weddingName, itemName } = req.body;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency || "inr",
              product_data: {
                name: `${weddingName}: ${itemName}`,
              },
              unit_amount: amount * 100, // amount in cents/paise
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/dashboard?payment_success=true`,
        cancel_url: `${req.headers.origin}/dashboard?payment_cancel=true`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes using Gemini
  app.post("/api/ai/vendor-suggestions", async (req, res) => {
    try {
      const ai = getGenAI();
      const { budget, style, location, guestCount, category, preferences } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 3 luxury vendors for the following wedding category in India: ${category}.
        Wedding Details:
        - Budget Segment: ${budget}
        - Style: ${style}
        - Location: ${location}
        - Guest Count: ${guestCount}
        - Specific Preferences: ${preferences || "None specified"}
        
        Provide high-end, realistic vendor names and comprehensive profiles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    reviews: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          user: { type: Type.STRING },
                          comment: { type: Type.STRING },
                          rating: { type: Type.NUMBER }
                        }
                      }
                    },
                    portfolio: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of 3 highlight works or styles"
                    }
                  },
                  required: ["name", "role", "reason", "estimatedCost", "reviews", "portfolio"]
                }
              }
            }
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Vendor Suggestion Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate suggestions" });
    }
  });

  app.post("/api/finalize-booking", async (req, res) => {
    try {
      const { vendor, userEmail, weddingName } = req.body;
      
      const emailHtml = `
        <div style="font-family: 'Playfair Display', serif; background-color: #fffaf0; padding: 40px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #d4af37;">
          <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px;">
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; margin: 0; color: #b8860b;">The Royal Order of</p>
            <h1 style="font-size: 32px; margin: 5px 0; color: #1a1a1a; letter-spacing: 2px;">EVENTORA</h1>
          </div>
          
          <h2 style="font-weight: 400; text-align: center; color: #b8860b;">Contract Finalized</h2>
          <p style="line-height: 1.6; text-align: center;">Namaste, we are pleased to confirm that the strategic alliance for <strong>${weddingName}</strong> has been etched into the royal record.</p>
          
          <div style="background-color: #fff; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #eee;">
            <p style="text-transform: uppercase; font-size: 9px; letter-spacing: 2px; color: #999; margin-bottom: 10px;">Partner Details</p>
            <h3 style="margin: 0; color: #1a1a1a;">${vendor.name}</h3>
            <p style="margin: 5px 0; color: #b8860b; font-size: 12px; font-weight: bold;">${vendor.role}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #999;">Contact:</td>
                <td style="text-align: right;">${vendor.contact}</td>
              </tr>
              <tr>
                <td style="color: #999;">Booking Date:</td>
                <td style="text-align: right;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px;">
            <h4 style="text-transform: uppercase; font-size: 11px; letter-spacing: 2px; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 10px;">The Next Horizon</h4>
            <ul style="font-size: 13px; line-height: 1.8; color: #444; padding-left: 20px;">
              <li>Electronic deposit verification (within 24 cycles)</li>
              <li>Direct liaison established with <strong>${vendor.contact}</strong></li>
              <li>Timeline synchronization via Domain Nexus</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 11px; font-style: italic; color: #999;">Ensuring every petal falls with precision.</p>
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #b8860b; margin-top: 20px;">Mojo AI Registry Control</p>
          </div>
        </div>
      `;

      console.log(`[EMAIL SYSTEM] Dispatching Luxury Confirmation to: ${userEmail}`);
      console.log(`[EMAIL SYSTEM] Template Generated:\n${emailHtml}`);
      console.log(`[EMAIL SYSTEM] Sending Partner Briefing to: vendor-contact@${vendor.name.toLowerCase().replace(/\s+/g, '')}.com`);
      
      res.json({ 
        success: true, 
        log: "Luxury Confirmation Dispatched",
        preview: "A physical letter from Eventora is being simulated."
      });
    } catch (error) {
      console.error("Booking Finalization Error:", error);
      res.status(500).json({ error: "Failed to process finalization" });
    }
  });

  app.post("/api/verify-domain", async (req, res) => {
    try {
      const { url } = req.body;
      console.log(`[DNS SYSTEM] Probing domain: ${url}`);
      
      // Simulate DNS lookup delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deterministic simulation
      const isAvailable = url.includes("eventora") || url.length < 5;
      
      res.json({ 
        success: true, 
        verified: !isAvailable, 
        dnsConfig: {
          type: "CNAME",
          value: "domains.eventora.royal"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "DNS Probe Failed" });
    }
  });

  app.post("/api/ai/concierge", async (req, res) => {
    try {
      const ai = getGenAI();
      const { prompt, history, weddingContext } = req.body;
      
      const chat = ai.chats.create({ 
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are Mojo, the elite butler and digital concierge for EVENTORA.
          Role: Professional butler and luxury voice assistant.
          Voice: Polished, aristocratic, and strictly concise.
          Constraint: Respond in ONE or TWO sentences maximum. Use direct, elegant language.
          Tone: Majestic and polite. Avoid conversational fluff or excessive enthusiasm.
          Style: Simple voice assistant style. Focus on absolute utility.
          Formatting: Plain text only.
          Wedding Data: ${JSON.stringify(weddingContext)}`
        },
        history: history || [],
      });

      const result = await chat.sendMessage({ message: prompt });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Concierge Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
