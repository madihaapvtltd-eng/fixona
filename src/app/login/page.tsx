"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { KeyRound, UserRound, Wrench, ArrowRight } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input } from "@/components/ui";

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
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const u = username.trim().toLowerCase();
    if (!u || !password) {
      setError("Enter username and password.");
      return;
    }

    setIsLoading(true);
    try {
      const email = emailFromUsername(u);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/50">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-center">MADMANREP</h1>
          <p className="text-muted-foreground text-center">Maintenance Management System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Technician Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Username"
                icon={<UserRound className="h-4 w-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tech11"
                autoComplete="username"
              />

              <Input
                label="Password"
                icon={<KeyRound className="h-4 w-4" />}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                isLoading={isLoading}
              >
                Sign in
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Contact admin if you need access credentials
        </p>
      </div>
    </div>
  );
}

