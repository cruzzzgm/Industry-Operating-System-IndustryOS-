import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { fetchNotifications, fetchUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from "@/services/api";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Buscar notificações do backend
  useEffect(() => {
    loadNotifications();
  }, []);

  // Recarregar notificações quando o popover abrir
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications({ limit: 50 });
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (n: Notification) => {
    // Marcar notificação como lida no backend
    if (!n.is_read) {
      try {
        await markNotificationAsRead(n.id);
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === n.id 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
      }
    }
    
    setOpen(false);
    
    // Navegar para a URL da ação se existir
    if (n.action_url) {
      navigate(n.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      setUnreadCount(prev => 
        notifications.find(n => n.id === notificationId)?.is_read ? prev : Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "URGENTE";
      case "high": return "ALTA";
      case "medium": return "MÉDIA";
      case "low": return "BAIXA";
      default: return "INFO";
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-destructive border-destructive/30 bg-destructive/10";
      case "high": return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      case "medium": return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
      case "low": return "text-blue-500 border-blue-500/30 bg-blue-500/10";
      default: return "text-gray-500 border-gray-500/30 bg-gray-500/10";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-zinc-900/60 backdrop-blur-lg border-zinc-700/50 shadow-2xl ring-1 ring-zinc-600/30" align="end">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Centro de Notificações</p>
            <p className="text-xs text-muted-foreground">{notifications.length} alertas ativos</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Carregando...</p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação pendente.</p>
          ) : (
            notifications.map((n, i) => (
              <div 
                key={n.id} 
                className={`p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : ''}`} 
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(n.priority)} ${n.is_read ? 'opacity-50' : ''}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${n.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                      <Badge variant="outline" className={getPriorityBadgeStyle(n.priority)}>
                        {getPriorityLabel(n.priority)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    {n.action_text && (
                      <p className="text-xs text-blue-400">{n.action_text}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleDelete(e, n.id)}
                  >
                    <span className="sr-only">Deletar</span>
                    <span className="text-xs">×</span>
                  </Button>
                </div>
                {i < notifications.length - 1 && <Separator className="mt-3" />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
