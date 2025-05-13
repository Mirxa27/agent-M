import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { paymentService } from "../services/payment-service";

export const paymentRouter = Router();

// Payment Routes
paymentRouter.post("/payments/create-session", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }
    const plan = await storage.getPlan(parseInt(planId));
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const paymentSession = await paymentService.createPaymentSession(req.user.id, parseInt(planId));
    res.json(paymentSession);
  } catch (error: any) {
    console.error("Payment session creation error:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

paymentRouter.get("/payments/callback", async (req: Request, res: Response) => {
  try {
    const paymentId = req.query.paymentId;
    if (!paymentId) {
      return res.redirect("/payment-failed?reason=no-payment-id");
    }
    const verification = await paymentService.verifyPayment(paymentId.toString());
    if (!verification.isValid) {
      return res.redirect("/payment-failed?reason=verification-failed");
    }
    res.redirect("/payment-success");
  } catch (error: any) {
    console.error("Payment callback error:", error);
    res.redirect(`/payment-failed?reason=${encodeURIComponent(handleError(error))}`);
  }
});

paymentRouter.get("/payments/error", (req: Request, res: Response) => {
  res.redirect("/payment-failed?reason=gateway-error");
});

paymentRouter.post("/payments/webhook", async (req: Request, res: Response) => {
  try {
    console.log("Received payment webhook:", req.body);
    const { InvoiceId, PaymentId } = req.body;
    if (!PaymentId) {
      return res.status(400).json({ error: "Missing payment ID" });
    }
    const verification = await paymentService.verifyPayment(PaymentId.toString());
    if (!verification.isValid) {
      console.error("Payment verification failed in webhook", { PaymentId, InvoiceId });
      return res.status(400).json({ error: "Payment verification failed" });
    }
    // Actual subscription update would happen here based on paymentRecord
    res.status(200).json({ status: "success" });
  } catch (error: any) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Subscription status
paymentRouter.get("/subscription", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let planDetails = null;
    if (user.planId) {
      planDetails = await storage.getPlan(user.planId);
    }
    const planName = planDetails ? planDetails.name : "free";
    res.json({
      plan: planName,
      planExpiresAt: user.planExpiresAt,
      planDetails: planDetails,
    });
  } catch (error: any) {
    res.status(500).json({ error: handleError(error) });
  }
});
