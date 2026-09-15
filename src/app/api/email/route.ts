// src/app/api/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, EmailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, type, payload } = body;

    if (!to || !type) {
      return NextResponse.json({ error: "Missing 'to' or 'type' in request body" }, { status: 400 });
    }

    let html = "";
    let subject = "";

    // Generate HTML and Subject based on the requested template type
    switch (type) {
      case "verification":
        subject = "Verify your email address - Social Auto";
        html = EmailTemplates.Verification(
          payload.link || "http://localhost:3000/verify?token=demo",
          payload.name || "User"
        );
        break;

      case "password_reset":
        subject = "Reset your password - Social Auto";
        html = EmailTemplates.PasswordReset(
          payload.link || "http://localhost:3000/reset?token=demo",
          payload.name || "User"
        );
        break;

      case "notification":
        subject = payload.subject || "New Notification - Social Auto";
        html = EmailTemplates.Notification(
          payload.title || "Notice",
          payload.message || "You have a new notification.",
          payload.actionUrl,
          payload.actionText
        );
        break;

      default:
        return NextResponse.json({ error: "Invalid email type requested" }, { status: 400 });
    }

    // Send the email
    const result = await sendEmail({ to, subject, html });

    if (result.success) {
      const emailId = (result.data as any)?.id ?? (result.data as any)?.data?.id ?? null;
      return NextResponse.json({ success: true, id: emailId });
    } else {
      const errMsg =
        (result.error as any)?.message ||
        (result.error as any)?.name ||
        "Failed to send email";
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Email API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
