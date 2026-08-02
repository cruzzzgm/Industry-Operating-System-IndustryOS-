import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Building, MapPin, X, Download, Printer } from "lucide-react";
import { Order, Customer } from "@/data/mockData";

interface Props {
  order: Order | null;
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}

const ICMS_RATE = 0.18; // 18% ICMS
const IPI_RATE = 0.05; // 5% IPI

export default function ViewNFModal({ order, customer, open, onClose }: Props) {
  const baseTotal = order?.totalValue || 0;
  const icmsValue = baseTotal * ICMS_RATE;
  const ipiValue = baseTotal * IPI_RATE;
  const totalWithTaxes = baseTotal + icmsValue + ipiValue;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Nota Fiscal - {order?.reciboNumber || ""}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Printer className="h-3 w-3 mr-1" /> Imprimir
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cabeçalho da NF */}
          <div className="border-2 border-zinc-700 p-6 bg-zinc-800/30">
            <div className="grid grid-cols-12 gap-4">
              {/* Coluna Esquerda - Emitente */}
              <div className="col-span-4 space-y-2">
                <div className="text-sm font-bold text-zinc-300 mb-2">EMITENTE</div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold">METALÚRGICA INDUSTRIAL LTDA</div>
                  <div>Rua das Indústrias, 1234 - Centro Industrial</div>
                  <div>São Paulo - SP - CEP: 04578-000</div>
                  <div>CNPJ: 12.345.678/0001-90</div>
                  <div>IE: 123.456.789-0</div>
                  <div>Telefone: (11) 98765-4321</div>
                </div>
              </div>

              {/* Coluna Central - Dados da NF */}
              <div className="col-span-4 text-center space-y-2">
                <div className="text-2xl font-bold text-zinc-100 border-b-2 border-zinc-600 pb-2">
                  NOTA FISCAL
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Número:</span> {order?.reciboNumber || ""}</div>
                  <div><span className="font-medium">Série:</span> 001</div>
                  <div><span className="font-medium">Emissão:</span> {order?.createdAt || ""}</div>
                  <div><span className="font-medium">Saída:</span> {order?.updatedAt || ""}</div>
                </div>
              </div>

              {/* Coluna Direita - Destinatário */}
              <div className="col-span-4 space-y-2">
                <div className="text-sm font-bold text-zinc-300 mb-2">DESTINATÁRIO</div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold">{customer?.company || ""}</div>
                  <div>{customer?.name || ""}</div>
                  <div>{customer?.address || ""}</div>
                  <div>{customer?.city || ""} - {customer?.state || ""}</div>
                  <div>CNPJ: {customer?.cnpj || ""}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dados da Transportadora */}
          {order?.deliveryMethod === "Transportadora" && (
            <div className="border border-zinc-700 p-4 bg-zinc-800/30">
              <div className="text-sm font-bold text-zinc-300 mb-3">DADOS DA TRANSPORTADORA</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {order?.carrierName || ""}
                </div>
                <div>
                  <span className="font-medium">Frete por conta:</span> {order?.freightResponsibility || ""}
                </div>
                <div>
                  <span className="font-medium">Placa:</span> ABC-1234
                </div>
                <div>
                  <span className="font-medium">Espécie:</span> {order?.packageType || ""}
                </div>
                <div>
                  <span className="font-medium">Peso Bruto:</span> {order?.grossWeight || 0} kg
                </div>
                <div>
                  <span className="font-medium">Volume:</span> 0,500 m³
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Produtos */}
          <div className="border border-zinc-700">
            <div className="bg-zinc-800/50 p-3 text-sm font-bold text-zinc-300">
              DADOS DOS PRODUTOS
            </div>
            <div className="max-h-[400px] overflow-auto relative">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-800/30">
                  <TableHead className="text-zinc-300 text-xs">CÓDIGO</TableHead>
                  <TableHead className="text-zinc-300 text-xs">DESCRIÇÃO DOS PRODUTOS</TableHead>
                  <TableHead className="text-zinc-300 text-xs">NCM</TableHead>
                  <TableHead className="text-zinc-300 text-xs">UN</TableHead>
                  <TableHead className="text-zinc-300 text-xs text-right">QUANT</TableHead>
                  <TableHead className="text-zinc-300 text-xs text-right">VALOR UNIT</TableHead>
                  <TableHead className="text-zinc-300 text-xs text-right">VALOR TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order?.items?.map((item, index) => (
                  <TableRow key={index} className="border-zinc-700">
                    <TableCell className="text-xs text-zinc-300">{item.ncmCode || item.ncm_code || "-"}</TableCell>
                    <TableCell className="text-xs text-zinc-100">{item.description || "-"}</TableCell>
                    <TableCell className="text-xs text-zinc-300">{item.ncmCode || item.ncm_code || "-"}</TableCell>
                    <TableCell className="text-xs text-zinc-300">{item.unit || "-"}</TableCell>
                    <TableCell className="text-xs text-zinc-300 text-right">{item.quantity || 0}</TableCell>
                    <TableCell className="text-xs text-zinc-300 text-right">
                      R$ {(item.unitPrice || item.unit_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-100 font-medium text-right">
                      R$ {(item.totalPrice || item.total_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Cálculo dos Impostos */}
          <div className="border border-zinc-700 p-4 bg-zinc-800/30">
            <div className="text-sm font-bold text-zinc-300 mb-3">CÁLCULO DO IMPOSTO</div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Base de Cálculo ICMS:</span>
                  <span className="text-zinc-100">R$ {baseTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Valor ICMS (18%):</span>
                  <span className="text-zinc-100">R$ {icmsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Base de Cálculo IPI:</span>
                  <span className="text-zinc-100">R$ {baseTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Valor IPI (5%):</span>
                  <span className="text-zinc-100">R$ {ipiValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-300">Valor dos Produtos:</span>
                  <span className="text-zinc-100">R$ {baseTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Valor ICMS:</span>
                  <span className="text-zinc-100">R$ {icmsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Valor IPI:</span>
                  <span className="text-zinc-100">R$ {ipiValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold text-zinc-100">
                  <span>TOTAL DA NOTA:</span>
                  <span>R$ {totalWithTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="border border-zinc-700 p-4 bg-zinc-800/30">
            <div className="text-sm font-bold text-zinc-300 mb-3">INFORMAÇÕES ADICIONAIS</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-zinc-400">Natureza da Operação:</span>
                <span className="text-zinc-100 ml-2">Venda de Mercadorias</span>
              </div>
              <div>
                <span className="font-medium text-zinc-400">Forma de Pagamento:</span>
                <span className="text-zinc-100 ml-2">Fatura 30 dias</span>
              </div>
              <div>
                <span className="font-medium text-zinc-400">Entrada/Saída:</span>
                <span className="text-zinc-100 ml-2">Saída</span>
              </div>
              <div>
                <span className="font-medium text-zinc-400">Município de Ocorrência:</span>
                <span className="text-zinc-100 ml-2">{customer?.city || ""}</span>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-700">
            <div>Documento emitido por sistema eletrônico - DANFE</div>
            <div>Autenticidade: www.fazenda.sp.gov.br/cte/consultadocumento.aspx</div>
            <div>Chave de Acesso: {order?.reciboNumber?.replace(/\D/g, '').substring(0, 44) || ""}...</div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
