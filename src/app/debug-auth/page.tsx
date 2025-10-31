"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function DebugAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGET = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/test", { credentials: "include" });
      const data = await res.json();
      setResult({ method: "GET", status: res.status, data });
    } catch (error) {
      setResult({ method: "GET", error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testPOST = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/test-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setResult({ method: "POST", status: res.status, data });
    } catch (error) {
      setResult({ method: "POST", error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testCreateRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budget-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Richiesta",
          amount: 1000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "Test",
        }),
      });
      const data = await res.text();
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch {
        jsonData = { raw: data };
      }
      setResult({ method: "POST Budget Request", status: res.status, data: jsonData });
    } catch (error) {
      setResult({ method: "POST Budget Request", error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testCheckUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "elena.ferri@digimax.mock",
          password: "demo123",
        }),
      });
      const data = await res.json();
      setResult({ method: "Check User (Elena)", status: res.status, data });
    } catch (error) {
      setResult({ method: "Check User", error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testCheckAdmin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123",
        }),
      });
      const data = await res.json();
      setResult({ method: "Check User (Admin)", status: res.status, data });
    } catch (error) {
      setResult({ method: "Check Admin", error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Autenticazione</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={testGET} disabled={loading} variant="primary">
          Test GET /api/auth/test
        </Button>
        <Button onClick={testPOST} disabled={loading} variant="primary">
          Test POST /api/auth/test-session
        </Button>
        <Button onClick={testCheckUser} disabled={loading} variant="primary">
          Test Check User (Elena)
        </Button>
        <Button onClick={testCheckAdmin} disabled={loading} variant="primary">
          Test Check User (Admin)
        </Button>
        <Button onClick={testCreateRequest} disabled={loading} variant="primary">
          Test Crea Richiesta
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Risultato: {result.method}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Istruzioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Clicca su "Test Check User (Elena)" per verificare se l'utente esiste e la password è corretta</p>
          <p>2. Clicca su "Test GET" per verificare se la sessione funziona</p>
          <p>3. Clicca su "Test POST" per verificare se POST funziona</p>
          <p>4. Clicca su "Test Crea Richiesta" per simulare la creazione di una richiesta</p>
          <p className="text-rose-600 dark:text-rose-400 mt-4">
            <strong>Importante:</strong> Verifica anche la console del browser (F12) e i log del server nel terminale.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

