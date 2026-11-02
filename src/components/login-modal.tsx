"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useT } from "@/components/locale-provider";

export function LoginModal() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") setOpen(true);
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setShowPassword(false);
      setStatus("idle");
      setMessage("");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: String(data.username ?? "").trim(), password: String(data.password ?? "") }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setStatus("error");
        setMessage(json.error || t("account.errAuth"));
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      setStatus("error");
      setMessage(t("form.errNetwork"));
    }
  }

  const field =
    "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("header.login")}
          title={t("header.login")}
          className="inline-flex size-7 items-center justify-center rounded-md text-[color:var(--chrome-foreground)] hover:bg-white/15 lg:size-9"
        >
          <CircleUserRound className="size-4 lg:size-5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton className="max-w-xs gap-3 p-4 sm:max-w-xs" aria-describedby={undefined}>
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base">{t("account.submitLogin")}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="text-sm font-medium">
              {t("account.username")}
            </label>
            <input id="login-username" name="username" required autoComplete="username" className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium">
              {t("account.password")}
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className={`${field} pr-10`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t("account.hidePassword") : t("account.showPassword")}
                aria-pressed={showPassword}
                title={showPassword ? t("account.hidePassword") : t("account.showPassword")}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? t("form.sending") : t("account.submitLogin")}
          </Button>
          {message ? (
            <p className="text-sm text-destructive" role="status">
              {message}
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
