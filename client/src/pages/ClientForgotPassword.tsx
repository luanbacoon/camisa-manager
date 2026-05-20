import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shirt, ArrowLeft } from "lucide-react";

export function ClientForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestResetMutation = trpc.clientPasswordReset.requestReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Por favor, informe seu email");
      return;
    }

    try {
      await requestResetMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar recuperação de senha");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Shirt className="w-8 h-8 text-slate-900" />
            </div>
          </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        </CardHeader>

        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <Button
                type="submit"
                disabled={requestResetMutation.isPending}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
              >
                {requestResetMutation.isPending ? "Enviando..." : "Enviar Link de Recuperação"}
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
                <p className="text-green-400 font-medium">Email enviado com sucesso!</p>
                <p className="text-slate-400 text-sm mt-2">
                  Verifique seu email para o link de recuperação de senha.
                </p>
              </div>

              <Button
                onClick={() => setLocation("/client-login")}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
