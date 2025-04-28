import { storage } from "../storage";
import axios from "axios";
import { User, Plan } from "@shared/schema";

// Initialize MyFatoorah configuration
if (!process.env.MYFATOORAH_API_KEY) {
  throw new Error("MYFATOORAH_API_KEY environment variable must be set");
}

// MyFatoorah API configuration
// For production, change this to "https://api.myfatoorah.com"
const MYFATOORAH_BASE_URL = "https://apitest.myfatoorah.com"; 
const MYFATOORAH_API_KEY = process.env.MYFATOORAH_API_KEY;

// Create axios instance for MyFatoorah API
const myfatoorahClient = axios.create({
  baseURL: MYFATOORAH_BASE_URL,
  headers: {
    'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

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
    
    // Create a payment link using MyFatoorah's InitiatePayment endpoint
    const payload = {
      CustomerName: user.fullName || user.username,
      NotificationOption: "LNK", // Link notification
      MobileCountryCode: "+966",
      CustomerMobile: "", // Would be filled from user profile in a real implementation
      CustomerEmail: user.email,
      InvoiceValue: plan.price,
      DisplayCurrencyIso: "SAR", // Saudi Riyal as requested
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
    
    // Make request to MyFatoorah API
    try {
      console.log('Creating MyFatoorah payment session for user:', userId, 'plan:', planId);
      const response = await myfatoorahClient.post('/v2/InitiatePayment', payload);
      
      if (!response.data || !response.data.Data) {
        throw new Error("Invalid response from payment gateway");
      }
      
      console.log('MyFatoorah payment session created successfully:', response.data.Data.InvoiceId);
      
      // Return the payment session details
      return {
        sessionId: response.data.Data.InvoiceId.toString(),
        paymentUrl: response.data.Data.InvoiceURL
      };
    } catch (error: any) {
      console.error('MyFatoorah payment creation error:', error);
      if (error.response && error.response.data) {
        console.error('MyFatoorah error details:', error.response.data);
      }
      throw new Error("Payment processing failed. Please try again later.");
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
      console.log('Verifying MyFatoorah payment:', paymentId);
      
      // Get payment status from MyFatoorah API using the Key-Value pair endpoint
      const response = await myfatoorahClient.post('/v2/GetPaymentStatus', {
        Key: paymentId,
        KeyType: "PaymentId" // Use PaymentId to search by the payment session ID
      });
      
      if (!response.data || !response.data.Data) {
        console.log('MyFatoorah payment verification failed: No data returned');
        return { isValid: false };
      }
      
      const paymentData = response.data.Data;
      console.log('MyFatoorah payment status:', paymentData.InvoiceStatus);
      
      if (paymentData.InvoiceStatus === "Paid") {
        console.log('MyFatoorah payment successful:', paymentData.InvoiceId);
        return {
          isValid: true,
          invoiceId: paymentData.InvoiceId,
          invoiceReference: paymentData.InvoiceReference,
          transactionId: paymentData.InvoiceTransactions[0]?.TransactionId,
          paymentMethod: paymentData.InvoiceTransactions[0]?.PaymentGateway,
          amount: paymentData.InvoiceValue
        };
      } else {
        console.log('MyFatoorah payment not completed. Status:', paymentData.InvoiceStatus);
        return {
          isValid: false
        };
      }
    } catch (error: any) {
      console.error('MyFatoorah payment verification error:', error);
      if (error.response && error.response.data) {
        console.error('MyFatoorah error details:', error.response.data);
      }
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
    console.log('Updating user subscription:', userId, 'plan:', planId, 'payment:', paymentDetails.invoiceId);
    
    // Get user and plan 
    const user = await storage.getUser(userId);
    if (!user) {
      console.error('User not found for subscription update:', userId);
      throw new Error("User not found");
    }
    
    const plan = await storage.getPlan(planId);
    if (!plan) {
      console.error('Plan not found for subscription update:', planId);
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
    
    console.log('Subscription expiration date calculated:', expirationDate);
    
    // Update user subscription information
    const updatedUser = await storage.updateUser(userId, {
      plan: plan.name.toLowerCase(),
      planExpiresAt: expirationDate,
      // Could store payment details in a separate payments table in a real implementation
    });
    
    if (!updatedUser) {
      console.error('Failed to update user subscription:', userId);
      throw new Error("Failed to update user subscription");
    }
    
    console.log('User subscription updated successfully:', updatedUser.id, 'plan:', updatedUser.plan);
    return updatedUser;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();