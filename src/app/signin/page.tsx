"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    console.log("Attempting login for:", email);
    
    try {
      // In NextAuth v4, il nome del provider deve corrispondere esattamente
      const res = await signIn("credentials", { 
        redirect: false, 
        email, 
        password,
      });
      
      console.log("SignIn response:", res);
      
      if (res?.ok) {
        console.log("Login successful!");
        
        // Workaround NextAuth v5 beta: chiama l'endpoint session per forzare il cookie
        // Fai anche una chiamata GET a una pagina protetta per triggerare la creazione del cookie
        try {
          await Promise.all([
            fetch("/api/auth/session", { credentials: "include" }),
            fetch("/", { credentials: "include", method: "GET" }),
          ]);
        } catch (fetchError) {
          console.warn("Session fetch warnings:", fetchError);
        }
        
        // Usa router.push invece di window.location per mantenere lo stato React
        router.push("/");
        router.refresh();
      } else {
        console.error("Login failed:", res?.error);
        const errorMsg = res?.error === "CredentialsSignin" 
          ? "Credenziali non valide" 
          : res?.error || "Errore durante il login";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Errore durante il login. Riprova.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Accedi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={error || undefined}
                required
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Entra
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


