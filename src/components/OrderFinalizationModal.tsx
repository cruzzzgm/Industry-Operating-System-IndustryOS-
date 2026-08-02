import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Truck, Printer, Mail, MessageCircle, ChevronRight, ChevronLeft, CheckCircle2, Package, AlertTriangle, ClipboardList, Shield, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Order, OrderItem, ICMS_CREDIT_RATE, suggestWeight, suggestPackageType } from "@/data/mockData";
import { fetchCarriers, Carrier } from "@/services/api";
import { z } from "zod";

const PACKAGE_OPTIONS = ["Fardo", "Caixa", "Sacos", "Palete"] as const;

const finalizationSchema = z.object({
  emitRecibo: z.boolean(),
  useCarrier: z.boolean(),
  carrierName: z.string().nullable(),
  freightResponsibility: z.enum(["Remetente", "Destinatário"]).nullable(),
  packageType: z.string().min(1, "Selecione a espécie").nullable(),
  grossWeight: z.number().positive("Peso deve ser positivo").nullable(),
}).refine(
  (data) => !data.useCarrier || (data.carrierName && data.freightResponsibility && data.packageType && data.grossWeight),
  { message: "Preencha todos os campos de logística quando transportadora estiver selecionada" }
);

interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    hasRecibo: boolean;
    reciboNumber: string | null;
    carrierName: string | null;
    freightResponsibility: string | null;
    grossWeight: number | null;
    packageType: string | null;
    taxAmount: number | null;
    icmsCredit: number | null;
    invoiceItems: OrderItem[];
    invoiceTotal: number;
    generateFinanceEntry: boolean;
  }) => void;
}

