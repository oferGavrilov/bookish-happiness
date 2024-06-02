import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function POST(req: NextRequest) {
    let event;

    try {
        const rawBody = await req.text();
        const signature = req.headers.get("stripe-signature") as string;
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
        console.error("Error constructing Stripe event:", err.message);
        return new NextResponse("Webhook Error: " + err.message, { status: 400 });
    }

    console.log("Received Stripe event:", event);

    if (event.type === "charge.succeeded") {
        const charge = event.data.object as Stripe.Charge;
        const productId = charge.metadata.productId;
        const email = charge.billing_details.email;
        const pricePaidInCents = charge.amount;

        console.log("charge.succeeded", charge, productId, email, pricePaidInCents);

        const product = await db.product.findUnique({ where: { id: productId } });
        if (product == null || email == null) {
            return new NextResponse("Bad Request", { status: 400 });
        }

        const userFields = {
            email,
            orders: { create: { productId, pricePaidInCents } },
        };
        const {
            orders: [order],
        } = await db.user.upsert({
            where: { email },
            create: userFields,
            update: userFields,
            select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
        });

        const downloadVerification = await db.downloadVerification.create({
            data: {
                productId,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
        });

        await resend.emails.send({
            from: `Support <${process.env.SENDER_EMAIL}>`,
            to: email,
            subject: "Order Confirmation",
            text: `Thank you for your purchase of ${product.name}! You can download your product here: ${process.env.NEXT_PUBLIC_SITE_URL}/products/download/${downloadVerification.id}`,
        });
    }

    return new NextResponse("Event received", { status: 200 });
}
