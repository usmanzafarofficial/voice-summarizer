import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "../config/database.js";
import { PlanModel } from "../models/PlanModel.js";
import { stripe } from "../services/stripeService.js";

const plans = [
  {
    name: "One-Time",
    price: 10,
    currency: "usd",
    period: "one-time" as const,
    features: [
      "10 AI voices",
      "2 editable summarizations",
      "2 downloadable PDFs",
    ],
    displayOrder: 1,
  },
  {
    name: "Monthly",
    price: 25,
    currency: "usd",
    period: "monthly" as const,
    features: [
      "Everything in One-Time, plus",
      "Unlimited voices & summarizations",
      "More editable summaries per month",
      "More PDF downloads",
      "Priority support",
    ],
    displayOrder: 2,
  },
  {
    name: "Yearly",
    price: 99.99,
    currency: "usd",
    period: "yearly" as const,
    features: [
      "All Monthly features",
      "Best value — save vs monthly",
      "Unlimited access for 12 months",
      "Early access to new features",
    ],
    displayOrder: 3,
  },
];

async function seedPlans() {
  try {
    await connectDatabase();

    for (const planData of plans) {
      let plan = await PlanModel.findOne({ name: planData.name });

      if (!plan) {
        const product = await stripe.products.create({
          name: planData.name,
          description: `Voice Summarization - ${planData.name} Plan`,
        });

        let price;
        if (planData.period === "one-time") {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(planData.price * 100),
            currency: planData.currency,
          });
        } else {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(planData.price * 100),
            currency: planData.currency,
            recurring: {
              interval: planData.period === "monthly" ? "month" : "year",
            },
          });
        }

        plan = await PlanModel.create({
          ...planData,
          stripeProductId: product.id,
          stripePriceId: price.id,
        });

        console.log(`Created plan: ${planData.name} (Stripe Product: ${product.id}, Price: ${price.id})`);
      } else {
        console.log(`Plan already exists: ${planData.name}`);
      }
    }

    console.log("Plans seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
}

seedPlans();
