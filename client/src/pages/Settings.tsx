import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Settings as SettingsIcon, Store, User, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => { utils.settings.get.invalidate(); toast.success("Configurações salvas!"); },
    onError: (e) => toast.error(e.message),
  });

  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName ?? "");
      setOwnerName(settings.ownerName ?? "");
      setPhone(settings.phone ?? "");
      setEmail(settings.email ?? "");
      setAddress(settings.address ?? "");
      setInstagram(settings.instagram ?? "");
      setWhatsapp(settings.whatsapp ?? "");
    }
  }, [settings]);

  function save() {
    updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp });
  }

  const catalogUrl = typeof window !== "undefined" ? `${window.location.origin}/catalogo` : "/catalogo";

  function copyCatalogLink() {
    navigator.clipboard.writeText(catalogUrl);
    toast.success("Link copiado!");
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie os dados da sua loja e conta</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
        </TabsList>

        {/* Store Tab */}
        <TabsContent value="store" className="mt-4">
          <div className="card-elegant p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados da Loja</h2>

            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Nome da Loja *</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Camisa FC" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Responsável</Label>
                    <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="bg-muted/50 border-border" placeholder="Nome do proprietário" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-muted/50 border-border" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50 border-border" placeholder="contato@loja.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Endereço</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} placeholder="Rua, número, bairro, cidade..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Instagram</Label>
                    <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="bg-muted/50 border-border" placeholder="@suaLoja" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-muted/50 border-border" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={save}
                    disabled={updateSettings.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {updateSettings.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4">
          <div className="card-elegant p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informações da Conta</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="font-semibold">{user?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Método de Login</p>
                <p className="font-medium mt-1 capitalize">{user?.loginMethod ?? "—"}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Perfil</p>
                <p className="font-medium mt-1 capitalize">{user?.role ?? "—"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              As informações da conta são gerenciadas pelo sistema de autenticação Manus. Para alterá-las, acesse as configurações do seu perfil Manus.
            </p>
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="mt-4">
          <div className="card-elegant p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Link do Catálogo Público</h2>
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com seus clientes para que eles possam visualizar seus produtos e fazer pedidos diretamente pelo catálogo.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={catalogUrl}
                readOnly
                className="bg-muted/50 border-border font-mono text-sm"
              />
              <Button variant="outline" onClick={copyCatalogLink} className="shrink-0 gap-2">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <a href="/catalogo" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="shrink-0 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </a>
            </div>
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <p className="text-sm font-medium text-primary mb-1">Como funciona</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clientes acessam o link sem precisar fazer login</li>
                <li>• Visualizam produtos marcados como "Exibir no Catálogo"</li>
                <li>• Podem solicitar pedidos diretamente pelo catálogo</li>
                <li>• Pedidos aparecem na seção "Pedidos do Catálogo"</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
