import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

serve(async (req: Request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${(err as Error).message}` }),
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;
      const planId = session.metadata?.plan_id;

      if (orgId && planId) {
        // Create or update subscription
        await supabase.from("subscriptions").upsert(
          {
            organization_id: orgId,
            plan_id: planId,
            status: "active",
            stripe_subscription_id: session.subscription as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          { onConflict: "organization_id" }
        );

        // Create invoice record
        await supabase.from("invoices").insert({
          organization_id: orgId,
          stripe_invoice_id: session.invoice as string,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || "eur",
          status: "paid",
          paid_at: new Date().toISOString(),
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;

      // Update subscription period
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, organization_id")
        .eq("stripe_subscription_id", subId)
        .single();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: new Date(
              (invoice.period_start || 0) * 1000
            ).toISOString(),
            current_period_end: new Date(
              (invoice.period_end || 0) * 1000
            ).toISOString(),
          })
          .eq("id", sub.id);

        // Record payment
        await supabase.from("payments").insert({
          organization_id: sub.organization_id,
          invoice_id: sub.id,
          amount: (invoice.amount_paid || 0) / 100,
          currency: invoice.currency || "eur",
          status: "succeeded",
          stripe_payment_intent_id: invoice.payment_intent as string,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_subscription_id", subId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
