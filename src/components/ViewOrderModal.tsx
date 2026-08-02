import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText, MapPin, Calendar, Truck, Building, X, Eye, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Order, OrderItem, Customer } from "@/data/mockData";

interface Props {
  order: Order | null;
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onViewNF?: () => void;
  onUpdateStatus?: (orderId: number, status: any) => void;
}

const statusColors: Record<string, string> = {
  Pendente: "bg-warning/15 text-warning border-warning/30",
  "Em Produção": "bg-info/15 text-info border-info/30",
  Finalizado: "bg-success/15 text-success border-success/30",
  "Aguardando Coleta": "bg-primary/15 text-primary border-primary/30",
  Retirado: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

const ICMS_RATE = 0.18;
const IPI_RATE = 0.05;

export default function ViewOrderModal({ order, customer, open, onClose, onViewNF, onUpdateStatus }: Props) {
  const [activeTab, setActiveTab] = useState<"pedido" | "nf">("pedido");

  const totalWeight = order?.items?.reduce((sum, item) => sum + ((item?.weightPerUnit || 0) * (item?.quantity || 0)), 0) || 0;
  
  const baseTotal = order?.totalValue || 0;
  const icmsValue = baseTotal * ICMS_RATE;
  const ipiValue = baseTotal * IPI_RATE;
  const totalWithTaxes = baseTotal + icmsValue + ipiValue;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pedido {order?.id || ""}
            </DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Printer className="h-3 w-3 mr-1" /> Imprimir
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {order?.hasRecibo && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                  <TabsTrigger value="pedido" className="data-[state=active]:bg-zinc-700">Pedido</TabsTrigger>
                  <TabsTrigger value="nf" className="data-[state=active]:bg-zinc-700">Nota Fiscal (NF)</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <DialogDescription>
              {customer?.name} — {order?.product} — R$ {(order?.totalValue || 0).toLocaleString("pt-BR")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {activeTab === "pedido" ? (
          <div className="grid gap-6 py-4">
            {/* Conteúdo do Pedido (Cabeçalho, Dados do Cliente, Itens) */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-800/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Package className="h-3 w-3" />
                  Pedido
                </div>
                <div className="text-2xl font-bold text-zinc-100">{order?.id}</div>
                <Badge className={statusColors[order?.status || "Pendente"]}>{order?.status || "Pendente"}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Calendar className="h-3 w-3" />
                  Datas
                </div>
                <div className="text-sm text-zinc-300 space-y-1">
                  <div>Emissão: {order?.createdAt}</div>
                  <div>Atualização: {order?.updatedAt}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Truck className="h-3 w-3" />
                  Entrega
                </div>
                <div className="text-sm text-zinc-300 space-y-1">
                  <div>Método: {order?.deliveryMethod}</div>
                  {order?.carrierName && <div>Transportadora: {order.carrierName}</div>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Razão Social</div>
                    <div className="text-zinc-100">{customer?.company}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Nome do Contato</div>
                    <div className="text-zinc-100">{customer?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Contato</div>
                    <div className="text-zinc-100">{customer?.email}</div>
                    <div className="text-zinc-100">{customer?.phone}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Endereço</div>
                    <div className="text-zinc-100 space-y-1">
                      {typeof customer?.address === 'string' ? (
                        <>
                          <div>{customer.address}</div>
                          <div>{customer?.city} - {customer?.state}</div>
                        </>
                      ) : (
                        <>
                          <div>{customer?.address?.street}</div>
                          <div>{customer?.address?.neighborhood}</div>
                          <div>{customer?.address?.city} - {customer?.address?.state}</div>
                          <div>CEP: {customer?.address?.zipCode}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Dados Fiscais</div>
                    <div className="text-zinc-100 space-y-1">
                      <div>CNPJ: {customer?.cnpj}</div>
                      <div>Município: {typeof customer?.address === 'string' ? customer?.city : customer?.address?.city}</div>
                      <div>UF: {typeof customer?.address === 'string' ? customer?.state : customer?.address?.state}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Itens do Pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Itens do Pedido</h3>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order?.items?.map((item, index) => (
                      <TableRow key={index} className="border-zinc-700">
                        <TableCell className="text-zinc-300">{item.ncmCode}</TableCell>
                        <TableCell className="text-zinc-100">{item.description}</TableCell>
                        <TableCell className="text-zinc-300">{item.unit}</TableCell>
                        <TableCell className="text-zinc-300 text-right">{item.quantity}</TableCell>
                        <TableCell className="text-zinc-300 text-right">
                          R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-zinc-100 font-medium text-right">
                          R$ {item.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div className="flex justify-between gap-8 text-sm">
                    <span className="text-zinc-400">Quantidade Total:</span>
                    <span className="text-zinc-100">{order?.quantity}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-sm">
                    <span className="text-zinc-400">Peso Total:</span>
                    <span className="text-zinc-100">{totalWeight.toFixed(2)} kg</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between gap-8 text-lg font-bold text-zinc-100">
                    <span>Valor Total:</span>
                    <span>R$ {(order?.totalValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Conteúdo da Nota Fiscal (conforme ViewNFModal) */}
            <div className="border-2 border-zinc-700 p-6 bg-zinc-800/30">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-2">
                  <div className="text-sm font-bold text-zinc-300 mb-2 uppercase">Emitente</div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold">METALÚRGICA INDUSTRIAL LTDA</div>
                    <div>Rua das Indústrias, 1234 - Centro Industrial</div>
                    <div>São Paulo - SP - CEP: 04578-000</div>
                    <div>CNPJ: 12.345.678/0001-90</div>
                    <div>IE: 123.456.789-0</div>
                  </div>
                </div>
                <div className="col-span-4 text-center space-y-2">
                  <div className="text-2xl font-bold text-zinc-100 border-b-2 border-zinc-600 pb-2">NOTA FISCAL</div>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Número:</span> {order?.reciboNumber || order?.id || '-'}</div>
                    <div><span className="font-medium">Série:</span> 001</div>
                    <div><span className="font-medium">Emissão:</span> {order?.createdAt || '-'}</div>
                  </div>
                </div>
                <div className="col-span-4 space-y-2">
                  <div className="text-sm font-bold text-zinc-300 mb-2 uppercase">Destinatário</div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold">{customer?.company || customer?.name || '-'}</div>
                    <div>{customer?.name || '-'}</div>
                    <div>{typeof customer?.address === 'string' ? customer?.address : `${customer?.address?.street}, ${customer?.address?.neighborhood}` || '-'}</div>
                    <div>{typeof customer?.address === 'string' ? customer?.city : customer?.address?.city || '-'} - {typeof customer?.address === 'string' ? customer?.state : customer?.address?.state || '-'}</div>
                    <div>CNPJ: {customer?.cnpj || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-700">
              <div className="bg-zinc-800/50 p-3 text-sm font-bold text-zinc-300 uppercase">Dados dos Produtos</div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800/30">
                    <TableHead className="text-zinc-300 text-xs">CÓDIGO</TableHead>
                    <TableHead className="text-zinc-300 text-xs">DESCRIÇÃO</TableHead>
                    <TableHead className="text-zinc-300 text-xs text-right">QUANT</TableHead>
                    <TableHead className="text-zinc-300 text-xs text-right">VALOR UNIT</TableHead>
                    <TableHead className="text-zinc-300 text-xs text-right">VALOR TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order?.items?.map((item, index) => (
                    <TableRow key={index} className="border-zinc-700">
                      <TableCell className="text-xs text-zinc-300">{item?.ncmCode || '-'}</TableCell>
                      <TableCell className="text-xs text-zinc-100">{item?.description || '-'}</TableCell>
                      <TableCell className="text-xs text-zinc-300 text-right">{item?.quantity || 0}</TableCell>
                      <TableCell className="text-xs text-zinc-300 text-right">R$ {(item?.unitPrice || 0).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs text-zinc-100 font-medium text-right">R$ {(item?.totalPrice || 0).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border border-zinc-700 p-4 bg-zinc-800/30">
              <div className="text-sm font-bold text-zinc-300 mb-3 uppercase">Cálculo do Imposto</div>
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-zinc-400">Base de Cálculo ICMS:</span> <span className="text-zinc-100">R$ {baseTotal.toLocaleString("pt-BR")}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Valor ICMS (18%):</span> <span className="text-zinc-100">R$ {icmsValue.toLocaleString("pt-BR")}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-lg text-zinc-100"><span>TOTAL DA NOTA:</span> <span>R$ {totalWithTaxes.toLocaleString("pt-BR")}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-2">
            {!order?.hasRecibo && (
              <Button 
                variant="outline" 
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                onClick={() => {
                  toast.success(`Gerando recibo para o pedido ${order?.id || ''}...`);
                  onClose();
                }}
              >
                <FileText className="h-4 w-4 mr-1" />
                Gerar Recibo
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
