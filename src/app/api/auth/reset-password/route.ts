import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a password reset link using Firebase Admin
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // Now send the email via our custom Resend route
    // Note: In production, you would call your email service directly here instead of making a fetch call to yourself
    // But since we are in the same Next.js app, we can just import sendEmail
    const { sendEmail, EmailTemplates } = await import("@/lib/email");
    
    const subject = "Reset your password - Social Auto";
    const html = EmailTemplates.PasswordReset(resetLink, "User");
    
    const result = await sendEmail({ to: email, subject, html });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to send reset email via Resend" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Password reset error:", error);
    // Return success anyway so we don't leak user existence
    return NextResponse.json({ success: true });
  }
}
