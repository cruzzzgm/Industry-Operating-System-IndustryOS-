import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Truck, Building2, Phone, Mail, MapPin, User, Globe, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CnpjInput, CellPhoneBrInput, PhoneBrInput, CepInput } from "@/components/ui/masked-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { fetchCarriers, addCarrier, updateCarrier, deleteCarrier, checkCarriersHealth, Carrier } from "@/services/api";
import { useTrash } from "@/contexts/TrashContext";

const MIN_TABLE_ROWS = 7;
const FIXED_TABLE_HEIGHT = "380px";

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
  footer,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorClass: string;
  footer: string;
}) {
  return (
    <Card className="rounded-2xl border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{label}</p>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass} bg-white/10 dark:bg-white/10`}>
            <Icon className={`h-5 w-5 shrink-0 ${colorClass}`} />
          </div>
        </div>
        <div className="mt-6 min-w-0">
          <p className="text-3xl font-bold tracking-tight tabular-nums truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{footer}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "", direction: "asc" });
  
  // Form states - Informações básicas
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Form states - Contato
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  
  // Form states - Endereço
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Form states - Pessoa de contato
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const { addToTrash } = useTrash();

  const loadCarriers = useCallback(async () => {
    try {
      setLoading(true);
      // Tentar health check primeiro
      try {
        await checkCarriersHealth();
      } catch (healthError) {
        console.warn("Health check falhou, tentando carregar mesmo assim...", healthError);
      }
      const data = await fetchCarriers();
      setCarriers(data);
    } catch (error: any) {
      console.error("Erro ao carregar transportadoras:", error);
      if (error.message?.includes("CORS")) {
        toast.error("Erro de CORS. Verifique se o backend está rodando na porta 8000.");
      } else if (error.message?.includes("Failed to fetch")) {
        toast.error("Não foi possível conectar ao backend. Verifique se o servidor está rodando.");
      } else {
        toast.error("Erro ao carregar transportadoras");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCarriers();
  }, [loadCarriers]);

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig({ key: "", direction: "asc" });
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const resetForm = () => {
    setName("");
    setCnpj("");
    setIsActive(true);
    setPhone("");
    setEmail("");
    setWebsite("");
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setContactPerson("");
    setContactPhone("");
    setContactEmail("");
    setEditingCarrier(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setName(carrier.name);
    setCnpj(carrier.cnpj);
    setIsActive(carrier.isActive);
    setPhone(carrier.phone || "");
    setEmail(carrier.email || "");
    setWebsite(carrier.website || "");
    setAddress(carrier.address || "");
    setCity(carrier.city || "");
    setState(carrier.state || "");
    setZipCode(carrier.zipCode || "");
    setContactPerson(carrier.contactPerson || "");
    setContactPhone(carrier.contactPhone || "");
    setContactEmail(carrier.contactEmail || "");
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !cnpj.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const carrierData = {
        name: name.trim(),
        cnpj: cnpj.trim(),
        isActive,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      };

      if (editingCarrier) {
        await updateCarrier(editingCarrier.id, carrierData);
        toast.success("Transportadora atualizada com sucesso!");
      } else {
        await addCarrier(carrierData);
        toast.success("Transportadora adicionada com sucesso!");
      }
      setShowAddModal(false);
      resetForm();
      loadCarriers();
    } catch (error) {
      console.error("Erro ao salvar transportadora:", error);
      toast.error("Erro ao salvar transportadora");
    }
  };

  const handleDelete = async (carrier: Carrier) => {
    try {
      // Adicionar à lixeira antes de deletar
      addToTrash({
        id: carrier.id,
        type: "carrier",
        name: carrier.name,
        data: carrier,
      });
      
      await deleteCarrier(carrier.id);
      toast.success("Transportadora removida com sucesso!");
      loadCarriers();
    } catch (error) {
      console.error("Erro ao deletar transportadora:", error);
      toast.error("Erro ao remover transportadora");
    }
    setDeleteConfirm(null);
  };

  const filteredCarriers = useMemo(() => {
    let result = carriers.filter(
      (carrier) =>
        carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.cnpj.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.state?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Ordenação
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "cnpj":
            aValue = a.cnpj.toLowerCase();
            bValue = b.cnpj.toLowerCase();
            break;
          case "city":
            aValue = (a.city || "").toLowerCase();
            bValue = (b.city || "").toLowerCase();
            break;
          case "state":
            aValue = (a.state || "").toLowerCase();
            bValue = (b.state || "").toLowerCase();
            break;
          case "status":
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aValue === bValue) return 0;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [carriers, searchQuery, sortConfig]);

  const stats = useMemo(() => {
    const total = carriers.length;
    const active = carriers.filter(c => c.isActive).length;
    const inactive = carriers.filter(c => !c.isActive).length;
    const withContact = carriers.filter(c => c.contactPerson || c.contactPhone).length;
    return { total, active, inactive, withContact };
  }, [carriers]);

  const statusBadge = (isActive: boolean) => {
    const styles: Record<string, string> = {
      true: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      false: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[String(isActive)]}`}>
        {isActive ? "Ativa" : "Inativa"}
      </Badge>
    );
  };

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Transportadoras</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transportadora
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricCard label="Total" value={stats.total} icon={Truck} colorClass="text-blue-400" footer={`${stats.active} ativas`} />
          <MetricCard label="Ativas" value={stats.active} icon={CheckCircle2} colorClass="text-emerald-400" footer="Disponíveis para uso" />
          <MetricCard label="Inativas" value={stats.inactive} icon={AlertTriangle} colorClass="text-amber-400" footer="Não disponíveis" />
          <MetricCard label="Com Contato" value={stats.withContact} icon={User} colorClass="text-purple-400" footer="Têm pessoa de contato" />
        </div>

        {/* Table */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[92px]">
            <div>
              <CardTitle className="text-lg font-medium">Transportadoras</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Lista completa de transportadoras cadastradas no sistema.</p>
            </div>
            <div className="relative min-w-[220px] w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: FIXED_TABLE_HEIGHT }} className="w-full min-w-0 overflow-x-auto overflow-y-auto relative">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCarriers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma transportadora encontrada</p>
                  {searchQuery && (
                    <p className="text-sm mt-2">Tente ajustar sua busca</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="cursor-pointer w-[35%] text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("name")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>Nome</span>
                          <div className="w-4 flex justify-center">
                            {sortConfig.key === "name" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("cnpj")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>CNPJ</span>
                          <div className="w-4 flex justify-center">
                            {sortConfig.key === "cnpj" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Contato</span>
                      </TableHead>
                      <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("city")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>Localização</span>
                          <div className="w-4 flex justify-center">
                            {sortConfig.key === "city" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-center text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("status")}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          <div className="w-4 flex justify-center">
                            {sortConfig.key === "status" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-right w-[80px] text-[10px] uppercase tracking-wider text-zinc-400">
                        <span>Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCarriers.map((carrier) => (
                      <TableRow key={carrier.id} className="h-12 border-b border-border/60 hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{carrier.name}</span>
                            {carrier.website && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {carrier.website}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{carrier.cnpj}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {carrier.contactPerson && (
                              <span className="text-xs">{carrier.contactPerson}</span>
                            )}
                            {carrier.contactPhone && (
                              <span className="text-xs text-muted-foreground">{carrier.contactPhone}</span>
                            )}
                            {!carrier.contactPerson && !carrier.contactPhone && carrier.phone && (
                              <span className="text-xs text-muted-foreground">{carrier.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {carrier.city && carrier.state && (
                              <span className="text-xs">{carrier.city} - {carrier.state}</span>
                            )}
                            {carrier.city && !carrier.state && (
                              <span className="text-xs">{carrier.city}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(carrier.isActive)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(carrier)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(carrier.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCarriers.length < MIN_TABLE_ROWS &&
                      Array.from({ length: MIN_TABLE_ROWS - filteredCarriers.length }).map((_, i) => (
                        <TableRow key={`empty-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                          <TableCell colSpan={6}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modal de Adicionar/Editar */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] w-[95vw] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>
              {editingCarrier ? "Editar Transportadora" : "Nova Transportadora"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da transportadora abaixo. Os campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4 pl-2">
            <div className="space-y-6 py-4 px-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Transportadora *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Transporte Rápido Ltda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <CnpjInput
                      id="cnpj"
                      value={cnpj}
                      onValueChange={setCnpj}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone Principal</Label>
                    <PhoneBrInput
                      id="phone"
                      value={phone}
                      onValueChange={setPhone}
                      placeholder="(11) 3333-4444"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@empresa.com"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="www.empresa.com"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <CepInput
                      id="zipCode"
                      value={zipCode}
                      onValueChange={setZipCode}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pessoa de Contato */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Pessoa de Contato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Nome do Contato</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefone do Contato</Label>
                    <CellPhoneBrInput
                      id="contactPhone"
                      value={contactPhone}
                      onValueChange={setContactPhone}
                      placeholder="(11) 98888-7777"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-mail do Contato</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="joao@email.com"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Transportadora ativa (disponível para uso)</Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingCarrier ? "Salvar Alterações" : "Adicionar Transportadora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Deleção */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta transportadora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const carrier = carriers.find((c) => c.id === deleteConfirm);
                if (carrier) handleDelete(carrier);
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
