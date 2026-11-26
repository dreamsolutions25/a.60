import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import portrait from "@/assets/agnes-white.jpg";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Family Administration | Agnes at 60";
const DESC = "Secure sign-in for the administrators of Mrs Agnes Adu Gyamfi Adjei's celebration invitation.";

type AuthSearch = { redirect?: string };

function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const redirect = safeRedirect(search["redirect"]);
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

async function isAdmin(userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !error && data === true;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const destination = safeRedirect(search.redirect) ?? "/admin";

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user && (await isAdmin(data.user.id))) {
        await navigate({ to: destination, replace: true });
        return;
      }
      if (!active) return;
      setSignedInEmail(data.user?.email ?? null);
      setChecking(false);
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, [destination, navigate]);

  const enterDashboard = async (userId: string) => {
    if (await isAdmin(userId)) {
      const stored = sessionStorage.getItem("agnes-admin-redirect");
      sessionStorage.removeItem("agnes-admin-redirect");
      await navigate({ to: safeRedirect(stored) ?? destination, replace: true });
      return true;
    }
    return false;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (mode === "sign-up" && password.length < 12) {
      setNotice({ type: "error", text: "Choose a password of at least 12 characters." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.user && (await enterDashboard(data.user.id))) return;
        setSignedInEmail(data.user?.email ?? email.trim());
        setNotice({ type: "error", text: "This account does not have administrator access. Ask the family administrator to grant access." });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session && data.user && (await enterDashboard(data.user.id))) return;
        if (data.user) {
          setNotice({ type: "success", text: "Check your email to confirm your account, then return here to sign in. Administrator access is granted separately." });
          setMode("sign-in");
        }
      }
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Sign-in could not be completed. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setSignedInEmail(null);
    setNotice(null);
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-secondary lg:block">
        <img src={portrait} alt="Mrs Agnes Adu Gyamfi Adjei" className="h-full w-full object-cover object-top" />
        <div className="absolute inset-x-0 bottom-0 bg-background/90 p-12 backdrop-blur-sm">
          <p className="eyebrow text-gold">A celebration of life, love & legacy</p>
          <p className="mt-5 max-w-md font-display text-4xl italic leading-tight">Sixty years of grace. A lifetime of service.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Back to the invitation
          </Link>
          <div className="mt-12 flex h-12 w-12 items-center justify-center border border-gold text-gold">
            <LockKeyhole className="h-5 w-5" strokeWidth={1.25} />
          </div>
          <p className="eyebrow mt-8 text-gold">Family administration</p>
          <h1 className="display-xl mt-4 text-5xl">{mode === "sign-in" ? "Welcome back." : "Create your account."}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Only authorised administrators can edit the invitation, photographs, and guest messages.</p>

          {checking ? (
            <p className="mt-12 font-display text-2xl italic text-muted-foreground">Checking your account…</p>
          ) : signedInEmail ? (
            <div className="mt-10 border border-border bg-card p-6">
              <p className="text-sm leading-relaxed">Signed in as <strong>{signedInEmail}</strong>, but this account is not an administrator.</p>
              <button type="button" onClick={() => void signOut()} className="mt-5 border border-gold px-5 py-3 text-xs uppercase tracking-[0.16em] hover:bg-gold hover:text-primary-foreground">Sign out and use another account</button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-10 space-y-6">
                <label className="block text-sm font-medium">
                  Email address
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full border border-input bg-card px-4 py-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Password
                  <input
                    type="password"
                    required
                    minLength={mode === "sign-up" ? 12 : 1}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full border border-input bg-card px-4 py-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                  {mode === "sign-up" && <span className="mt-2 block text-xs font-normal text-muted-foreground">Use at least 12 characters.</span>}
                </label>
                {notice && (
                  <p role={notice.type === "error" ? "alert" : "status"} className={`border-l-2 py-1 pl-4 text-sm leading-relaxed ${notice.type === "error" ? "border-destructive text-destructive" : "border-gold text-foreground"}`}>
                    {notice.text}
                  </p>
                )}
                <button type="submit" disabled={busy} className="w-full bg-primary px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                  {busy ? "Please wait…" : mode === "sign-in" ? "Sign in securely" : "Create account"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
                <button type="button" className="text-foreground underline decoration-gold underline-offset-4" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setNotice(null); }}>
                  {mode === "sign-in" ? "Create one" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
