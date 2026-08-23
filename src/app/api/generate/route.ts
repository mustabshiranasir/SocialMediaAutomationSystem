import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { SocialAccountsData } from "@/lib/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error("Token verification failed", err);
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    const { prompt, tone } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Find the admin user to get the organization's AI API keys
    const adminDocs = await adminDb.collection("users").where("role", "==", "admin").limit(1).get();
    if (adminDocs.empty) {
      return NextResponse.json({ error: "No admin user found to provide API keys." }, { status: 404 });
    }

    const adminData = adminDocs.docs[0].data();
    const socialAccounts = adminData?.socialAccounts as SocialAccountsData | undefined;
    const aiCreds = socialAccounts?.ai;

    if (!aiCreds?.grokApiKey && !aiCreds?.geminiApiKey) {
      return NextResponse.json({ error: "No AI API keys configured in settings." }, { status: 400 });
    }

    const systemPrompt = `You are an expert social media manager.
Given a broad campaign idea and a brand tone, generate tailored content for Facebook and Twitter.
Brand Tone: ${tone || "Professional / Corporate"}

Return a JSON object strictly matching this structure:
{
  "facebook": {
    "content": "The Facebook post text with emojis.",
    "cta": "Call to action text.",
    "hashtags": ["#tag1", "#tag2"]
  },
  "twitter": {
    "content": "The Twitter post text, shorter and punchier.",
    "cta": "Call to action.",
    "hashtags": ["#tag1", "#tag2"]
  },
  "seo": {
    "talkingPoints": ["point 1", "point 2"],
    "targetAudience": "Description of the target audience."
  }
}

Important: Return ONLY valid JSON, without markdown formatting blocks like \`\`\`json.`;

    let generatedText = "";
    let provider = "";
    let lastError = "";

    // Try Grok First
    if (aiCreds.grokApiKey) {
      try {
        const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aiCreds.grokApiKey}`
          },
          body: JSON.stringify({
            model: "grok-2-latest",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (grokRes.ok) {
          const grokData = await grokRes.json();
          generatedText = grokData.choices[0].message.content;
          provider = "grok";
        } else {
          const errText = await grokRes.text();
          console.warn("Grok API failed, falling back to Gemini.", errText);
          lastError = `Grok Error: ${errText}`;
        }
      } catch (err: any) {
        console.warn("Grok API threw an error, falling back to Gemini.", err);
        lastError = `Grok Network Error: ${err.message}`;
      }
    }

    // Fallback to Gemini if Grok failed or is not configured
    if (!generatedText && aiCreds.geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(aiCreds.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nUser Idea: ${prompt}`);
        generatedText = result.response.text();
        provider = "gemini";
      } catch (err: any) {
        console.error("Gemini API threw an error.", err);
        lastError = `Gemini Error: ${err.message}`;
      }
    }

    if (!generatedText) {
      return NextResponse.json({ error: lastError || "Failed to generate content from AI providers." }, { status: 500 });
    }

    // Clean up markdown json blocks if the AI returned them despite instructions
    let cleanJsonStr = generatedText.trim();
    if (cleanJsonStr.startsWith("```json")) {
      cleanJsonStr = cleanJsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const parsedData = JSON.parse(cleanJsonStr);
      return NextResponse.json({ success: true, provider, data: parsedData });
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON", generatedText);
      return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
