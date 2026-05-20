import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ClientAcceptInvite() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Extrair token da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStatus("form");
    } else {
      setError("Token de convite não encontrado");
      setStatus("error");
    }
  }, []);

  const acceptInviteMutation = trpc.clientInvites.acceptInvite.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email é obrigatório");
      return;
    }

    if (!password || password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não correspondem");
      return;
    }

    try {
      setStatus("loading");
      await acceptInviteMutation.mutateAsync({
        token,
        email,
      });

      setStatus("success");
      setTimeout(() => {
        navigate("/client-login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao aceitar convite");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bem-vindo ao CamisaManager</CardTitle>
          <CardDescription>Complete seu cadastro para começar</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {status === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={acceptInviteMutation.isPending}>
                {acceptInviteMutation.isPending ? "Processando..." : "Aceitar Convite"}
              </Button>
            </form>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Convite Aceito!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Sua conta foi criada com sucesso. Redirecionando para login...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Erro</h3>
                <p className="text-sm text-gray-600 mt-2">{error}</p>
              </div>
              <Button onClick={() => navigate("/client-login")} variant="outline" className="w-full">
                Voltar para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
