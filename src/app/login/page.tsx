"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

function emailFromUsername(username: string) {
  const domain = (process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "madmanrep.mv").trim().toLowerCase();
  const u = username.trim().toLowerCase();
  return `${u}@${domain}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const u = username.trim().toLowerCase();
    if (!u || !password) {
      setError("Enter username and password.");
      return;
    }

    try {
      const email = emailFromUsername(u);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-indigo-950">Technician Login</h1>
        <p className="mt-1 text-sm text-indigo-700/80">Use your username + password assigned by admin.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-zinc-600">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. tech11"
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {error ? <div className="text-xs text-red-700">{error}</div> : null}

          <button
            type="submit"
            className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

