import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

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
}

export default function NotificationsIndex({ notifications }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Notifications', href: '/notifications' },
    ];

    const handleMarkAsRead = async (id: number) => {
        await fetch(`/notifications/${id}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        router.reload();
    };

    const handleMarkAllAsRead = async () => {
        await fetch('/notifications/mark-all-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        router.reload();
    };

    const handleDelete = async (id: number) => {
        await fetch(`/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        router.reload();
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

            <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto">
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(notification.id)}
                                            className="text-destructive hover:text-destructive"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
