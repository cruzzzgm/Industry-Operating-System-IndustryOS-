"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, Filter, ArrowUp, ArrowDown, Package, Box, Circle, DollarSign, TrendingUp, Edit2, Trash2, Eye, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { initialOrders, Order } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { fetchProducts, addProduct, updateProduct, deleteProduct, fetchProductStatistics, fetchOrders, fetchApi } from "@/services/api";
import type { Product } from "@/data/mockData";
import { useTrash } from "@/contexts/TrashContext";

// Mock data para produtos - Ilhós e Arruelas (fallback caso API falhe)
const mockProducts = [
  { 
    id: "1", 
    code: "ILH-051", 
    name: "Ilhós Nº 51", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 51 para lonas e coberturas",
    dimensions: { diameter: "51mm", height: "12mm", hole: "8mm" },
    salePrice: 1.20,
    costPrice: 0.80,
    stockQuantity: 1000,
    unit: "un",
  },
  { 
    id: "2", 
    code: "ILH-050", 
    name: "Ilhós Nº 50", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 50 para lonas e coberturas",
    dimensions: { diameter: "50mm", height: "11mm", hole: "7.5mm" },
    salePrice: 1.15,
    costPrice: 0.75,
    stockQuantity: 1500,
    unit: "un",
  },
  { 
    id: "3", 
    code: "ILH-054", 
    name: "Ilhós Nº 54", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 54 para lonas e coberturas",
    dimensions: { diameter: "54mm", height: "13mm", hole: "9mm" },
    salePrice: 1.30,
    costPrice: 0.85,
    stockQuantity: 800,
    unit: "un",
  },
  { 
    id: "4", 
    code: "ILH-070", 
    name: "Ilhós Nº 70", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 70 para lonas e coberturas",
    dimensions: { diameter: "70mm", height: "15mm", hole: "12mm" },
    salePrice: 1.80,
    costPrice: 1.20,
    stockQuantity: 500,
    unit: "un",
  },
  { 
    id: "5", 
    code: "ILH-045", 
    name: "Ilhós Nº 45", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 45 para lonas e coberturas",
    dimensions: { diameter: "45mm", height: "10mm", hole: "6mm" },
    salePrice: 0.95,
    costPrice: 0.60,
    stockQuantity: 2000,
    unit: "un",
  },
  { 
    id: "6", 
    code: "ILH-000", 
    name: "Ilhós Nº 0", 
    category: "Ilhós", 
    description: "Ilhós de latão nº 0 pequeno para acabamentos",
    dimensions: { diameter: "15mm", height: "5mm", hole: "3mm" },
    salePrice: 0.45,
    costPrice: 0.30,
    stockQuantity: 3000,
    unit: "un",
  },
  { 
    id: "7", 
    code: "ARR-000", 
    name: "Arruela para Ilhós Nº 0", 
    category: "Arruelas", 
    description: "Arruela de latão para ilhós nº 0",
    dimensions: { diameter: "15mm", thickness: "1mm", hole: "3mm" },
    salePrice: 0.25,
    costPrice: 0.15,
    stockQuantity: 5000,
    unit: "un",
  },
  { 
    id: "8", 
    code: "ARR-045", 
    name: "Arruela para Ilhós Nº 45", 
    category: "Arruelas", 
    description: "Arruela de latão para ilhós nº 45",
    dimensions: { diameter: "45mm", thickness: "2mm", hole: "6mm" },
    salePrice: 0.55,
    costPrice: 0.35,
    stockQuantity: 4000,
    unit: "un",
  },
];

const categories = ["Todas", "Ilhós", "Arruelas"];

