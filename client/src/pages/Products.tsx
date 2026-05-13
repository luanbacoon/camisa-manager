import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Search, Package, Edit2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "3G", "4G"];

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{ id: number; imageUrl: string; type: string; position: number }>>([]);
  const [galleryImageType, setGalleryImageType] = useState("frente");
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const [galleryImageUrl, setGalleryImageUrl] = useState("");
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const { data: productDetail } = trpc.products.get.useQuery({ id: showDetail! }, { enabled: !!showDetail });

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto cadastrado!"); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto atualizado!"); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const { data: gallery = [] } = trpc.products.gallery.useQuery({ productId: editId! }, { enabled: !!editId });
  const addGalleryImage = trpc.products.addGalleryImage.useMutation({
    onSuccess: () => { toast.success("Foto adicionada!"); utils.products.gallery.invalidate(); setGalleryImageUrl(""); setGalleryImagePreview(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteGalleryImage = trpc.products.deleteGalleryImage.useMutation({
    onSuccess: () => { toast.success("Foto removida!"); utils.products.gallery.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Form state
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [showInCatalog, setShowInCatalog] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [version, setVersion] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function openNew() {
    setEditId(null);
    setName(""); setTeam(""); setDescription(""); setCost(""); setPrice("");
    setShowInCatalog(true); setSelectedSizes({});
    setImageUrl(""); setImagePreview(null);
    setGender(""); setCategory(""); setVersion("");
    setShowForm(true);
  }

  function openEdit(p: typeof products[0]) {
    setEditId(p.id);
    setName(p.name); setTeam(p.team ?? ""); setDescription(p.description ?? "");
    setCost(String(p.cost)); setPrice(String(p.price));
    setShowInCatalog(p.showInCatalog);
    setSelectedSizes({});
    setShowForm(true);
    // Load sizes
    utils.products.get.fetch({ id: p.id }).then((detail) => {
      if (detail) {
        const sizesMap: Record<string, number> = {};
        detail.sizes.forEach((s) => { sizesMap[s.size] = s.stock; });
        setSelectedSizes(sizesMap);
      }
    });
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) => {
      if (size in prev) {
        const next = { ...prev };
        delete next[size];
        return next;
      }
      return { ...prev, [size]: 0 };
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.url) setImageUrl(data.url);
      else toast.error('Erro ao fazer upload da imagem');
    } catch (err) {
      toast.error('Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setImagePreview(null);
  }

  async function handleGalleryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setGalleryImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.url) setGalleryImageUrl(data.url);
      else toast.error('Erro ao fazer upload da imagem');
    } catch (err) {
      toast.error('Erro ao fazer upload');
    } finally {
      setIsUploadingGallery(false);
    }
  }

  function addImageToGallery() {
    if (!editId || !galleryImageUrl) return toast.error("Selecione uma imagem");
    addGalleryImage.mutate({
      productId: editId,
      imageUrl: galleryImageUrl,
      type: galleryImageType,
      position: gallery.length,
    });
  }

  function removeGalleryImage(imageId: number) {
    deleteGalleryImage.mutate({ imageId });
  }

  function submit() {
    if (!name.trim()) return toast.error("Nome é obrigatório");
    if (!cost || !price) return toast.error("Custo e preço são obrigatórios");
    const sizes = Object.entries(selectedSizes).map(([size, stock]) => ({ size, stock }));
    if (editId) {
      updateProduct.mutate({
        id: editId, name, team, description,
        cost: Number(cost), price: Number(price), showInCatalog, sizes,
        imageUrl: imageUrl || undefined, gender: gender || undefined, category: category || undefined, version: version || undefined,
      });
    } else {
      createProduct.mutate({
        name, team, description, cost: Number(cost), price: Number(price), showInCatalog, sizes,
        imageUrl: imageUrl || undefined, gender: gender || undefined, category: category || undefined, version: version || undefined,
      });
    }
  }

  const filtered = useMemo(
    () => products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.team ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Catálogo de camisas da sua loja</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="card-elegant">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Time</th>
                <th>Custo</th>
                <th>Custo Médio</th>
                <th>Preço</th>
                <th>Margem</th>
                <th>Catálogo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const margin = Number(p.price) > 0
                    ? ((Number(p.price) - Number(p.avgCost)) / Number(p.price)) * 100
                    : 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{p.team ?? "—"}</td>
                      <td className="text-sm">{fmt(p.cost)}</td>
                      <td className="text-sm font-medium">{fmt(p.avgCost)}</td>
                      <td className="text-sm font-semibold text-foreground">{fmt(p.price)}</td>
                      <td>
                        <span className={margin >= 30 ? "badge-success" : margin >= 15 ? "badge-warning" : "badge-danger"}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        {p.showInCatalog ? <span className="badge-success">Sim</span> : <span className="badge-neutral">Não</span>}
                      </td>
                      <td>
                        {p.active ? <span className="badge-success">Ativo</span> : <span className="badge-neutral">Inativo</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDetail(p.id)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>Foto do Produto</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="w-full"
                    >
                      Remover Foto
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="space-y-2">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Clique para adicionar foto</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Camisa Flamengo 2024" />
            </div>
            <div className="space-y-1.5">
              <Label>Time / Coleção</Label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Flamengo, Brasil, etc." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Gênero</Label>
                <Input value={gender} onChange={(e) => setGender(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Masculino" />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Clube" />
              </div>
              <div className="space-y-1.5">
                <Label>Versão</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} className="bg-muted/50 border-border" placeholder="Ex: Torcedor" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Custo (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-muted/50 border-border" placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Preço de Venda (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-muted/50 border-border" placeholder="0,00" />
              </div>
            </div>

            {cost && price && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Margem estimada: <span className="text-foreground font-semibold">
                  {Number(price) > 0 ? (((Number(price) - Number(cost)) / Number(price)) * 100).toFixed(1) : 0}%
                </span></p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Tamanhos Disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      s in selectedSizes
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {Object.keys(selectedSizes).length > 0 && (
                <div className="mt-3 space-y-2">
                  {Object.entries(selectedSizes).map(([size, stock]) => (
                    <div key={size} className="flex items-center gap-3">
                      <span className="badge-neutral w-12 justify-center">{size}</span>
                      <Input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setSelectedSizes((prev) => ({ ...prev, [size]: Number(e.target.value) }))}
                        className="bg-muted/50 border-border w-24"
                        placeholder="Estoque"
                      />
                      <span className="text-xs text-muted-foreground">unidades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Exibir no Catálogo Público</Label>
                <p className="text-xs text-muted-foreground">Clientes poderão ver este produto</p>
              </div>
              <Switch checked={showInCatalog} onCheckedChange={setShowInCatalog} />
            </div>

            {editId && (
              <div className="border-t border-border pt-4">
                <Label className="text-sm font-semibold">Galeria de Fotos</Label>
                <p className="text-xs text-muted-foreground mb-3">Adicione múltiplas fotos (frente, costas, detalhes)</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowGallery(true)}
                >
                  + Adicionar Fotos à Galeria
                </Button>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={submit}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Galeria de Fotos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Upload Section */}
            <div className="space-y-3 border border-border rounded-lg p-4">
              <Label>Adicionar Nova Foto</Label>
              <div className="space-y-2">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  {galleryImagePreview ? (
                    <div className="space-y-2">
                      <img src={galleryImagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setGalleryImagePreview(null); setGalleryImageUrl(""); }}
                        className="w-full"
                      >
                        Remover Foto
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="space-y-2">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Clique para adicionar foto</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" disabled={isUploadingGallery} />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Foto</Label>
                    <select value={galleryImageType} onChange={(e) => setGalleryImageType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm">
                      <option value="frente">Frente</option>
                      <option value="costas">Costas</option>
                      <option value="detalhe">Detalhe</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addImageToGallery}
                      disabled={!galleryImageUrl || addGalleryImage.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery List */}
            <div className="space-y-2">
              <Label>Fotos Adicionadas</Label>
              {gallery.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto adicionada ainda</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.imageUrl} alt={img.type} className="w-full h-24 object-cover rounded-lg border border-border" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">{img.type}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          onClick={() => removeGalleryImage(img.id)}
                        >
                          ✗
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowGallery(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{productDetail?.name}</DialogTitle>
          </DialogHeader>
          {productDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Time</p><p className="font-medium">{productDetail.team ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Custo Médio</p><p className="font-bold text-primary">{fmt(productDetail.avgCost)}</p></div>
                <div><p className="text-muted-foreground text-xs">Preço</p><p className="font-semibold">{fmt(productDetail.price)}</p></div>
                <div><p className="text-muted-foreground text-xs">Unidades Recebidas</p><p className="font-medium">{productDetail.totalUnitsReceived}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Estoque por Tamanho</p>
                <div className="flex flex-wrap gap-2">
                  {productDetail.sizes.map((s) => (
                    <div key={s.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${s.stock > 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-muted/50 border-border text-muted-foreground"}`}>
                      {s.size}: {s.stock}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
