import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationData {
    notifications: Notification[];
    unread_count: number;
}

export function NotificationDropdown() {
    const [data, setData] = useState<NotificationData>({
        notifications: [],
        unread_count: 0,
    });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/notifications/unread');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const handleMarkAsRead = async (notification: Notification) => {
        try {
            await axios.post(`/notifications/${notification.id}/read`);

            // Refresh notifications
            fetchNotifications();

            // Navigate if there's a link
            if (notification.link) {
                router.visit(notification.link);
                setOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await axios.post('/notifications/mark-all-read');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-l-green-500';
            case 'warning':
                return 'border-l-yellow-500';
            case 'error':
                return 'border-l-red-500';
            default:
                return 'border-l-blue-500';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 group cursor-pointer text-white hover:text-black dark:border-white dark:hover:text-white ">
                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                    {data.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {data.unread_count > 99 ? '99+' : data.unread_count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    {data.unread_count > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                            className="h-7 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {data.notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground ">
                        <Bell className="  h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <>
                        {data.notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    'flex flex-col items-start gap-1 p-3 cursor-pointer border-l-4',
                                    getTypeStyles(notification.type),
                                    !notification.is_read && 'bg-muted/50'
                                )}
                                onClick={() => handleMarkAsRead(notification)}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <span className="font-medium text-sm">{notification.title}</span>
                                    {!notification.is_read && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground">
                                    {formatTime(notification.created_at)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />

                    </>
                )}   <DropdownMenuItem
                    className="justify-center text-sm text-primary cursor-pointer"
                    onClick={() => {
                        router.visit('/notifications');
                        setOpen(false);
                    }}
                >
                    View all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
