import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageCircle, Send, CheckCircle, AlertCircle, ExternalLink, Edit3, X } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/data/mockData";
import { CellPhoneBrInput } from "@/components/ui/masked-input";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  handleMessageSent?: (customerId: string) => void;
  globalContactHistory?: Record<string, ContactHistory[]>;
  setGlobalContactHistory?: React.Dispatch<React.SetStateAction<Record<string, ContactHistory[]>>>;
}

interface ContactHistory {
  id: string;
  date: string;
  type: "email" | "whatsapp";
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
}

export default function AutomationModal({ open, onClose, customer, handleMessageSent, globalContactHistory: propGlobalContactHistory, setGlobalContactHistory: propSetGlobalContactHistory }: Props) {
  const [selectedMethods, setSelectedMethods] = useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: false });
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<ContactHistory | null>(null);
  // Estados para o modal principal
  const [mainEditableEmail, setMainEditableEmail] = useState("");
  const [mainEditablePhone, setMainEditablePhone] = useState("");
  
  // Estados para o modal de confirmação
  const [confirmEditableEmail, setConfirmEditableEmail] = useState("");
  const [confirmEditablePhone, setConfirmEditablePhone] = useState("");
  
  // Estados compartilhados para edição
  const [editableEmail, setEditableEmail] = useState("");
  const [editablePhone, setEditablePhone] = useState("");
  
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templates, setTemplates] = useState([
    {
      id: "1",
      name: "Reengajamento Padrão",
      subject: "Retorno - Metalúrgica Silva",
      message: `Prezado(a) [Cliente],\n\nNotamos que você está há algum tempo sem fazer pedidos. Gostaríamos de saber se há algo que possamos fazer para ajudar.\n\nTemos novos produtos e condições especiais para clientes como você.\n\nPodemos agendar uma visita para apresentar nossas novidades?\n\nAtenciosamente,\nEquipe Comercial\nMetalúrgica Silva S/A`
    }
  ]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateMessage, setNewTemplateMessage] = useState("");
  
  // Usar histórico global passado como prop ou estado local
  const globalContactHistory = propGlobalContactHistory || {};
  const setGlobalContactHistory = propSetGlobalContactHistory || (() => {});
  
  // Histórico filtrado para o cliente atual
  const contactHistory = globalContactHistory[customer?.id || ""] || [];

  if (!customer) return null;

  const handleMethodChange = (method: "email" | "whatsapp", checked: boolean) => {
    setSelectedMethods(prev => ({ ...prev, [method]: checked }));
    setShowConfirmation(false);
  };

  const handleTemplateSelect = (template: any) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateMessage.trim()) {
      toast.error("Preencha todos os campos do template");
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      subject: newTemplateSubject,
      message: newTemplateMessage
    };

    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName("");
    setNewTemplateSubject("");
    setNewTemplateMessage("");
    setShowTemplateManager(false);
    toast.success("Template adicionado com sucesso!");
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateSubject(template.subject);
    setNewTemplateMessage(template.message);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateMessage.trim()) {
      toast.error("Preencha todos os campos do template");
      return;
    }

    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: newTemplateName, subject: newTemplateSubject, message: newTemplateMessage }
        : t
    ));

    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateSubject("");
    setNewTemplateMessage("");
    setShowTemplateManager(false);
    toast.success("Template atualizado com sucesso!");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success("Template removido com sucesso!");
  };

  const handleConfirmSend = () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    if (selectedMethods.email && !subject.trim()) {
      toast.error("Digite um assunto para o e-mail");
      return;
    }

    // Validar que pelo menos um método foi selecionado
    if (!selectedMethods.email && !selectedMethods.whatsapp) {
      toast.error("Selecione pelo menos um método de envio");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSend = async () => {
    setIsSending(true);

    // Simular envio para múltiplos métodos
    const methodsToSend: ("email" | "whatsapp")[] = [];
    if (selectedMethods.email) methodsToSend.push("email");
    if (selectedMethods.whatsapp) methodsToSend.push("whatsapp");

    for (const method of methodsToSend) {
      // Simular envio (em produção, aqui seria integração real com API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newContact: ContactHistory = {
        id: `${Date.now()}-${method}`,
        date: new Date().toISOString().split('T')[0],
        type: method,
        recipient: method === "email" ? (editableEmail || customer.email) : (editablePhone || customer.phone),
        message: message,
        status: "sent"
      };

      // Adicionar ao histórico global do cliente específico
      setGlobalContactHistory(prev => ({
        ...prev,
        [customer.id]: [newContact, ...(prev[customer.id] || [])]
      }));

      // Em produção, aqui seria redirecionamento real
      if (method === "email") {
        // Simular abertura do cliente de e-mail
        window.open(`mailto:${editableEmail || customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
      } else {
        // Simular abertura do WhatsApp
        const phone = (editablePhone || customer.phone).replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }

    setIsSending(false);
    setShowConfirmModal(false);

    const methodsText = methodsToSend.map(m => m === "email" ? "E-mail" : "WhatsApp").join(" e ");
    toast.success(`${methodsText} enviado(s) com sucesso!`, {
      description: `Para ${customer.name} - Mensagem registrada no histórico`
    });

    // Resetar formulário
    setMessage("");
    setSubject("");
    setSelectedMethods({ email: true, whatsapp: false });
    
    // Notificar que mensagem foi enviada
    if (handleMessageSent && customer?.id) {
      handleMessageSent(customer.id);
    }
    
    // Fechar modal principal
    onClose();
  };

  const handleEditContact = () => {
    setMainEditableEmail(customer.email);
    setMainEditablePhone(customer.phone);
  };

  const handleEditContactFromConfirm = () => {
    if (customer) {
      setEditableEmail(customer.email);
      setEditablePhone(customer.phone);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Automação de Contato - {customer.name}
            </DialogTitle>
            <DialogDescription>
              Envie mensagens automáticas por e-mail ou WhatsApp para {customer.company}
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
                  <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    E-mail
                  </div>
                  <div className="text-zinc-100">{customer.email}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </div>
                  <div className="text-zinc-100">{customer.phone}</div>
                </div>
              </div>
            </div>

            {/* Seleção do Método */}
            <div className="space-y-4">
              <Label>Escolha os métodos de envio (pode selecionar ambos)</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="email" 
                    checked={selectedMethods.email}
                    onCheckedChange={(checked) => handleMethodChange("email", checked as boolean)}
                  />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    <span>E-mail</span>
                    <Badge variant="outline" className="text-xs">Profissional</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="whatsapp" 
                    checked={selectedMethods.whatsapp}
                    onCheckedChange={(checked) => handleMethodChange("whatsapp", checked as boolean)}
                  />
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                    <Badge variant="outline" className="text-xs">Rápido</Badge>
                  </Label>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Templates de Reengajamento</Label>
                <Button size="sm" variant="outline" onClick={() => setShowTemplateManager(!showTemplateManager)}>
                  {showTemplateManager ? "Fechar" : "Gerenciar Templates"}
                </Button>
              </div>
              
              {!showTemplateManager ? (
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template, index) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="text-sm">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-zinc-400 truncate">{template.message.substring(0, 80)}...</div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg max-w-full overflow-hidden">
                  {/* Formulário de Adicionar/Editar Template */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Nome do template"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white w-full"
                    />
                    <Input
                      placeholder="Assunto (para e-mails)"
                      value={newTemplateSubject}
                      onChange={(e) => setNewTemplateSubject(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white w-full"
                    />
                    <Textarea
                      placeholder="Mensagem do template"
                      value={newTemplateMessage}
                      onChange={(e) => setNewTemplateMessage(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white min-h-[100px] max-h-[200px] w-full resize-none"
                    />
                    <div className="flex gap-2">
                      {editingTemplate ? (
                        <>
                          <Button onClick={handleUpdateTemplate} className="bg-blue-600 hover:bg-blue-700">
                            Atualizar Template
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setEditingTemplate(null);
                            setNewTemplateName("");
                            setNewTemplateSubject("");
                            setNewTemplateMessage("");
                          }}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleAddTemplate} className="bg-green-600 hover:bg-green-700">
                          Adicionar Template
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Templates Existentes */}
                  <div className="space-y-2">
                    <Label className="text-sm">Templates Existentes</Label>
                    <div className="max-h-60 overflow-y-auto">
                      {templates.map((template) => (
                        <div key={template.id} className="flex items-start justify-between p-3 bg-zinc-900 rounded mb-2 min-w-0">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-medium text-sm truncate">{template.name}</div>
                            <div className="text-xs text-zinc-400 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{template.message}</div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(template)}>
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formulário de Envio */}
            <div className="space-y-4">
              {selectedMethods.email && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto do e-mail"
                    className="bg-zinc-900 border-zinc-700 text-white w-full"
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
                  className="bg-zinc-900 border-zinc-700 text-white min-h-[120px] w-full"
                />
              </div>
            </div>

            {/* Histórico de Envios */}
            <div className="space-y-4">
              <Label>Histórico de Envios</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {contactHistory.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800/70 transition-colors"
                    onClick={() => setViewingMessage(contact)}
                  >
                    <div className="flex items-center gap-3">
                      {contact.type === "email" ? (
                        <Mail className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-zinc-400" />
                      )}
                      <div>
                        <div className="text-sm text-zinc-100">{contact.date}</div>
                        <div className="text-xs text-zinc-400">{contact.recipient}</div>
                        <div className="text-xs text-zinc-400 truncate max-w-[200px]">
                          {contact.status === "sent" ? "Mensagem enviada com sucesso" : contact.status === "failed" ? "Falha no envio da mensagem" : "Aguardando envio da mensagem"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={contact.status === "sent" ? "default" : contact.status === "failed" ? "destructive" : "secondary"}>
                        {contact.status === "sent" ? "Enviado" : contact.status === "failed" ? "Falhou" : "Pendente"}
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
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmSend}
                disabled={!message.trim() || (selectedMethods.email && !subject.trim()) || (!selectedMethods.email && !selectedMethods.whatsapp)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirmar Envio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Envio */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => !open && setShowConfirmModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirmar Envio
            </DialogTitle>
            <DialogDescription>
              Verifique os dados antes de enviar a mensagem para {customer?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedMethods.email && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Destinatário (E-mail):</Label>
                  <Button size="sm" variant="ghost" onClick={handleEditContactFromConfirm}>
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={editableEmail || customer?.email}
                  onChange={(e) => setEditableEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="bg-zinc-900 border-zinc-700 text-white w-full"
                />
              </div>
            )}
            {selectedMethods.whatsapp && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Destinatário (WhatsApp):</Label>
                  <Button size="sm" variant="ghost" onClick={handleEditContactFromConfirm}>
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
                <CellPhoneBrInput
                  value={editablePhone || customer?.phone}
                  onValueChange={(value) => setEditablePhone(value)}
                  placeholder="(00) 00000-0000"
                  className="bg-zinc-900 border-zinc-700 text-white w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm">Resumo da mensagem:</Label>
              <div className="p-3 bg-zinc-900 rounded text-sm text-zinc-300 max-h-32 overflow-y-auto">
                {selectedMethods.email && <div className="font-medium mb-2">{subject}</div>}
                <div className="whitespace-pre-wrap">{message}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ExternalLink className="h-3 w-3" />
              {selectedMethods.email && selectedMethods.whatsapp 
                ? "Serão abertos o cliente de e-mail e o WhatsApp Web"
                : selectedMethods.email 
                ? "Será aberto o cliente de e-mail padrão do seu sistema"
                : "Será aberto o WhatsApp Web no seu navegador"
              }
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Enviar {selectedMethods.email && selectedMethods.whatsapp ? "Ambos" : selectedMethods.email ? "E-mail" : "WhatsApp"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Detalhada da Mensagem */}
      <Dialog open={!!viewingMessage} onOpenChange={(open) => !open && setViewingMessage(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingMessage?.type === "email" ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
              Detalhes da Mensagem Enviada
            </DialogTitle>
            <DialogDescription>
              {viewingMessage?.date} - {viewingMessage?.type === "email" ? "E-mail" : "WhatsApp"}
            </DialogDescription>
          </DialogHeader>
          
          {viewingMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Destinatário</Label>
                  <div className="text-zinc-100">{viewingMessage.recipient}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={viewingMessage.status === "sent" ? "default" : viewingMessage.status === "failed" ? "destructive" : "secondary"}>
                      {viewingMessage.status === "sent" ? "Enviado com sucesso" : viewingMessage.status === "failed" ? "Falha no envio" : "Aguardando envio"}
                    </Badge>
                    {viewingMessage.status === "sent" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>

              {viewingMessage.type === "email" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assunto</Label>
                  <div className="p-3 bg-zinc-800 rounded text-zinc-100">
                    {subject || "Assunto indisponível"}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Mensagem Completa</Label>
                <div className="p-4 bg-zinc-800 rounded text-zinc-100 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {viewingMessage.message.replace(/\\n/g, '\n')}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingMessage(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
