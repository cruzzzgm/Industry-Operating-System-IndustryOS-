import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CnpjInput, CellPhoneBrInput } from '@/components/ui/masked-input';
import { toast } from 'sonner';
import { Building2, RefreshCw } from 'lucide-react';
import AddressForm from './AddressForm';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  country: string;
  segment: string;
  contact: string;
  notes: string;
  lastOrderDate: string;
  totalOrders: number;
  totalSpent: number;
}

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'lastOrderDate' | 'totalOrders' | 'totalSpent'>) => void;
  customer?: Customer;
}

export default function CustomerFormModal({ open, onClose, onSave, customer }: CustomerFormModalProps) {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [cnpj, setCnpj] = useState(customer?.cnpj || "");
  const [addressData, setAddressData] = useState({
    street: customer?.address || "",
    number: customer?.address || "",
    neighborhood: customer?.address || "",
    cep: customer?.address || ""
  });
  const [city, setCity] = useState(customer?.city || "");
  const [state, setState] = useState(customer?.state || "");
  const [country, setCountry] = useState(customer?.country || "");
  const [segment, setSegment] = useState(customer?.segment || "");
  const [contact, setContact] = useState(customer?.contact || "");
  const [notes, setNotes] = useState(customer?.notes || "");

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setCompany(customer.company);
      setCnpj(customer.cnpj);
      setAddressData({
        street: customer.address,
        number: customer.address,
        neighborhood: customer.address,
        cep: customer.address
      });
      setCity(customer.city);
      setState(customer.state);
      setCountry(customer.country);
      setSegment(customer.segment);
      setContact(customer.contact);
      setNotes(customer.notes);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setCnpj("");
      setAddressData({
        street: "",
        number: "",
        neighborhood: "",
        cep: ""
      });
      setCity("");
      setState("");
      setCountry("");
      setSegment("");
      setContact("");
      setNotes("");
    }
  }, [open, customer]);

  const handleSubmit = () => {
    if (!name.trim() || !company.trim()) {
      toast.error("Nome e Empresa são obrigatórios");
      return;
    }

    const customerData = {
      id: customer?.id || Date.now().toString(),
      name,
      email,
      phone,
      company,
      cnpj,
      address: addressData.street,
      city,
      state,
      country,
      segment,
      contact,
      notes,
      lastOrderDate: customer?.lastOrderDate || new Date().toISOString().slice(0, 10),
      totalOrders: customer?.totalOrders || 0,
      totalSpent: customer?.totalSpent || 0
    };

    onSave(customerData);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {customer ? "Atualize os dados do cliente" : "Cadastre um novo cliente no sistema"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Dados Pessoais e Empresa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs">Nome *</Label>
              <Input id="cust-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-company" className="text-xs">Empresa *</Label>
              <Input id="cust-company" value={company} onChange={e => setCompany(e.target.value)} placeholder="Razão social" />
            </div>
          </div>

          {/* Documentação */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-cnpj" className="text-xs">CNPJ</Label>
            <CnpjInput id="cust-cnpj" name="cust-cnpj" value={cnpj} onValueChange={setCnpj} placeholder="00.000.000/0001-00" />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-email" className="text-xs">E-mail (Recibo)</Label>
              <Input id="cust-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-xs">WhatsApp (Logística)</Label>
              <CellPhoneBrInput id="cust-phone" name="cust-phone" value={phone} onValueChange={setPhone} placeholder="(11) 99999-0000" />
            </div>
          </div>

          {/* Localização */}
          <AddressForm
            value={addressData}
            onChange={setAddressData}
            disabled={!country}
          />

          {/* Segmento e Contato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-segment" className="text-xs">Segmento</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indústria">Indústria</SelectItem>
                  <SelectItem value="Comércio">Comércio</SelectItem>
                  <SelectItem value="Serviços">Serviços</SelectItem>
                  <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                  <SelectItem value="Agricultura">Agricultura</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-contact" className="text-xs">Contato Responsável</Label>
              <Input id="cust-contact" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do responsável" />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-notes" className="text-xs">Observações</Label>
            <textarea 
              id="cust-notes" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Preferências, informações adicionais..."
              className="w-full h-20 px-3 py-2 text-sm border border-zinc-700 rounded-md bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {customer ? "Salvar & Sincronizar" : "Cadastrar & Sincronizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
