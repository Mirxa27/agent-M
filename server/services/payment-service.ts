import { storage } from "../storage";
import MyFatoorah from "myfatoorah-javascript";
import { User, Plan } from "@shared/schema";

// Initialize MyFatoorah with API key
if (!process.env.MYFATOORAH_API_KEY) {
  throw new Error("MYFATOORAH_API_KEY environment variable must be set");
}

// Use the API key from environment variables
const myfatoorah = new MyFatoorah(process.env.MYFATOORAH_API_KEY);

/**
 * Service for handling payments using MyFatoorah
 */
export class PaymentService {
  /**
   * Creates a payment session for a user to subscribe to a plan
   * 
   * @param userId - The ID of the user making the payment
   * @param planId - The ID of the plan being purchased
   * @returns Payment session details including the payment URL
   */
  async createPaymentSession(userId: number, planId: number): Promise<{ 
    sessionId: string;
    paymentUrl: string;
  }> {
    // Get user and plan information
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const plan = await storage.getPlan(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }
    
    if (!user.email) {
      throw new Error("User email is required for payment processing");
    }
    
    // Create a payment link
    const payload = {
      CustomerName: user.fullName || user.username,
      NotificationOption: "LNK",
      MobileCountryCode: "+966",
      CustomerMobile: "", // Would be filled from user profile in a real implementation
      CustomerEmail: user.email,
      InvoiceValue: plan.price,
      DisplayCurrencyIso: "SAR", // Saudi Riyal
      CallBackUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/payments/callback`,
      ErrorUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/payments/error`,
      Language: "en",
      InvoiceItems: [
        {
          ItemName: `${plan.name} Subscription`,
          Quantity: 1,
          UnitPrice: plan.price
        }
      ]
    };
    
    // Setup MyFatoorah API request
    try {
      const response = await myfatoorah.executePayment(payload);
      
      // Return the payment session details
      return {
        sessionId: response.InvoiceId.toString(),
        paymentUrl: response.InvoiceURL
      };
    } catch (error) {
      console.error('MyFatoorah payment creation error:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }
  
  /**
   * Verifies a payment based on the payment ID/session ID
   * 
   * @param paymentId - The payment ID received from MyFatoorah callback
   * @returns Whether the payment was successful
   */
  async verifyPayment(paymentId: string): Promise<{
    isValid: boolean;
    invoiceId?: string;
    invoiceReference?: string;
    transactionId?: string;
    paymentMethod?: string;
    amount?: number;
  }> {
    try {
      const response = await myfatoorah.getPaymentStatus(paymentId);
      
      if (response.InvoiceStatus === "Paid") {
        return {
          isValid: true,
          invoiceId: response.InvoiceId,
          invoiceReference: response.InvoiceReference,
          transactionId: response.TransactionId,
          paymentMethod: response.PaymentGateway,
          amount: response.InvoiceValue
        };
      } else {
        return {
          isValid: false
        };
      }
    } catch (error) {
      console.error('MyFatoorah payment verification error:', error);
      return {
        isValid: false
      };
    }
  }
  
  /**
   * Updates a user's subscription based on a successful payment
   * 
   * @param userId - User ID
   * @param planId - Plan ID
   * @param paymentDetails - Payment details from verification
   */
  async updateUserSubscription(
    userId: number, 
    planId: number,
    paymentDetails: { 
      invoiceId: string;
      transactionId: string; 
      paymentMethod: string;
    }
  ): Promise<User> {
    // Get user and plan 
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const plan = await storage.getPlan(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }
    
    // Calculate expiration date based on plan interval
    const now = new Date();
    let expirationDate: Date;
    
    switch(plan.interval) {
      case "monthly":
        expirationDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case "yearly":
        expirationDate = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      default:
        expirationDate = new Date(now.setMonth(now.getMonth() + 1));
    }
    
    // Update user subscription information
    const updatedUser = await storage.updateUser(userId, {
      plan: plan.name.toLowerCase(),
      planExpiresAt: expirationDate,
      // Could store payment details in a separate payments table in a real implementation
    });
    
    if (!updatedUser) {
      throw new Error("Failed to update user subscription");
    }
    
    return updatedUser;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();