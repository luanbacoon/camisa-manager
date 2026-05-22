import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/SimpleToast";
import { MessageCircle, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em Análise",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  entregue: "Entregue",
};

export default function WhatsAppSettings() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  const utils = trpc.useUtils();
  const { data: templatesData = [], isLoading } = trpc.catalog.templates.useQuery();

  const updateTemplate = trpc.catalog.updateTemplate.useMutation({
    onSuccess: () => {
      utils.catalog.templates.invalidate();
      toast.success("Template atualizado com sucesso!");
      setEditingStatus(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const initTemplates = trpc.catalog.initializeTemplates.useMutation({
    onSuccess: () => {
      utils.catalog.templates.invalidate();
      toast.success("Templates padrão inicializados!");
    },
    onError: (e) => toast.error(e.message),
  });

  // Use templatesData directly instead of syncing to state to avoid infinite loops
  const displayTemplates = templates.length > 0 ? templates : templatesData;

  const handleEdit = (template: any) => {
    setEditingStatus(template.status);
    setEditText(template.messageText);
    setEditEmoji(template.emoji || "📦");
  };

  const handleSave = () => {
    if (!editText.trim()) {
      toast.error("Mensagem não pode estar vazia");
      return;
    }

    updateTemplate.mutate({
      status: editingStatus as any,
      messageText: editText,
      emoji: editEmoji,
    });
  };

  const handleCancel = () => {
    setEditingStatus(null);
    setEditText("");
    setEditEmoji("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold">Configuração de Mensagens WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              Personalize as mensagens enviadas aos clientes para cada status de pedido
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => initTemplates.mutate()}
          disabled={initTemplates.isPending}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrões
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando templates...</div>
      ) : displayTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum template configurado</p>
            <Button onClick={() => initTemplates.mutate()}>Criar Templates Padrão</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayTemplates.map((template) => (
            <Card key={template.status} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji || "📦"}</span>
                    <div>
                      <CardTitle className="text-lg">{STATUS_LABELS[template.status]}</CardTitle>
                      <CardDescription className="text-xs">
                        Status: {template.status}
                      </CardDescription>
                    </div>
                  </div>
                  {editingStatus !== template.status && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {editingStatus === template.status ? (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Emoji</label>
                      <Input
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        maxLength={2}
                        placeholder="📦"
                        className="w-20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mensagem</label>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Digite a mensagem que será enviada..."
                        className="min-h-24 resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dica: Use {"{"}customerName{"}"} para incluir o nome do cliente
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancel} disabled={updateTemplate.isPending}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={updateTemplate.isPending} className="gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/20 p-4 rounded-lg border border-muted">
                    <p className="text-sm whitespace-pre-wrap">{template.messageText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas de Personalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • Use <code className="bg-muted px-2 py-1 rounded text-xs">{"{{customerName}}"}</code> para
            incluir o nome do cliente
          </p>
          <p>
            • Use <code className="bg-muted px-2 py-1 rounded text-xs">{"{{orderId}}"}</code> para
            incluir o ID do pedido
          </p>
          <p>• Adicione emojis para tornar as mensagens mais atrativas</p>
          <p>• Mantenha as mensagens concisas e diretas (máx. 160 caracteres)</p>
        </CardContent>
      </Card>
    </div>
  );
}
