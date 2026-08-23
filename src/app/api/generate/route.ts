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
    const { prompt, tone, messages } = await req.json();

    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json({ error: "Prompt or messages are required" }, { status: 400 });
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
Your task is to generate tailored content for Facebook and Twitter based on the user's campaign idea.
Brand Tone: ${tone || "Professional / Corporate"}

If the user's request is too brief, ambiguous, or lacks critical details (e.g. date, specific product, target audience), you MUST ask a clarifying question.
If you have enough information, generate the final posts.

Return a JSON object strictly matching ONE of these two structures:

OPTION 1: Need Clarification
{
  "type": "clarification",
  "question": "What is the specific date for the event?"
}

OPTION 2: Final Post
{
  "type": "post",
  "post": {
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
}

Important: Return ONLY valid JSON, without markdown formatting blocks like \`\`\`json.`;

    const chatHistory = messages || [{ role: "user", content: prompt }];

    let generatedText = "";
    let provider = "";
    let lastError = "";

    // Try Groq First
    if (aiCreds.grokApiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aiCreds.grokApiKey}`
          },
          body: JSON.stringify({
            model: "groq/compound",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              ...chatHistory
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          generatedText = groqData.choices[0].message.content;
          provider = "groq";
        } else {
          const errText = await groqRes.text();
          console.warn("Groq API failed, falling back to Gemini.", errText);
          lastError = `Groq Error: ${errText}`;
        }
      } catch (err: any) {
        console.warn("Groq API threw an error, falling back to Gemini.", err);
        lastError = `Groq Network Error: ${err.message}`;
      }
    }

    // Fallback to Gemini if Groq failed or is not configured
    if (!generatedText && aiCreds.geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(aiCreds.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Map chat history to Gemini's format if using multi-turn, or just combine it
        const combinedPrompt = chatHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n");
        const result = await model.generateContent(`${systemPrompt}\n\n${combinedPrompt}`);
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

    // Clean up the AI response to extract valid JSON
    let cleanJsonStr = generatedText.trim();
    
    // Strip <Think>...</Think> reasoning blocks (groq/compound adds these)
    cleanJsonStr = cleanJsonStr.replace(/<Think>[\s\S]*?<\/Think>/gi, "").trim();
    
    // Strip markdown code fences
    cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```\s*$/i, "").trim();
    
    // If there's still non-JSON text around the object, extract the JSON object
    const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJsonStr = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(cleanJsonStr);
      return NextResponse.json({ success: true, provider, data: parsedData });
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON. Raw text:", generatedText);
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
