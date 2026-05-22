import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/SimpleToast";
import { Settings as SettingsIcon, Store, User, ExternalLink, Copy, Palette, Package, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();

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
  
  // Personalization
  const [primaryColor, setPrimaryColor] = useState("#1a472a");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); utils.catalog.products.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  
  // Product selection
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName ?? "");
      setOwnerName(settings.ownerName ?? "");
      setPhone(settings.phone ?? "");
      setEmail(settings.email ?? "");
      setAddress(settings.address ?? "");
      setInstagram(settings.instagram ?? "");
      setWhatsapp(settings.whatsapp ?? "");
      setPrimaryColor(settings.primaryColor ?? "#1a472a");
      if (settings.logoUrl) setLogoPreview(settings.logoUrl);
      if (settings.bannerUrl) setBannerPreview(settings.bannerUrl);
    }
  }, [settings]);

  const selectedProductsSet = useMemo(() => {
    const catalogProducts = products.filter((p) => p.showInCatalog);
    return new Set(catalogProducts.map((p) => p.id));
  }, [products]);

  // selectedProductsSet é usado diretamente, não precisa de useEffect

  function save() {
    updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp, primaryColor });
  }

  async function handleLogoUpload(file: File) {
    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setLogoPreview(data.url);
        updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp, primaryColor, logoUrl: data.url });
        toast.success("Logo salva!");
      }
    } catch (err) {
      toast.error("Erro ao fazer upload da logo");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleBannerUpload(file: File) {
    setIsUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setBannerPreview(data.url);
        updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp, primaryColor, bannerUrl: data.url });
        toast.success("Banner salvo!");
      }
    } catch (err) {
      toast.error("Erro ao fazer upload do banner");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function saveProductSelection() {
    for (const product of products) {
      await updateProduct.mutate({
        id: product.id,
        showInCatalog: selectedProducts.has(product.id),
      });
    }
    utils.products.list.invalidate();
    utils.catalog.products.invalidate();
    toast.success("Produtos do catálogo atualizados!");
    setShowProductSelector(false);
  }

  const catalogUrl = typeof window !== "undefined" ? `${window.location.origin}/catalogo` : "/catalogo";

  function copyCatalogLink() {
    navigator.clipboard.writeText(catalogUrl);
    toast.success("Link copiado!");
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie os dados da sua loja e personalize seu catálogo</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="bg-muted/50 border border-border grid w-full grid-cols-4">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Loja</span>
          </TabsTrigger>
          <TabsTrigger value="personalization" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Personalização</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Conta</span>
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

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="mt-4">
          <div className="card-elegant p-6 space-y-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personalização do Catálogo</h2>
            
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <>
                {/* Primary Color */}
                <div className="space-y-3">
                  <Label>Cor Primária do Catálogo</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <div className="flex-1">
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="bg-muted/50 border-border font-mono text-sm"
                        placeholder="#1a472a"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Esta cor será usada como cor principal do seu catálogo público</p>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Logo da Loja</Label>
                  <p className="text-xs text-muted-foreground">Recomendado: 200x200px, PNG ou JPG</p>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block">
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                          <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setLogoFile(e.target.files[0]);
                                handleLogoUpload(e.target.files[0]);
                              }
                            }}
                            disabled={isUploadingLogo}
                            className="hidden"
                          />
                        </div>
                      </label>
                      {logoPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null);
                            updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp, primaryColor, logoUrl: null });
                          }}
                          className="w-full"
                        >
                          Remover Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label>Banner do Catálogo</Label>
                  <p className="text-xs text-muted-foreground">Recomendado: 1200x300px, PNG ou JPG</p>
                  <div className="space-y-2">
                    <div className="w-full h-32 rounded-lg border-2 border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <label className="block">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <p className="text-sm text-muted-foreground">Clique para fazer upload do banner</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setBannerFile(e.target.files[0]);
                              handleBannerUpload(e.target.files[0]);
                            }
                          }}
                          disabled={isUploadingBanner}
                          className="hidden"
                        />
                      </div>
                    </label>
                    {bannerPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBannerPreview(null);
                          updateSettings.mutate({ storeName, ownerName, phone, email, address, instagram, whatsapp, primaryColor, bannerUrl: null });
                        }}
                        className="w-full"
                      >
                        Remover Banner
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={save}
                    disabled={updateSettings.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {updateSettings.isPending ? "Salvando..." : "Salvar Personalização"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="mt-4">
          <div className="card-elegant p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Catálogo Público</h2>
                <p className="text-xs text-muted-foreground mt-1">Compartilhe este link com seus clientes</p>
              </div>
              <Button onClick={() => setShowProductSelector(true)} variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Gerenciar Produtos
              </Button>
            </div>

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
              <p className="text-sm font-medium text-primary mb-2">Como funciona</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clientes acessam o link sem precisar fazer login</li>
                <li>• Visualizam produtos que você selecionou para o catálogo</li>
                <li>• Podem solicitar pedidos diretamente pelo catálogo</li>
                <li>• Todos os tamanhos estão disponíveis para encomenda</li>
                <li>• Pedidos aparecem na seção "Pedidos do Catálogo"</li>
              </ul>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-600 mb-2">Dica</p>
              <p className="text-sm text-muted-foreground">
                Você pode personalizar a cor, logo e banner do catálogo na aba "Personalização" acima. Essas mudanças aparecem imediatamente no link público.
              </p>
            </div>
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
                <p className="font-medium mt-1 capitalize">{(user as any)?.loginMethod ?? "Local"}</p>
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
      </Tabs>

      {/* Product Selector Dialog */}
      <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Selecionar Produtos para o Catálogo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione quais produtos deseja exibir no catálogo público. Clientes poderão visualizar e fazer pedidos desses produtos.
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto cadastrado</p>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedProducts);
                        if (checked) {
                          newSelected.add(product.id);
                        } else {
                          newSelected.delete(product.id);
                        }
                        setSelectedProducts(newSelected);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.team && `${product.team} • `}
                        {product.gender && `${product.gender} • `}
                        R$ {Number(product.price).toFixed(2)}
                      </p>
                    </div>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowProductSelector(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={saveProductSelection}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Salvar Seleção ({selectedProducts.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
