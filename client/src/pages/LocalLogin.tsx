import { useState } from "react";
import { useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function LocalLogin() {
  const navigate = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState("1");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation();
  const registerMutation = trpc.localAuth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginMutation.mutateAsync({
          email,
          password,
          tenantId: parseInt(tenantId),
        });

        // Salvar token no localStorage
        localStorage.setItem("localAuthToken", result.token);
        localStorage.setItem("localAuthUser", JSON.stringify(result));

        // Redirecionar para dashboard
        window.location.href = "/";
      } else {
        await registerMutation.mutateAsync({
          email,
          password,
          name,
          tenantId: parseInt(tenantId),
        });

        // Após registrar, fazer login automaticamente
        const loginResult = await loginMutation.mutateAsync({
          email,
          password,
          tenantId: parseInt(tenantId),
        });

        localStorage.setItem("localAuthToken", loginResult.token);
        localStorage.setItem("localAuthUser", JSON.stringify(loginResult));

        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CM</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {isLogin ? "Bem-vindo ao CamisaManager" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Faça login para acessar seu sistema"
              : "Crie uma nova conta para começar"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ID da Loja</label>
              <Input
                type="number"
                placeholder="1"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Deixe como 1 se você é o proprietário
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-amber-600 hover:text-amber-700 font-medium"
                disabled={isLoading}
              >
                {isLogin ? "Criar uma nova conta" : "Já tenho uma conta"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
