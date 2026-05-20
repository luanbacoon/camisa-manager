import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shirt, ArrowLeft } from "lucide-react";

export function ClientResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const verifyTokenQuery = trpc.clientPasswordReset.verifyToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.clientPasswordReset.resetPassword.useMutation();

  // Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  // Check if token is valid
  useEffect(() => {
    if (verifyTokenQuery.data) {
      setIsValidToken(verifyTokenQuery.data.valid);
      if (!verifyTokenQuery.data.valid) {
        setError(verifyTokenQuery.data.message || "Token inválido");
      }
    }
  }, [verifyTokenQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => setLocation("/client-login"), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha");
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-400">Verificando token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400">Token Inválido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400 text-center">{error}</p>
            <Button
              onClick={() => setLocation("/client-forgot-password")}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Shirt className="w-8 h-8 text-slate-900" />
            </div>
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
        </CardHeader>

        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nova Senha
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
              >
                {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/client-login")}
                className="w-full text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-400 font-medium">Senha redefinida com sucesso!</p>
                <p className="text-slate-400 text-sm mt-2">
                  Redirecionando para login...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
