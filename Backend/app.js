import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./Middleware/error.middleware.js";
import authRoute from "./routes/auth.route.js"
import productRoute from "./routes/product.route.js"
import bannerRoute from "./routes/banner.route.js"
import userRoute from "./routes/user.route.js"
import orderRoute from "./routes/order.route.js"
import stripeRoute from "./routes/stripe.js"
import analyticsRoute from "./routes/analytics.route.js";
import bundleRoute from "./routes/bundle.routes.js";
import paymentRoute from "./routes/payment.route.js"; // Add this line
import uploadRoute from "./routes/upload.route.js"; // Add this line
import shippingRoute from "./routes/shipping.route.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { functions } from "./inngest/index.js";



const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
};

// cors
app.use(cors(corsOptions));

// cookie-parser must run before protected routes, including Stripe checkout.
app.use(cookieParser());

// Stripe route BEFORE express.json()
app.use("/api/v1/stripe", stripeRoute);

// json body
app.use(express.json());

// Register the Inngest endpoint so the CLI/dashboard can discover this app.
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);
console.log("Inngest endpoint registered");

// Temporary test route to publish a Brevo email event into Inngest.
app.post("/api/test-brevo-email", async (req, res, next) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await inngest.send({
      name: "test/brevo.email",
      data: {
        email: req.body.email,
        name: req.body.name || "Test User",
        message: req.body.message || "Brevo + Inngest test email",
      },
    });

    console.log("Brevo email event sent");
    res.status(200).json({
      success: true,
      message: "Brevo email event sent",
    });
  } catch (error) {
    next(error);
  }
});

// Serve static files from the data folder (e.g. product images)
app.use("/data", express.static(path.join(__dirname, "data")));

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/products", productRoute)
app.use("/api/v1/banners", bannerRoute)
app.use("/api/v1/users", userRoute)
app.use("/api/v1/orders", orderRoute)
app.use("/api/v1/bundles", bundleRoute)
app.use("/api/v1/analytics", analyticsRoute);
app.use("/api/v1/payments", paymentRoute) // Add this line
app.use("/api/v1/upload", uploadRoute); // Add this line
app.use("/api/v1/shipping", shippingRoute);

// Error middleware
app.use(notFound);
app.use(errorHandler);



export default app;
