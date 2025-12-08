import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Trash2, Plus, Edit } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

interface Props {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    permissions: {
        can_add: boolean;
        can_edit: boolean;
        can_delete: boolean;
    };
}

export default function NotificationsIndex({ notifications, permissions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Notifications', href: '/notifications' },
    ];

    const handleMarkAsRead = async (id: number) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            router.reload();
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            router.reload();
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/notifications/${id}`, {
            onSuccess: () => toast.success('Notification deleted successfully'),
            onError: () => toast.error('Failed to delete notification'),
        });
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
            case 'warning':
                return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
            case 'error':
                return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
            default:
                return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex-1 p-4 md:p-6 w-full mx-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6" />
                            <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleMarkAllAsRead}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark all as read
                            </Button>
                            {permissions.can_add && (
                                <Link href="/notifications/create">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Notification
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {notifications.data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.data.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 rounded-lg border-l-4 flex items-start justify-between gap-4',
                                        getTypeStyles(notification.type),
                                        !notification.is_read && 'ring-1 ring-primary/20'
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{notification.title}</h3>
                                            {!notification.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDate(notification.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {permissions.can_edit && (
                                            <Link href={`/notifications/${notification.id}/edit`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        {permissions.can_delete && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete this notification?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Notification <strong>{notification.title}</strong> will be permanently deleted for all users.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => handleDelete(notification.id)}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Pagination */}
                        {notifications.last_page > 1 && (
                            <div className="flex justify-center gap-2 pt-4">
                                {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link
                                        key={page}
                                        href={`/notifications?page=${page}`}
                                        className={cn(
                                            'px-3 py-1 rounded',
                                            page === notifications.current_page
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                        )}
                                    >
                                        {page}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