export default function ProductsPage() {
  const { addToTrash, registerRestoreCallback } = useTrash();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState(categories);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [materialList, setMaterialList] = useState(["latão", "ferro"]);
  const [showNewMaterialInput, setShowNewMaterialInput] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newProductSalePrice, setNewProductSalePrice] = useState("");
  const [newProductCode, setNewProductCode] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductMaterial, setNewProductMaterial] = useState("");
  const [newProductDiameter, setNewProductDiameter] = useState("");
  const [newProductHeight, setNewProductHeight] = useState("");
  const [newProductHole, setNewProductHole] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  
  // Estados para edição de produto
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMaterial, setEditMaterial] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editDiameter, setEditDiameter] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editHole, setEditHole] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Carregar produtos do backend
  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  // Registrar callback de restauração de produtos
  useEffect(() => {
    const unregister = registerRestoreCallback("product", async (productData: Product) => {
      try {
        // Reativar o produto no backend (converter ID para número)
        const productId = typeof productData.id === 'string' ? parseInt(productData.id, 10) : productData.id;
        await updateProduct(productId.toString(), { isActive: true });
        // Recarregar a lista de produtos
        await loadProducts();
      } catch (error) {
        console.error("Erro ao restaurar produto:", error);
        toast.error("Erro ao restaurar produto.");
      }
    });

    return unregister;
  }, [registerRestoreCallback]);

  // Carregar dados do produto ao abrir modal de edição
  useEffect(() => {
    if (editingProduct) {
      setEditCode(editingProduct.code || "");
      setEditName(editingProduct.name || "");
      setEditCategory(editingProduct.category?.toLowerCase() || "");
      setEditMaterial(editingProduct.material || "latão");
      setEditSalePrice(editingProduct.salePrice?.toString() || "");
      setEditDiameter(editingProduct.dimensions?.diameter || "");
      setEditHeight(editingProduct.dimensions?.height || editingProduct.dimensions?.thickness || "");
      setEditHole(editingProduct.dimensions?.hole || "");
      setEditDescription(editingProduct.description || "");
    }
  }, [editingProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      console.log("Produtos carregados:", data);
      if (data.length > 0) {
        console.log("Primeiro produto:", data[0]);
        console.log("Material do primeiro produto:", data[0].material);
        console.log("Dimensions do primeiro produto:", data[0].dimensions);
      }
      setProducts(data);
      console.log("Estado products definido:", data);
      // Log após o próximo render
      setTimeout(() => {
        console.log("Estado products após render:", products);
      }, 100);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos. Usando dados de exemplo.");
      // Fallback para mockData se a API falhar
      setProducts(mockProducts as any);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      console.log("Pedidos carregados para produtos:", data);
      setOrders(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos. Usando dados de exemplo.");
      // Fallback para mockData se a API falhar
      setOrders(initialOrders);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Mostrar apenas produtos ativos (deletados vão para lixeira)
      const isActive = p.isActive !== false;
      
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory;
      
      return isActive && matchesSearch && matchesCategory;
    });

    console.log("filteredProducts calculado:", result);
    console.log("searchQuery:", searchQuery);
    console.log("selectedCategory:", selectedCategory);

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortConfig, refreshKey]);

  // Stats simples
  const stats = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive !== false);
    const total = activeProducts.length;
    const ilhosCount = activeProducts.filter(p => p.category === "Ilhós").length;
    const arruelasCount = activeProducts.filter(p => p.category === "Arruelas").length;
    
    // Calcular totalValue e avgPrice com proteção
    const validPrices = activeProducts.map(p => Number(p.salePrice) || 0);
    const totalValue = validPrices.reduce((sum, price) => sum + price, 0);
    const avgPrice = total > 0 ? totalValue / total : 0;
    
    return { total, ilhosCount, arruelasCount, totalValue, avgPrice };
  }, [products]);

  // Calculate product sales from orders
  const productSales = useMemo(() => {
    const salesMap = new Map<string, number>();
    
    orders.forEach(order => {
      const productName = order.product;
      const quantity = order.quantity;
      salesMap.set(productName, (salesMap.get(productName) || 0) + quantity);
    });
    
    return Array.from(salesMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      // Se clicar na mesma coluna pela terceira vez, remove a ordenação
      if (prev.key === key && prev.direction === "desc") {
        return { key: "", direction: "asc" };
      }
      // Se clicar na mesma coluna pela segunda vez, inverte a direção
      if (prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      // Primeiro clique na coluna, ordena ascending
      return { key, direction: "asc" };
    });
  };

  const getCategoryBadge = (category: string) => {
    if (category === "Ilhós") {
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Ilhós</Badge>;
    }
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Arruela</Badge>;
  };

  const handleDelete = (id: string | number) => {
    setDeleteConfirm(id.toString());
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        // Encontrar o produto antes de deletar
        const product = products.find(p => p.id.toString() === deleteConfirm);
        
        // Converter ID para número (os IDs agora são int no backend)
        const productId = parseInt(deleteConfirm, 10);
        await deleteProduct(productId);
        
        // Adicionar à lixeira se o produto foi encontrado
        if (product) {
          addToTrash({
            id: product.id.toString(),
            type: "product",
            name: product.name,
            data: product,
          });
        }
        
        await loadProducts();
        setDeleteConfirm(null);
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        toast.error("Erro ao remover produto.");
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categoryList.includes(newCategoryName.trim())) {
      setCategoryList(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      toast.success(`Categoria "${newCategoryName.trim()}" adicionada!`);
    }
  };

  const handleAddMaterial = () => {
    if (newMaterialName.trim() && !materialList.includes(newMaterialName.trim().toLowerCase())) {
      setMaterialList(prev => [...prev, newMaterialName.trim().toLowerCase()]);
      setNewMaterialName("");
      setShowNewMaterialInput(false);
      toast.success(`Matéria prima "${newMaterialName.trim()}" adicionada!`);
    }
  };

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Produtos</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-9 text-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Cadastrar Produto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Total de Produtos</p>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-blue-400 bg-white/10">
                <Package className="h-5 w-5 shrink-0" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums text-white">{stats.total}</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 border-blue-500/20 bg-blue-500/10 text-blue-300">
                Cadastrados
              </span>
              <span></span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Preço Médio</p>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-amber-400 bg-white/10">
                <DollarSign className="h-5 w-5 shrink-0" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums text-white">R$ {(stats.totalValue / stats.total).toFixed(2)}</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 border-amber-500/20 bg-amber-500/10 text-amber-300">
                Média
              </span>
              <span></span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Valor Total</p>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-purple-400 bg-white/10">
                <TrendingUp className="h-5 w-5 shrink-0" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums text-white">R$ {stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 border-purple-500/20 bg-purple-500/10 text-purple-300">
                Cadastro
              </span>
              <span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold">Lista de Produtos</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          <div style={{ height: "380px" }} className="overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <Table className="w-full min-w-[600px] md:min-w-0">
              <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                <TableRow className="h-11 hover:bg-transparent border-b border-zinc-800">
                  <TableHead 
                    className="w-[120px] cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Código</span>
                      <div className="flex w-4 justify-center">
                        {sortConfig.key === "code" && sortConfig.direction === "asc" && (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {sortConfig.key === "code" && sortConfig.direction === "desc" && (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Nome</span>
                      <div className="flex w-4 justify-center">
                        {sortConfig.key === "name" && sortConfig.direction === "asc" && (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {sortConfig.key === "name" && sortConfig.direction === "desc" && (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Categoria</span>
                      <div className="flex w-4 justify-center">
                        {sortConfig.key === "category" && sortConfig.direction === "asc" && (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {sortConfig.key === "category" && sortConfig.direction === "desc" && (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    onClick={() => handleSort("material")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Matéria Prima</span>
                      <div className="flex w-4 justify-center">
                        {sortConfig.key === "material" && sortConfig.direction === "asc" && (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {sortConfig.key === "material" && sortConfig.direction === "desc" && (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Dimensões</TableHead>
                  <TableHead 
                    className="w-[100px] text-right cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    onClick={() => handleSort("salePrice")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Preço</span>
                      <div className="flex w-4 justify-center">
                        {sortConfig.key === "salePrice" && sortConfig.direction === "asc" && (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {sortConfig.key === "salePrice" && sortConfig.direction === "desc" && (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-center text-[10px] uppercase tracking-wider text-zinc-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-100 cursor-pointer hover:text-blue-400" onClick={() => setViewingProduct(product)}>{product.code}</TableCell>
                    <TableCell className="text-zinc-300 cursor-pointer hover:text-blue-400" onClick={() => setViewingProduct(product)}>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-zinc-500">{product.description?.substring(0, 40)}...</div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{getCategoryBadge(product.category)}</TableCell>
                    <TableCell className="text-zinc-400 capitalize">{product.material || "-"}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {product.dimensions?.diameter && <div>Diâm: {product.dimensions.diameter}</div>}
                      {product.dimensions?.height && <div>Alt: {product.dimensions.height}</div>}
                      {product.dimensions?.hole && <div>Furo: {product.dimensions.hole}</div>}
                      {product.dimensions?.thickness && <div>Esp: {product.dimensions.thickness}</div>}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 font-medium">
                      R$ {Number(product.salePrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length < 7 && Array.from({ length: 7 - filteredProducts.length }).map((_, i) => (
                  <TableRow key={`empty-prod-${i}`} className="h-11 border-b border-zinc-800 hover:bg-transparent">
                    <TableCell colSpan={7}>&nbsp;</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>

      {/* Product Sales Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col justify-center min-h-[92px]">
          <div>
            <CardTitle className="text-sm font-medium">
              Produtos Mais Vendidos
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Histórico de vendas por produto (Top 5)</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {productSales.length > 0 ? (
              productSales.map((item, index) => {
                const maxQuantity = Math.max(...productSales.map(p => p.quantity));
                const percentage = (item.quantity / maxQuantity) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 text-xs text-muted-foreground font-medium">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-zinc-300">{item.name}</span>
                        <span className="text-sm text-zinc-400">{item.quantity} vendidos</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado de vendas disponível</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </section>

      {/* View Product Modal */}
      <Dialog open={!!viewingProduct} onOpenChange={(open) => {
        if (!open) {
          setViewingProduct(null);
        } else {
          console.log("=== VIEWING PRODUCT ===");
          console.log("viewingProduct:", viewingProduct);
          console.log("viewingProduct.material:", viewingProduct?.material);
          console.log("viewingProduct.dimensions:", viewingProduct?.dimensions);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              {viewingProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Código: {viewingProduct?.code}
            </DialogDescription>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Código</Label>
                  <p className="text-lg text-white font-mono">{viewingProduct.code}</p>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Categoria</Label>
                  <p className="text-lg text-white">{viewingProduct.category}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Nome</Label>
                <p className="text-xl font-bold text-white">{viewingProduct.name}</p>
              </div>
              
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Descrição</Label>
                <p className="text-zinc-300">{viewingProduct.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Matéria Prima</Label>
                  <p className="text-lg text-white capitalize">{viewingProduct.material || "-"}</p>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Preço</Label>
                  <p className="text-2xl font-bold text-emerald-400">
                    R$ {Number(viewingProduct.salePrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Diâmetro</Label>
                  <p className="text-lg font-bold text-white">{viewingProduct.dimensions?.diameter || "-"}</p>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Furo</Label>
                  <p className="text-lg font-bold text-white">{viewingProduct.dimensions?.hole || "-"}</p>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Altura/Espessura</Label>
                  <p className="text-lg font-bold text-white">{viewingProduct.dimensions?.height || viewingProduct.dimensions?.thickness || "-"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-zinc-400 text-xs uppercase">NCM</Label>
                <p className="text-zinc-300 font-mono">{viewingProduct.ncm_code}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingProduct(null)} className="border-zinc-700">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) {
          setNewProductSalePrice("");
          setNewProductCode("");
          setNewProductName("");
          setNewProductCategory("");
          setNewProductMaterial("");
          setNewProductDiameter("");
          setNewProductHeight("");
          setNewProductHole("");
          setNewProductDescription("");
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Código</Label>
              <Input 
                placeholder="Ex: ILH-051" 
                value={newProductCode}
                onChange={(e) => setNewProductCode(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome</Label>
              <Input 
                placeholder="Nome do produto" 
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Categoria</Label>
              <Select value={newProductCategory} onValueChange={(val) => {
                if (val === "nova") {
                  setShowNewCategoryInput(true);
                } else {
                  setNewProductCategory(val);
                }
              }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {categoryList.filter(c => c !== "Todas").map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="nova" className="text-blue-400">+ Adicionar nova categoria</SelectItem>
                </SelectContent>
              </Select>
              {showNewCategoryInput && (
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Nome da nova categoria" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 flex-1"
                  />
                  <Button size="sm" onClick={handleAddCategory} className="bg-blue-600">Adicionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewCategoryInput(false)}>Cancelar</Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Matéria Prima</Label>
              <Select value={newProductMaterial} onValueChange={(val) => {
                if (val === "nova") {
                  setShowNewMaterialInput(true);
                } else {
                  setNewProductMaterial(val);
                }
              }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {materialList.map(mat => (
                    <SelectItem key={mat} value={mat}>{mat.charAt(0).toUpperCase() + mat.slice(1)}</SelectItem>
                  ))}
                  <SelectItem value="nova" className="text-blue-400">+ Adicionar nova matéria prima</SelectItem>
                </SelectContent>
              </Select>
              {showNewMaterialInput && (
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Nome da nova matéria prima" 
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 flex-1"
                  />
                  <Button size="sm" onClick={handleAddMaterial} className="bg-blue-600">Adicionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewMaterialInput(false)}>Cancelar</Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Preço de Venda</Label>
              <Input 
                type="text" 
                value={newProductSalePrice}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, '');
                  const value = (parseInt(input, 10) || 0) / 100;
                  setNewProductSalePrice(value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
                }}
                placeholder="R$ 0,00" 
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Diâmetro</Label>
              <Input 
                placeholder="Ex: 51mm" 
                value={newProductDiameter}
                onChange={(e) => setNewProductDiameter(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Altura / Espessura</Label>
              <Input 
                placeholder="Ex: 12mm" 
                value={newProductHeight}
                onChange={(e) => setNewProductHeight(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Furo</Label>
              <Input 
                placeholder="Ex: 8mm" 
                value={newProductHole}
                onChange={(e) => setNewProductHole(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-zinc-300">Descrição</Label>
              <Input 
                placeholder="Descrição detalhada do produto" 
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button 
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                console.log("=== Botão Cadastrar Produto clicado ===");
                console.log("newProductCode:", newProductCode);
                console.log("newProductName:", newProductName);
                console.log("newProductCategory:", newProductCategory);
                
                if (!newProductCode.trim() || !newProductName.trim() || !newProductCategory.trim()) {
                  console.log("Validação falhou: campos obrigatórios vazios");
                  toast.error("Código, Nome e Categoria são obrigatórios");
                  return;
                }
                
                const priceValue = parseFloat(newProductSalePrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                console.log("priceValue:", priceValue);
                
                const newProduct = {
                  code: newProductCode.trim(),
                  name: newProductName.trim(),
                  category: newProductCategory.trim(),
                  material: newProductMaterial.trim(),
                  description: newProductDescription.trim(),
                  costPrice: 0,
                  salePrice: priceValue,
                  minSalePrice: null,
                  stockQuantity: 0,
                  minStock: 0,
                  maxStock: null,
                  unit: "un",
                  weightKg: null,
                  dimensions: {
                    diameter: newProductDiameter.trim(),
                    height: newProductHeight.trim(),
                    hole: newProductHole.trim(),
                  },
                  supplierId: null,
                  supplierCode: null,
                  isActive: true,
                  isFeatured: false,
                  imageUrl: null,
                  galleryUrls: [],
                };
                
                console.log("newProduct:", newProduct);
                console.log("Iniciando chamada addProduct...");
                
                // Conversão manual para snake_case
                const productData = {
                  code: newProduct.code,
                  name: newProduct.name,
                  category: newProduct.category,
                  material: newProduct.material,
                  description: newProduct.description,
                  cost_price: newProduct.costPrice,
                  sale_price: newProduct.salePrice,
                  min_sale_price: newProduct.minSalePrice,
                  stock_quantity: newProduct.stockQuantity,
                  min_stock: newProduct.minStock,
                  max_stock: newProduct.maxStock,
                  unit: newProduct.unit,
                  weight_kg: newProduct.weightKg,
                  dimensions: newProduct.dimensions,
                  is_active: newProduct.isActive,
                  is_featured: newProduct.isFeatured,
                  image_url: newProduct.imageUrl,
                  gallery_urls: newProduct.galleryUrls || [], // Enviar como array (schema Pydantic espera List[str])
                };
                
                console.log("Dados convertidos para snake_case:", productData);
                
                fetchApi("/products", {
                  method: "POST",
                  body: JSON.stringify(productData),
                })
                  .then((result) => {
                    console.log("Produto adicionado com sucesso:", result);
                    toast.success("Produto cadastrado com sucesso!");
                    setShowAddModal(false);
                    loadProducts();
                  })
                  .catch((error) => {
                    console.error("Erro ao cadastrar produto:", error);
                    console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
                    toast.error("Erro ao cadastrar produto: " + (error as any)?.message || "Erro desconhecido");
                  });
              }}
            >
              Cadastrar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere os dados do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Código</Label>
                <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Categoria</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {categoryList.filter(c => c !== "Todas").map(cat => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Matéria Prima</Label>
                <Select value={editMaterial} onValueChange={setEditMaterial}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {materialList.map(mat => (
                      <SelectItem key={mat} value={mat}>{mat.charAt(0).toUpperCase() + mat.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Preço de Venda</Label>
                <Input type="number" value={editSalePrice} onChange={(e) => setEditSalePrice(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Diâmetro</Label>
                <Input value={editDiameter} onChange={(e) => setEditDiameter(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Altura / Espessura</Label>
                <Input value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Furo</Label>
                <Input value={editHole} onChange={(e) => setEditHole(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-zinc-300">Descrição</Label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  console.log("=== Iniciando atualização do produto ===");
                  console.log("ID do produto:", editingProduct.id);
                  console.log("Dados a enviar:", {
                    code: editCode,
                    name: editName,
                    category: editCategory.charAt(0).toUpperCase() + editCategory.slice(1),
                    material: editMaterial,
                    salePrice: parseFloat(editSalePrice) || 0,
                    dimensions: {
                      diameter: editDiameter.trim(),
                      height: editHeight.trim(),
                      hole: editHole,
                    },
                    description: editDescription,
                  });

                  // Atualizar produto via API
                  const updatedProduct = await updateProduct(editingProduct.id.toString(), {
                    code: editCode,
                    name: editName,
                    category: editCategory.charAt(0).toUpperCase() + editCategory.slice(1),
                    material: editMaterial,
                    salePrice: parseFloat(editSalePrice) || 0,
                    dimensions: {
                      diameter: editDiameter.trim(),
                      height: editHeight.trim(),
                      hole: editHole,
                    },
                    description: editDescription,
                  });

                  console.log("Produto atualizado no backend:", updatedProduct);
                  console.log("Nome do produto atualizado:", updatedProduct.name);
                  console.log("Preço do produto atualizado:", updatedProduct.salePrice);

                  // Atualizar produto diretamente no estado local
                  setProducts(prevProducts => 
                    prevProducts.map(p => 
                      p.id === editingProduct.id ? updatedProduct : p
                    )
                  );
                  
                  // Forçar re-render
                  setRefreshKey(prev => prev + 1);
                  
                  console.log("Produtos recarregados");
                  toast.success("Produto atualizado com sucesso!");
                  setEditingProduct(null);
                } catch (error) {
                  console.error("Erro ao atualizar produto:", error);
                  toast.error("Erro ao atualizar produto.");
                }
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
