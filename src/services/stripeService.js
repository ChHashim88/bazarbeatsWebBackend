import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // or whichever stable version is preferred
});

export const createPaymentIntent = async (amount) => {
  try {
    // Stripe expects amount in the smallest currency unit (cents for USD)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'pkr',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe error:', error);
    throw new Error(error.message);
  }
};
