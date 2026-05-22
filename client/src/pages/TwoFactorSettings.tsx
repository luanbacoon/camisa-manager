import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/components/SimpleToast";

export default function TwoFactorSettings() {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = 
    trpc.localAuth.getTwoFactorStatus.useQuery();
  
  const { data: secretData, isLoading: secretLoading } = 
    trpc.localAuth.generateTwoFactorSecret.useQuery(undefined, {
      enabled: showSetupDialog,
    });

  const enableMutation = trpc.localAuth.enableTwoFactorMutation.useMutation();
  const disableMutation = trpc.localAuth.disableTwoFactor.useMutation();

  const handleEnable = async () => {
    if (!secretData?.secret) {
      toast.error("Secret não gerado");
      return;
    }

    if (!verificationCode) {
      toast.error("Digite o código de verificação");
      return;
    }

    try {
      const result = await enableMutation.mutateAsync({
        secret: secretData.secret,
        token: verificationCode,
      });

      if (result.backupCodes) {
        setBackupCodes(result.backupCodes);
      }

      toast.success("2FA ativado com sucesso!");
      setVerificationCode("");
      setShowSetupDialog(false);
      refetchStatus();
    } catch (error: any) {
      toast.error(error.message || "Erro ao ativar 2FA");
    }
  };

  const handleDisable = async () => {
    if (!disableCode) {
      toast.error("Digite o código de verificação");
      return;
    }

    try {
      await disableMutation.mutateAsync({
        token: disableCode,
      });

      toast.success("2FA desativado com sucesso!");
      setDisableCode("");
      setShowDisableDialog(false);
      refetchStatus();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desativar 2FA");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Autenticação de Dois Fatores</h1>
        <p className="text-muted-foreground">Proteja sua conta com 2FA</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do 2FA</CardTitle>
          <CardDescription>
            {status?.enabled ? "2FA está ativado" : "2FA não está ativado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-semibold">
                {status?.enabled ? "✓ 2FA Ativado" : "○ 2FA Desativado"}
              </p>
              <p className="text-sm text-muted-foreground">
                {status?.enabled
                  ? `${status.backupCodesRemaining} códigos de backup disponíveis`
                  : "Ative 2FA para adicionar uma camada extra de segurança"}
              </p>
            </div>
            <div className="flex gap-2">
              {!status?.enabled ? (
                <Button onClick={() => setShowSetupDialog(true)}>
                  Ativar 2FA
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Desativar 2FA
                </Button>
              )}
            </div>
          </div>

          {status?.enabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Guarde seus códigos de backup em um local seguro. Você precisará deles se perder acesso ao seu autenticador.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ativar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Escaneie o código QR com seu autenticador (Google Authenticator, Authy, etc)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {secretLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : secretData?.keyUri ? (
              <>
                {/* QR Code would be rendered here */}
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    QR Code será exibido aqui
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {secretData.keyUri}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Secret (se o QR code não funcionar)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={secretData.secret}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secretData.secret)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificação</Label>
                  <Input
                    id="code"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSetupDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEnable}
                    disabled={enableMutation.isPending || !verificationCode}
                  >
                    {enableMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      {backupCodes.length > 0 && (
        <Dialog open={backupCodes.length > 0} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Códigos de Backup</DialogTitle>
              <DialogDescription>
                Guarde estes códigos em um local seguro. Você precisará deles se perder acesso ao seu autenticador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted p-4">
                <div className="space-y-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{i + 1}.</span>
                      <span className="tracking-widest">{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  const text = backupCodes.join("\n");
                  copyToClipboard(text);
                  toast.success("Códigos copiados!");
                }}
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Códigos
              </Button>

              <Button
                onClick={() => setBackupCodes([])}
                className="w-full"
              >
                Entendi, Continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Desativar 2FA</DialogTitle>
            <DialogDescription>
              Digite o código do seu autenticador para confirmar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Desativar 2FA reduzirá a segurança da sua conta.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disableCode">Código de Verificação</Label>
              <Input
                id="disableCode"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.slice(0, 6))}
                maxLength={6}
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableMutation.isPending || !disableCode}
              >
                {disableMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  "Desativar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
