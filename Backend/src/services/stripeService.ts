import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export async function createCheckoutSession(params: {
  planId: string;
  planName: string;
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  isSubscription: boolean;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: params.isSubscription ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    metadata: {
      userId: params.userId,
      planId: params.planId,
      planName: params.planName,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}
