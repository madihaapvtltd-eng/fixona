"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { KeyRound, UserRound } from "lucide-react";

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
      <div className="rounded-3xl border border-indigo-200 bg-white/95 p-5 shadow-lg shadow-indigo-100">
        <h1 className="text-xl font-semibold text-indigo-950">Technician Login</h1>
        <p className="mt-1 text-sm text-indigo-700/80">Use your username and password assigned by admin.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-zinc-600">Username</label>
            <div className="mt-1 flex items-center rounded-xl border border-indigo-200 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-300">
              <UserRound className="h-4 w-4 text-indigo-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tech11"
                className="h-10 w-full bg-transparent px-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-600">Password</label>
            <div className="mt-1 flex items-center rounded-xl border border-indigo-200 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-300">
              <KeyRound className="h-4 w-4 text-indigo-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="h-10 w-full bg-transparent px-2 text-sm outline-none"
              />
            </div>
          </div>

          {error ? <div className="text-xs text-red-700">{error}</div> : null}

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-indigo-600 hover:to-violet-500"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

