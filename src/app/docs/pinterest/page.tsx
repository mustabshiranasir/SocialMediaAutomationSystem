"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, AlertTriangle, Info, Zap, Lock, Globe } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step {
  number: number;
  title: string;
  badge?: string;
  badgeColor?: string;
  content: React.ReactNode;
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function StepCard({ step }: { step: Step }) {
  return (
    <div className="flex gap-5">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#E60023] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-red-200">
          {step.number}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-2" />
      </div>

      {/* Content */}
      <div className="pb-10 flex-1">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-800">{step.title}</h2>
          {step.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${step.badgeColor ?? "bg-slate-100 text-slate-500"}`}>
              {step.badge}
            </span>
          )}
        </div>
        <div className="text-slate-600 text-sm leading-relaxed space-y-3">
          {step.content}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-900 text-emerald-400 rounded-xl px-5 py-4 text-xs font-mono overflow-x-auto mt-1 mb-1 leading-relaxed">
      {children}
    </pre>
  );
}

function Note({ icon: Icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-3 ${color} rounded-xl p-4 border`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function SubStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PinterestDocsPage() {
  const steps: Step[] = [
    {
      number: 1,
      title: "Create a Pinterest Developer App",
      badge: "One-time setup",
      badgeColor: "bg-blue-50 text-blue-600 border border-blue-200",
      content: (
        <div className="space-y-3">
          <SubStep>
            Go to the{" "}
            <a
              href="https://developers.pinterest.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
            >
              Pinterest Developer Portal <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and sign in with your Pinterest account.
          </SubStep>
          <SubStep>Click <strong>Create App</strong>, give it a name (e.g. "Social Auto"), and submit.</SubStep>
          <SubStep>
            Under <strong>App Settings → Redirect URIs</strong>, add your app's callback URL exactly as shown below:
          </SubStep>
          <CodeBlock>http://localhost:3000/api/oauth/callback</CodeBlock>
          <p className="text-xs text-slate-400">
            Replace <code className="bg-slate-100 px-1 rounded">localhost:3000</code> with your production domain when deploying.
          </p>
          <SubStep>
            Copy your <strong>App ID</strong> and <strong>App Secret</strong> — you will need them in Step 2.
          </SubStep>
          <Note icon={AlertTriangle} color="bg-amber-50 text-amber-700 border-amber-200">
            <strong>Trial Access Limitation:</strong> A new app is placed in "Trial" mode. In this mode, you can only authenticate and publish using the <em>same</em> Pinterest account that owns the developer app. To allow any user to connect, apply for <strong>Standard Access</strong> in the developer portal under your App's access level settings.
          </Note>
        </div>
      ),
    },
    {
      number: 2,
      title: "Add Your App Credentials to Social Auto",
      badge: "In settings",
      badgeColor: "bg-purple-50 text-purple-600 border border-purple-200",
      content: (
        <div className="space-y-3">
          <p>Once your Pinterest Developer App is created, register it inside Social Auto so the system can use it to initiate OAuth on your behalf.</p>
          <SubStep>Start your dev server if it is not already running:</SubStep>
          <CodeBlock>npm run dev</CodeBlock>
          <SubStep>
            In the dashboard, go to <strong>Social Poster → Settings → Social Apps</strong> tab (or navigate to{" "}
            <Link href="/social-poster?tab=Settings" className="text-blue-600 hover:underline">Settings → Social Apps</Link>
            ).
          </SubStep>
          <SubStep>Click <strong>Add App</strong> and fill in the form:</SubStep>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex gap-3">
              <span className="text-slate-400 w-24">Platform:</span>
              <span className="text-slate-700 font-semibold">Pinterest</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 w-24">App ID:</span>
              <span className="text-slate-700">Paste your App ID from Step 1</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 w-24">App Secret:</span>
              <span className="text-slate-700">Paste your App Secret from Step 1</span>
            </div>
          </div>
          <SubStep>Save. The app will appear in your Social Apps list.</SubStep>
        </div>
      ),
    },
    {
      number: 3,
      title: "Connect Your Pinterest Account (OAuth)",
      badge: "Per account",
      badgeColor: "bg-red-50 text-[#E60023] border border-red-200",
      content: (
        <div className="space-y-3">
          <SubStep>
            Navigate to <strong>Social Poster → Channels</strong> tab and click <strong>Add Channel</strong>.
          </SubStep>
          <SubStep>Select <strong>Pinterest</strong> from the network list on the left.</SubStep>
          <SubStep>
            Choose the <strong>App Method</strong> tab (recommended — uses your registered Developer App and the official Pinterest v5 API).
          </SubStep>
          <SubStep>
            In the <strong>Select Pinterest App</strong> dropdown, choose the app you added in Step 2.
          </SubStep>
          <SubStep>Click <strong>Connect with App</strong>. You will be redirected to Pinterest's OAuth consent screen.</SubStep>
          <SubStep>
            Approve the requested permissions. Social Auto requests exactly these four scopes:
          </SubStep>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {["boards:read", "boards:write", "pins:read", "pins:write"].map((scope) => (
              <div key={scope} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono">
                <Lock className="w-3 h-3 text-slate-400" />
                {scope}
              </div>
            ))}
          </div>
          <SubStep>
            After approval you will be redirected back. Confirm that your Pinterest account appears in the <strong>Channels</strong> list with a <span className="text-emerald-600 font-semibold">Connected</span> status badge.
          </SubStep>
          <Note icon={Info} color="bg-blue-50 text-blue-700 border-blue-200">
            The channel record is saved server-side in Firestore under your user account. Your access token is stored securely and is never exposed to the browser.
          </Note>
        </div>
      ),
    },
    {
      number: 4,
      title: "Publish a Pin — Share Now",
      badge: "Immediate",
      badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      content: (
        <div className="space-y-3">
          <p>Use the <strong>Schedule / Compose</strong> modal to create and immediately publish a Pin to Pinterest.</p>
          <SubStep>
            Click <strong>Schedule a Post</strong> from the Social Poster page. The compose modal opens.
          </SubStep>
          <SubStep>
            In <strong>Step 1 – Select Channels</strong>, click <em>Choose channels</em> and pick your connected Pinterest channel from the list on the left, then click <strong>Next</strong>.
          </SubStep>
          <SubStep>
            In <strong>Step 3 – Compose</strong>:
          </SubStep>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex gap-3">
              <span className="text-slate-400 w-28">Content:</span>
              <span className="text-slate-700">Write your caption. The <strong>first line</strong> becomes the Pin's <em>Title</em>, the rest becomes the <em>Description</em>.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 w-28">Media URL:</span>
              <span className="text-slate-700 font-semibold text-[#E60023]">⚠ Required. Pinterest pins must have an image. Paste an image URL in the Link field.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 w-28">Link (optional):</span>
              <span className="text-slate-700">A destination URL to attach to the Pin.</span>
            </div>
          </div>
          <SubStep>
            Toggle <strong>Share Now</strong> and click <strong>Publish</strong>. The Pin will be posted to the <em>first board</em> on your Pinterest account.
          </SubStep>
          <Note icon={Info} color="bg-blue-50 text-blue-700 border-blue-200">
            <strong>Board selection:</strong> Currently, Social Auto automatically picks the first board found on your account. A board-selector dropdown will be added in a future update.
          </Note>
          <SubStep>
            Verify the Pin is live by opening your{" "}
            <a href="https://www.pinterest.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              Pinterest profile <ExternalLink className="w-3 h-3" />
            </a>
            .
          </SubStep>
        </div>
      ),
    },
    {
      number: 5,
      title: "Schedule a Pin for Later",
      badge: "Scheduled",
      badgeColor: "bg-sky-50 text-sky-600 border border-sky-200",
      content: (
        <div className="space-y-3">
          <p>Pinterest channels participate in the same scheduling pipeline as Facebook and Twitter. Posts are stored in Firestore and dispatched by the cron worker.</p>
          <SubStep>Follow steps 1–2 of the compose flow as above, but <strong>do not</strong> toggle Share Now.</SubStep>
          <SubStep>Pick a future date and time in the date-picker and click <strong>Schedule</strong>.</SubStep>
          <SubStep>
            The post is saved with <code className="bg-slate-100 px-1 rounded text-xs">status: "scheduled"</code> in Firestore. The cron worker at <code className="bg-slate-100 px-1 rounded text-xs">/api/cron</code> will publish it automatically when the time arrives.
          </SubStep>
          <p className="font-semibold text-slate-700">Testing the cron manually:</p>
          <CodeBlock>{`# No CRON_SECRET configured:
curl -X GET http://localhost:3000/api/cron

# With CRON_SECRET set in .env.local:
curl -X GET http://localhost:3000/api/cron \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"`}</CodeBlock>
          <SubStep>
            The JSON response will show <code className="bg-slate-100 px-1 rounded text-xs">processed: 1</code> and the Pin should appear on Pinterest.
          </SubStep>
        </div>
      ),
    },
    {
      number: 6,
      title: "Going to Production",
      badge: "Deployment",
      badgeColor: "bg-orange-50 text-orange-600 border border-orange-200",
      content: (
        <div className="space-y-3">
          <SubStep>
            Update your Pinterest App's <strong>Redirect URI</strong> to your production domain:
          </SubStep>
          <CodeBlock>https://yourdomain.com/api/oauth/callback</CodeBlock>
          <SubStep>
            Set the <code className="bg-slate-100 px-1 rounded text-xs">NEXT_PUBLIC_APP_URL</code> environment variable to your production URL.
          </SubStep>
          <SubStep>
            Apply for <strong>Standard Access</strong> in the Pinterest Developer Portal so other users can connect their own accounts.
          </SubStep>
          <SubStep>
            Configure a real cron provider (e.g. Vercel Cron, Upstash, GitHub Actions) to hit <code className="bg-slate-100 px-1 rounded text-xs">/api/cron</code> every minute with your <code className="bg-slate-100 px-1 rounded text-xs">CRON_SECRET</code>.
          </SubStep>
          <Note icon={Zap} color="bg-amber-50 text-amber-700 border-amber-200">
            Refresh tokens: Pinterest issues short-lived access tokens with optional refresh tokens. Token refresh is not yet automated — if a channel's token expires, the user will need to reconnect from the Channels tab.
          </Note>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link
          href="/social-poster?tab=Channels"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Channels
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Globe className="w-4 h-4" />
          Social Auto Documentation
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#E60023] via-[#c4001d] to-[#8b0015] text-white px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Pinterest icon approximation */}
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Pinterest Integration Guide</h1>
          <p className="text-red-100 text-base leading-relaxed max-w-xl mx-auto">
            Connect your Pinterest account to Social Auto, publish Pins, and schedule content — all powered by the official Pinterest API v5.
          </p>
          <div className="flex items-center justify-center gap-6 pt-2 text-sm text-red-200">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> OAuth 2.0</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Pinterest API v5</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No passwords stored</span>
          </div>
        </div>
      </div>

      {/* ── Requirements Banner ── */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Globe, label: "Pinterest Developer Account", desc: "Free at developers.pinterest.com" },
            { icon: Lock, label: "App ID & Secret", desc: "Obtained from your Developer App" },
            { icon: Zap, label: "Image / Media URL", desc: "Required for every Pin" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#E60023]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Setup Steps</h2>
        <div>
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>

        {/* ── Footer CTA ── */}
        <div className="bg-gradient-to-r from-[#E60023] to-[#c4001d] rounded-2xl p-8 text-white text-center mt-4 shadow-lg shadow-red-200">
          <h3 className="text-xl font-bold mb-2">Ready to connect?</h3>
          <p className="text-red-100 text-sm mb-6">
            Head back to the Channels tab and add your Pinterest account in under a minute.
          </p>
          <Link
            href="/social-poster?tab=Channels"
            className="inline-flex items-center gap-2 bg-white text-[#E60023] font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors shadow-md"
          >
            Connect Pinterest Now
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
