import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, Share2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  sizes: string[];
  colors: string[];
  description: string;
}

export function ClientCatalog() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Camiseta Básica Azul",
      price: 49.9,
      image: "👕",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Azul", "Branco", "Preto"],
      description: "Camiseta básica de alta qualidade",
    },
    {
      id: 2,
      name: "Camiseta Premium Preta",
      price: 79.9,
      image: "👕",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Preto", "Cinza"],
      description: "Camiseta premium com acabamento especial",
    },
    {
      id: 3,
      name: "Camiseta Estampada",
      price: 59.9,
      image: "👕",
      sizes: ["P", "M", "G"],
      colors: ["Branco", "Cinza"],
      description: "Camiseta com estampa exclusiva",
    },
  ]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;

    const product: Product = {
      id: products.length + 1,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      image: "👕",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Azul", "Branco", "Preto"],
      description: newProduct.description,
    };

    setProducts([...products, product]);
    setNewProduct({ name: "", price: "", description: "" });
    setShowForm(false);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const catalogUrl = `${window.location.origin}/catalogo/cliente`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/client-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Catalogo Online</h1>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(catalogUrl);
              alert("Link do catalogo copiado!");
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Add Product */}
        <div className="flex gap-4 mb-8">
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-800 border-slate-700 text-white"
          />
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle>Adicionar Novo Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Produto
                  </label>
                  <Input
                    placeholder="Ex: Camiseta Basica"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Preco (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="49.90"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descricao
                </label>
                <textarea
                  placeholder="Descreva o produto..."
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-3 min-h-20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddProduct}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
                >
                  Adicionar Produto
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="bg-slate-700 h-48 flex items-center justify-center text-6xl">
                {product.image}
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{product.name}</h3>
                  <p className="text-yellow-500 font-bold text-xl">R$ {product.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Tamanhos:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <span key={size} className="bg-slate-700 px-2 py-1 rounded text-xs">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 border-red-600 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Nenhum produto encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}
