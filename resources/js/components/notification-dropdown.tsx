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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import axios from 'axios';
import 'react-quill-new/dist/quill.snow.css';

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

    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from closing immediately
        try {
            if (!notification.is_read) {
                await axios.post(`/notifications/${notification.id}/read`);
                // Refresh notifications
                fetchNotifications();
            }

            setSelectedNotification(notification);
            // We don't close the dropdown here, or maybe we should? 
            // If we open a modal, the dropdown usually closes or stays under. 
            // Let's close the dropdown to focus on the modal.
            setOpen(false);

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

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        // Replace block tags with spaces to prevent text merging
        const spacedHtml = html.replace(/<\/(p|div|li|h[1-6]|tr)>/g, ' </$1>');
        tmp.innerHTML = spacedHtml;
        return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    };

    return (
        <>
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
                                    onClick={(e) => handleMarkAsRead(notification, e)}
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <span className="font-medium text-sm">{notification.title}</span>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {stripHtml(notification.message)}
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

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{selectedNotification?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedNotification && new Date(selectedNotification.created_at).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNotification && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className={cn("px-2 py-1 rounded-md border",
                                    selectedNotification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                                        selectedNotification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                            selectedNotification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                                'bg-blue-50 border-blue-200 text-blue-700'
                                )}>
                                    Type: {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                                </span>

                                {selectedNotification.link && (
                                    <a
                                        href={selectedNotification.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 rounded-md border bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        View Link
                                    </a>
                                )}
                            </div>

                            <div className="ql-snow mt-4">
                                <div className="ql-editor p-0" dangerouslySetInnerHTML={{ __html: selectedNotification.message }} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