export default function OrderFinalizationModal({ order, open, onClose, onConfirm }: Props) {
  const [step, setStep] = useState(1);
  const [emitRecibo, setEmitRecibo] = useState(true);
  const [useCarrier, setUseCarrier] = useState(order.deliveryMethod === "Transportadora");
  const [carrierName, setCarrierName] = useState<string>("");
  const [freightResp, setFreightResp] = useState<string>("");
  const [packageType, setPackageType] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [carrierSearch, setCarrierSearch] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [transmitProgress, setTransmitProgress] = useState(0);
  const [transmitStage, setTransmitStage] = useState("");
  const [generateFinanceEntry, setGenerateFinanceEntry] = useState(true);

  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(false);

  // Carregar transportadoras da API
  useEffect(() => {
    if (open) {
      setLoadingCarriers(true);
      fetchCarriers()
        .then(data => {
          const activeCarriers = data.filter(c => c.isActive);
          setCarriers(activeCarriers);
        })
        .catch(error => {
          console.error("Erro ao carregar transportadoras:", error);
          toast.error("Erro ao carregar transportadoras");
        })
        .finally(() => setLoadingCarriers(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors([]);
      setEmitRecibo(true);
      setUseCarrier(order.deliveryMethod === "Transportadora");
      setCarrierName("");
      setFreightResp("");
      setCarrierSearch("");
      setSubmitting(false);
      setTransmitProgress(0);
      setTransmitStage("");
      setGenerateFinanceEntry(true);

      const suggested = suggestWeight(order.items);
      setGrossWeight(String(Math.round(suggested * 100) / 100));
      setPackageType(suggestPackageType(order.items));

      setInvoiceItems(order.items.map(i => ({ ...i })));
    }
  }, [open, order]);

  const invoiceTotal = useMemo(
    () => invoiceItems.reduce((s, i) => s + i.totalPrice, 0),
    [invoiceItems],
  );

  const taxAmount = useMemo(() => invoiceTotal * ICMS_CREDIT_RATE, [invoiceTotal]);
  const reciboNumber = useMemo(() => String(2260 + Math.floor(Math.random() * 100)), []);

  const filteredCarriers = useMemo(() => {
    if (!carrierSearch) return carriers;
    const q = carrierSearch.toLowerCase();
    return carriers.filter(c => c.name.toLowerCase().includes(q));
  }, [carrierSearch, carriers]);

  const updateInvoiceItem = (
    index: number,
    field: "description" | "ncmCode" | "quantity" | "unitPrice",
    raw: string | number,
  ) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };
      if (field === "description") row.description = String(raw);
      else if (field === "ncmCode") row.ncmCode = String(raw);
      else if (field === "quantity") row.quantity = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".")) || 0;
      else if (field === "unitPrice") row.unitPrice = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".")) || 0;
      row.totalPrice = Number((row.quantity * row.unitPrice).toFixed(2));
      updated[index] = row;
      return updated;
    });
  };

  const validateAndProceed = () => {
    if (step === 1) {
      if (useCarrier) {
        const errs: string[] = [];
        if (!carrierName) errs.push("Selecione uma transportadora");
        if (!freightResp) errs.push("Selecione responsabilidade do frete");
        if (!packageType) errs.push("Selecione a espécie da embalagem");
        if (!grossWeight || Number(grossWeight) <= 0) errs.push("Informe o peso bruto válido");
        if (errs.length) { setErrors(errs); return; }
      }
      setErrors([]);
      setStep(emitRecibo ? 2 : 3);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const simulateTransmit = () => {
    return new Promise<void>((resolve) => {
      const stages = [
        { label: "Assinando com Certificado Digital A1...", progress: 25 },
        { label: "Enviando para Sefaz/Receita...", progress: 60 },
        { label: "Aguardando autorização...", progress: 85 },
        { label: "Autorizado! Gerando PDF do Recibo...", progress: 100 },
      ];
      let i = 0;
      const run = () => {
        if (i >= stages.length) { resolve(); return; }
        setTransmitStage(stages[i].label);
        setTransmitProgress(stages[i].progress);
        i++;
        setTimeout(run, 800);
      };
      run();
    });
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const result = finalizationSchema.safeParse({
        emitRecibo,
        useCarrier,
        carrierName: useCarrier ? carrierName : null,
        freightResponsibility: useCarrier ? freightResp : null,
        packageType: useCarrier ? packageType : null,
        grossWeight: useCarrier ? Number(grossWeight) : null,
      });

      if (!result.success) {
        setErrors(result.error.issues.map(e => e.message));
        setSubmitting(false);
        return;
      }

      if (emitRecibo) {
        await simulateTransmit();
      }

      onConfirm({
        hasRecibo: emitRecibo,
        reciboNumber: emitRecibo ? reciboNumber : null,
        carrierName: useCarrier ? carrierName : null,
        freightResponsibility: useCarrier ? freightResp : null,
        grossWeight: useCarrier ? Number(grossWeight) : null,
        packageType: useCarrier ? packageType : null,
        taxAmount: emitRecibo ? taxAmount : null,
        icmsCredit: emitRecibo ? taxAmount : null,
        invoiceItems,
        invoiceTotal,
        generateFinanceEntry,
      });

      if (emitRecibo) {
        toast.success(`Recibo ${reciboNumber} emitido e arquivado!`, {
          description: `Recibo gerado para ${order.customerName} — R$ ${invoiceTotal.toLocaleString("pt-BR")}`,
          icon: <FileText className="h-4 w-4" />,
          duration: 5000,
        });
      }

      if (useCarrier && carrierName) {
        setTimeout(() => {
          toast.info("Ordem de coleta gerada", {
            description: `Guia de coleta via ${carrierName} — Peso: ${grossWeight}kg`,
            icon: <ClipboardList className="h-4 w-4" />,
            duration: 6000,
          });
        }, 600);
      }

      toast.success("Pedido finalizado com sucesso", {
        description: `Pedido ${order.id} ${useCarrier ? "— Aguardando Coleta" : "— Concluído"}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Finalizar Pedido {order.id}
          </DialogTitle>
          <DialogDescription>
            {order.customerName} — {order.product} — R$ {order.totalValue.toLocaleString("pt-BR")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{s}</div>
              <span className={`text-xs hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Logística" : s === 2 ? "Recibo" : "Confirmação"}
              </span>
              {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <Separator />

        {errors.length > 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {e}
              </p>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados do Pedido (importados)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{order.customerName}</span></div>
                  <div><span className="text-muted-foreground">Qtd Total:</span> <span className="font-medium">{order.quantity} un</span></div>
                  <div><span className="text-muted-foreground">Produto:</span> <span className="font-medium">{order.product}</span></div>
                  <div><span className="text-muted-foreground">Valor:</span> <span className="font-medium">R$ {order.totalValue.toLocaleString("pt-BR")}</span></div>
                </div>
                {order.items.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Itens: {order.items.map(i => `${i.description} (NCM: ${i.ncmCode})`).join(", ")}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <Label htmlFor="recibo-toggle" className="text-sm font-medium">Emitir Recibo?</Label>
                </div>
                <Switch id="recibo-toggle" checked={emitRecibo} onCheckedChange={setEmitRecibo} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <Label htmlFor="carrier-toggle" className="text-sm font-medium">Envio por Transportadora?</Label>
                </div>
                <Switch id="carrier-toggle" checked={useCarrier} onCheckedChange={setUseCarrier} />
              </div>

              {useCarrier && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pl-2 border-l-2 border-primary/30 ml-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="carrier-search" className="text-xs text-muted-foreground">Selecionar Transportadora</Label>
                    <Input id="carrier-search" name="carrier-search" placeholder="Buscar transportadora..." value={carrierSearch} onChange={e => setCarrierSearch(e.target.value)} className="mb-1" />
                    <Select value={carrierName} onValueChange={setCarrierName}>
                      <SelectTrigger id="carrier-select"><SelectValue placeholder="Escolha uma transportadora" /></SelectTrigger>
                      <SelectContent>
                        {filteredCarriers.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name} — {c.cnpj}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Frete por conta</Label>
                    <Select value={freightResp} onValueChange={setFreightResp}>
                      <SelectTrigger id="freight-resp"><SelectValue placeholder="Remetente / Destinatário" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Remetente">Remetente</SelectItem>
                        <SelectItem value="Destinatário">Destinatário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Espécie</Label>
                      <Select value={packageType} onValueChange={setPackageType}>
                        <SelectTrigger id="package-type"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {PACKAGE_OPTIONS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gross-weight" className="text-xs text-muted-foreground">
                        Peso Bruto (kg) <span className="text-primary">— sugerido</span>
                      </Label>
                      <Input id="gross-weight" name="gross-weight" type="number" placeholder="0.00" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && emitRecibo && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-primary/5 p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground text-lg">INDUSTRYOS LTDA</p>
                      <p className="text-xs text-muted-foreground">CNPJ: 00.000.000/0001-00</p>
                      <p className="text-xs text-muted-foreground">Rua Industrial, 1000 – São Paulo/SP</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary text-primary-foreground text-xs">RECIBO</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Nº {reciboNumber}</p>
                      <p className="text-xs text-muted-foreground">Série 001</p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-muted/50 rounded text-center">
                    <p className="text-xs text-muted-foreground font-mono tracking-widest">|||| |||| |||| |||| |||| |||| ||||</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Chave: 3524 0600 0000 0000 0100 5500 1000 00{reciboNumber} 1000 0000 01</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">DESTINATÁRIO</p>
                      <p className="font-medium text-foreground">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">DATA DE EMISSÃO</p>
                      <p className="text-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">ITENS DO RECIBO — <span className="text-primary">edição em tempo real</span></p>
                    <div className="max-h-[320px] overflow-x-auto overflow-y-auto rounded-md border relative">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs min-w-[120px]">Descrição</TableHead>
                            <TableHead className="text-xs min-w-[100px]">NCM</TableHead>
                            <TableHead className="text-xs w-14">UN</TableHead>
                            <TableHead className="text-xs text-right w-24">Qtd</TableHead>
                            <TableHead className="text-xs text-right w-28">Vl. Unit.</TableHead>
                            <TableHead className="text-xs text-right min-w-[88px]">Vl. Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs p-1 align-top">
                                <Input
                                  value={item.description}
                                  onChange={e => updateInvoiceItem(i, "description", e.target.value)}
                                  className="h-8 text-xs min-w-[120px]"
                                  name={`inv-desc-${i}`}
                                />
                              </TableCell>
                              <TableCell className="text-xs p-1 align-top">
                                <Input
                                  value={item.ncmCode}
                                  onChange={e => updateInvoiceItem(i, "ncmCode", e.target.value)}
                                  className="h-8 text-xs font-mono"
                                  name={`inv-ncm-${i}`}
                                />
                              </TableCell>
                              <TableCell className="text-xs p-1 align-top">
                                <span className="text-muted-foreground px-1">{item.unit}</span>
                              </TableCell>
                              <TableCell className="text-xs text-right p-1 align-top">
                                <Input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={item.quantity}
                                  onChange={e => updateInvoiceItem(i, "quantity", Number(e.target.value))}
                                  className="h-8 text-xs text-right"
                                  name={`inv-qty-${i}`}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-right p-1 align-top">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={e => updateInvoiceItem(i, "unitPrice", Number(e.target.value))}
                                  className="h-8 text-xs text-right border-primary/40 bg-primary/5 font-medium"
                                  name={`inv-unit-${i}`}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium tabular-nums align-top pt-2">R$ {item.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Base ICMS</p>
                      <p className="font-medium text-foreground">R$ {invoiceTotal.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Créd. ICMS (2,82%)</p>
                      <p className="font-medium text-foreground">R$ {taxAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted-foreground">Valor do Recibo</p>
                      <p className="font-bold text-primary text-lg">R$ {invoiceTotal.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>

                  {useCarrier && carrierName && (
                    <div className="p-2 rounded bg-muted/50 text-sm">
                      <p className="text-xs text-muted-foreground font-medium">TRANSPORTADORA</p>
                      <p className="text-foreground">{carrierName} — Frete: {freightResp} — {packageType}, {grossWeight}kg</p>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={() => window.print()}>
                <Printer className="h-3 w-3 mr-1" /> Imprimir Recibo
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-sm font-medium text-foreground">Resumo da Finalização</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  {emitRecibo ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="h-4 w-4" />}
                  <span className="text-sm">{emitRecibo ? `Recibo ${reciboNumber} — R$ ${invoiceTotal.toLocaleString("pt-BR")}` : "Simples Remessa (sem recibo)"}</span>
                </div>

                {useCarrier && carrierName && (
                  <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Guia de Coleta</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Transportadora:</span> <strong>{carrierName}</strong></div>
                      <div><span className="text-muted-foreground">Frete:</span> <strong>{freightResp}</strong></div>
                      <div><span className="text-muted-foreground">Espécie:</span> <strong>{packageType}</strong></div>
                      <div><span className="text-muted-foreground">Peso Bruto:</span> <strong>{grossWeight}kg</strong></div>
                    </div>
                  </div>
                )}

                {/* Finance Integration Option */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Gerar Conta a Receber</p>
                      <p className="text-xs text-muted-foreground">Criar entrada no financeiro automaticamente</p>
                    </div>
                  </div>
                  <Switch
                    checked={generateFinanceEntry}
                    onCheckedChange={setGenerateFinanceEntry}
                  />
                </div>

                {/* Sefaz Transmission Progress */}
                {submitting && emitRecibo && (
                  <div className="rounded-lg border border-primary/30 p-4 space-y-3 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium text-primary">{transmitStage || "Preparando transmissão..."}</span>
                    </div>
                    <Progress value={transmitProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Simulação de transmissão para Sefaz/Receita Federal</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="flex-row justify-between gap-2">
          <div>
            {step > 1 && !submitting && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-3 w-3 mr-1" /> Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!submitting && <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>}
            {step < 3 ? (
              <Button size="sm" onClick={validateAndProceed}>
                Próximo <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleConfirm} disabled={submitting}>
                {emitRecibo ? (
                  <>
                    <Send className="h-3 w-3 mr-1" /> Transmitir e Gerar Recibo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar Finalização
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
