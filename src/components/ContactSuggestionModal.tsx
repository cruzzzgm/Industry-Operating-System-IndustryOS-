import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Send, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/data/mockData";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

interface ContactHistory {
  id: string;
  date: string;
  type: "email" | "whatsapp";
  message: string;
  status: "sent" | "failed";
}

export default function ContactSuggestionModal({ open, onClose, customer }: Props) {
  const [contactType, setContactType] = useState<"email" | "whatsapp">("email");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([
    {
      id: "1",
      date: "2024-01-15",
      type: "email",
      message: "Olá [Cliente], temos uma nova promoção de produtos para você!",
      status: "sent"
    },
    {
      id: "2", 
      date: "2024-01-10",
      type: "whatsapp",
      message: "Prezado [Cliente], seu pedido está pronto para retirada.",
      status: "sent"
    }
  ]);

  if (!customer) return null;

  const templates = {
    email: [
      {
        subject: "Novos Produtos Disponíveis",
        message: `Prezado(a) ${customer.name},\n\nTemos o prazer de informar que novos produtos estão disponíveis em nosso catálogo. Como cliente valioso, você tem condições especiais.\n\nGostaríamos de agendar uma visita para apresentar nossas novidades.\n\nAtenciosamente,\nEquipe de Vendas`
      },
      {
        subject: "Acompanhamento de Pedido",
        message: `Olá ${customer.name},\n\nEstamos entrando em contato para acompanhar seu último pedido e verificar se tudo está conforme suas expectativas.\n\nCaso precise de algo adicional, estamos à disposição.\n\nAtenciosamente,\nEquipe de Suporte`
      },
      {
        subject: "Promoção Exclusiva",
        message: `Caro(a) ${customer.name},\n\nTemos uma promoção exclusiva para você! Descontos especiais em toda nossa linha de produtos.\n\nAproveite esta oportunidade única.\n\nAgende já sua visita!\n\nAtenciosamente,\nEquipe Comercial`
      }
    ],
    whatsapp: [
      {
        message: `Olá ${customer.name}! Tudo bem? Temos novidades que podem interessar você. Podemos conversar?`
      },
      {
        message: `${customer.name}, seu pedido está pronto para retirada! Quando pode vir buscar?`
      },
      {
        message: `Oi ${customer.name}! Lembrando que temos promoções especiais esta semana. Que tal dar uma passada aqui?`
      }
    ]
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    if (contactType === "email" && !subject.trim()) {
      toast.error("Digite um assunto");
      return;
    }

    setIsSending(true);

    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newContact: ContactHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: contactType,
      message: message,
      status: "sent"
    };

    setContactHistory(prev => [newContact, ...prev]);
    setIsSending(false);
    
    toast.success(`${contactType === "email" ? "E-mail" : "WhatsApp"} enviado com sucesso!`, {
      description: `Para ${customer.name} (${contactType === "email" ? customer.email : customer.phone})`
    });

    // Resetar formulário
    setMessage("");
    setSubject("");
  };

  const handleTemplateSelect = (template: any) => {
    if (contactType === "email") {
      setSubject(template.subject);
      setMessage(template.message);
    } else {
      setMessage(template.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contactType === "email" ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            Sugerir Contato - {customer.name}
          </DialogTitle>
          <DialogDescription>
            Entre em contato com {customer.company} através de e-mail ou WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Informações do Cliente */}
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-400">Razão Social</div>
                <div className="text-zinc-100">{customer.company}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-400">Contato</div>
                <div className="text-zinc-100">{customer.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-400">E-mail</div>
                <div className="text-zinc-100">{customer.email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-400">Telefone</div>
                <div className="text-zinc-100">{customer.phone}</div>
              </div>
            </div>
          </div>

          {/* Tipo de Contato */}
          <div className="space-y-4">
            <Label>Tipo de Contato</Label>
            <RadioGroup value={contactType} onValueChange={(value: "email" | "whatsapp") => setContactType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <Label>Templates Rápidos</Label>
            <div className="grid grid-cols-1 gap-2">
              {templates[contactType].map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="text-sm">
                    {contactType === "email" && <div className="font-medium">{template.subject}</div>}
                    <div className="text-zinc-400 truncate">{template.message.substring(0, 80)}...</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Formulário de Envio */}
          <div className="space-y-4">
            {contactType === "email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto do e-mail"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="bg-zinc-900 border-zinc-700 text-white min-h-[120px]"
              />
            </div>
          </div>

          {/* Histórico de Contatos */}
          <div className="space-y-4">
            <Label>Histórico de Contatos</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {contactHistory.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {contact.type === "email" ? (
                      <Mail className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-zinc-400" />
                    )}
                    <div>
                      <div className="text-sm text-zinc-100">{contact.date}</div>
                      <div className="text-xs text-zinc-400 truncate">{contact.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contact.status === "sent" ? "default" : "destructive"}>
                      {contact.status === "sent" ? "Enviado" : "Falhou"}
                    </Badge>
                    {contact.status === "sent" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar {contactType === "email" ? "E-mail" : "WhatsApp"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
