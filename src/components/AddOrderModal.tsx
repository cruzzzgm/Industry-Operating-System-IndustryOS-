
import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Package, Calendar, MapPin, Building, FileText } from "lucide-react";
import { toast } from "sonner";
import { Customer, OrderItem } from "@/data/mockData";
import { fetchProducts } from "@/services/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    customerName: string;
    customerData: Customer;
    orderDate: string;
    estimatedDeliveryDate: string;
    deliveryMethod: "Retirada" | "Transportadora";
    carrierName: string | null;
    items: OrderItem[];
    totalValue: number;
  }) => void;
  customers: Customer[];
}

export default function AddOrderModal({ open, onClose, onConfirm, customers }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"Retirada" | "Transportadora">("Retirada");
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: Date.now(),
      description: "",
      ncmCode: "",
      unit: "UN",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      weightPerUnit: 1
    }
  ]);

  // Carregar produtos quando o modal abrir
  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts({ limit: 1000 });
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const carriers = [
    "Transporte Rápido Logística",
    "Express Cargo Brasil", 
    "Rodoviária Nacional",
    "Logística Urbana S/A",
    "Carga Pesada Ltda",
    "Entrega Expressa"
  ];

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    
    if (field === "description") item.description = String(value);
    else if (field === "ncmCode") {
      const code = String(value);
      item.ncmCode = code;
      
      // Buscar produto pelo código e preencher dados automaticamente
      if (code && code.length >= 1) {
        console.log("Buscando produto com código:", code);
        console.log("Produtos disponíveis:", products);
        const product = products.find(p => p.code === code);
        console.log("Produto encontrado:", product);
        if (product) {
          item.description = product.name;
          item.unit = product.unit || "UN";
          item.unitPrice = product.salePrice || 0;
          item.totalPrice = Number((item.quantity * (product.salePrice || 0)).toFixed(2));
          item.weightPerUnit = product.weightKg || 1;
          console.log("Item atualizado:", item);
        }
      }
    }
    else if (field === "unit") item.unit = String(value);
    else if (field === "quantity") {
      const qty = typeof value === "number" ? value : Number(String(value).replace(",", ".")) || 0;
      item.quantity = qty;
      item.totalPrice = Number((qty * item.unitPrice).toFixed(2));
    }
    else if (field === "unitPrice") {
      const price = typeof value === "number" ? value : Number(String(value).replace(",", ".")) || 0;
      item.unitPrice = price;
      item.totalPrice = Number((item.quantity * price).toFixed(2));
    }
    else if (field === "weightPerUnit") item.weightPerUnit = Number(value) || 1;
    
    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      description: "",
      ncmCode: "",
      unit: "UN",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      weightPerUnit: 1
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleConfirm = () => {
    if (!selectedCustomer) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!orderDate) {
      toast.error("Informe a data do pedido");
      return;
    }

    if (!estimatedDeliveryDate) {
      toast.error("Informe a data prevista de entrega");
      return;
    }

    if (deliveryMethod === "Transportadora" && !selectedCarrier) {
      toast.error("Selecione uma transportadora");
      return;
    }

    const validItems = items.filter(item => item.description && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item válido");
      return;
    }

    onConfirm({
      customerName: selectedCustomer.name,
      customerData: selectedCustomer,
      orderDate,
      estimatedDeliveryDate,
      deliveryMethod,
      carrierName: deliveryMethod === "Transportadora" ? selectedCarrier : null,
      items: validItems,
      totalValue
    });

    // Reset form
    setSelectedCustomer(null);
    setOrderDate(new Date().toISOString().split('T')[0]);
    setEstimatedDeliveryDate("");
    setDeliveryMethod("Retirada");
    setSelectedCarrier("");
    setItems([{
      id: Date.now(),
      description: "",
      ncmCode: "",
      unit: "UN",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      weightPerUnit: 1
    }]);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Adicionar Novo Pedido
          </DialogTitle>
          <DialogDescription>
            Preencha todas as informações para criar um novo pedido completo
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Seção do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select value={selectedCustomer?.id || ""} onValueChange={(value) => {
                  const customer = customers.find(c => c.id === value);
                  setSelectedCustomer(customer || null);
                }}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-zinc-400">{customer.cnpj}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={selectedCustomer?.cnpj || ""}
                  disabled
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-800/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">Endereço</span>
                  </div>
                  <div className="text-sm text-zinc-300 space-y-1">
                    <div>{selectedCustomer.address}</div>
                    <div>{selectedCustomer.city} - {selectedCustomer.state}</div>
                    <div>{selectedCustomer.country}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3" />
                    <span className="font-medium">Dados Adicionais</span>
                  </div>
                  <div className="text-sm text-zinc-300 space-y-1">
                    <div>Contato: {selectedCustomer.contact || selectedCustomer.name}</div>
                    <div>Segmento: {selectedCustomer.segment || "—"}</div>
                    <div>Email: {selectedCustomer.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Seção do Pedido */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dados do Pedido
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="order-date">Data do Pedido</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="delivery-date">Data Prevista Entrega</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="delivery-method">Método de Entrega</Label>
                <Select value={deliveryMethod} onValueChange={(value: "Retirada" | "Transportadora") => setDeliveryMethod(value)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="Retirada">Retirada</SelectItem>
                    <SelectItem value="Transportadora">Transportadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deliveryMethod === "Transportadora" && (
                <div>
                  <Label htmlFor="carrier">Transportadora</Label>
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Seção de Itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Itens do Pedido</h3>
              <Button size="sm" onClick={addItem} className="bg-zinc-700 hover:bg-zinc-600">
                <Plus className="h-3 w-3 mr-1" /> Adicionar Item
              </Button>
            </div>
            
            <div className="border border-zinc-700 rounded-lg overflow-hidden max-h-[400px] overflow-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-zinc-300">Código</TableHead>
                    <TableHead className="text-zinc-300">Descrição</TableHead>
                    <TableHead className="text-zinc-300">Un</TableHead>
                    <TableHead className="text-zinc-300 text-right">Quantidade</TableHead>
                    <TableHead className="text-zinc-300 text-right">Valor Unit</TableHead>
                    <TableHead className="text-zinc-300 text-right">Valor Total</TableHead>
                    <TableHead className="text-zinc-300 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="border-zinc-700">
                      <TableCell>
                        <Input
                          value={item.ncmCode}
                          onChange={(e) => updateItem(index, "ncmCode", e.target.value)}
                          placeholder="NCM"
                          className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Descrição do produto"
                          className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={(value) => updateItem(index, "unit", value)}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="UN">UN</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-100">
                        R$ {item.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {items.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-sm text-zinc-400">Total Geral</div>
                <div className="text-2xl font-bold text-zinc-100">
                  R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
