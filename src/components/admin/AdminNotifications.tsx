import { useState, useEffect } from 'react';
import { Bell, Check, ShoppingCart, X, Building2, Package, Paintbrush, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
}

const notificationConfig: Record<string, { icon: typeof Bell; gradient: string; iconColor: string }> = {
  order: { 
    icon: ShoppingCart, 
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-600'
  },
  corporate: { 
    icon: Building2, 
    gradient: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-600'
  },
  custom_order: { 
    icon: Paintbrush, 
    gradient: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-600'
  },
  workshop: { 
    icon: Calendar, 
    gradient: 'from-orange-500/20 to-orange-600/10',
    iconColor: 'text-orange-600'
  },
  default: { 
    icon: Bell, 
    gradient: 'from-primary/20 to-primary/10',
    iconColor: 'text-primary'
  },
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          console.log('New notification:', payload);
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const getNotificationConfig = (type: string) => {
    return notificationConfig[type] || notificationConfig.default;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <motion.div
            whileHover={{ rotate: [0, -15, 15, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs flex items-center justify-center font-semibold shadow-lg shadow-red-500/30"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[420px] p-0 overflow-hidden rounded-2xl shadow-2xl border-border/30 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border/30 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Bell className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-muted-foreground mt-0.5"
                  >
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </motion.p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Mark all read
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[450px]">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <motion.div 
                className="p-5 bg-gradient-to-br from-muted/80 to-muted/30 rounded-2xl mb-5 shadow-inner"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Bell className="h-10 w-10 text-muted-foreground/40" />
              </motion.div>
              <p className="text-muted-foreground font-medium">No notifications yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1.5">You'll see updates here when they arrive</p>
            </motion.div>
          ) : (
            <div className="py-2">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, index) => {
                  const config = getNotificationConfig(notification.type);
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ 
                        opacity: 0, 
                        x: 100, 
                        scale: 0.8,
                        transition: { duration: 0.3, ease: "easeInOut" }
                      }}
                      transition={{ 
                        delay: index * 0.02,
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }}
                      className={`group relative mx-3 my-1.5 px-4 py-4 rounded-xl transition-all duration-300 ${
                        !notification.is_read 
                          ? 'bg-gradient-to-r from-primary/8 via-primary/4 to-transparent shadow-sm border border-primary/10' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Unread glow effect */}
                      {!notification.is_read && (
                        <motion.div 
                          className="absolute inset-0 rounded-xl bg-primary/5"
                          animate={{ opacity: [0.5, 0.2, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <div className="relative flex gap-4">
                        {/* Icon with animation */}
                        <motion.div 
                          className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${config.gradient} shadow-sm`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Icon className={`h-5 w-5 ${config.iconColor}`} />
                        </motion.div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <motion.span 
                                  className="w-2 h-2 rounded-full bg-primary"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              )}
                            </div>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground/60 font-medium">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {!notification.is_read && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs h-7 px-3 rounded-lg text-primary hover:text-primary hover:bg-primary/10 font-medium"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark read
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-3 border-t border-border/30 bg-gradient-to-r from-muted/30 to-transparent"
          >
            <p className="text-xs text-muted-foreground/60 text-center">
              Showing {notifications.length} notification{notifications.length > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </PopoverContent>
    </Popover>
  );
}