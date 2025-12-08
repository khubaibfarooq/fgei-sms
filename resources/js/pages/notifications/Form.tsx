import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Bell } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

interface NotificationFormProps {
    notification?: {
        id: number;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        link: string | null;
    };
}

export default function NotificationForm({ notification }: NotificationFormProps) {
    const isEdit = !!notification;

    const { data, setData, processing, errors, reset } = useForm<{
        title: string;
        message: string;
        type: string;
        link: string;
    }>({
        title: notification?.title || '',
        message: notification?.message || '',
        type: notification?.type || 'info',
        link: notification?.link || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            router.put(`/notifications/${notification.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    router.get('/notifications');
                },
            });
        } else {
            router.post('/notifications', data, {
                onSuccess: () => {
                    reset();
                    router.get('/notifications');
                },
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Notifications', href: '/notifications' },
        { title: isEdit ? 'Edit Notification' : 'Create Notification', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Notification' : 'Create Notification'} />

            <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6" />
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    {isEdit ? 'Edit Notification' : 'Create Notification'}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {isEdit ? 'Edit notification details' : 'Create a new notification for all users'}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Enter notification title"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message *</Label>
                                    <Textarea
                                        id="message"
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Enter notification message"
                                        rows={4}
                                        required
                                    />
                                    {errors.message && (
                                        <p className="text-sm text-red-600">{errors.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select notification type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="error">Error</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-600">{errors.type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link">Link (Optional)</Label>
                                    <Input
                                        id="link"
                                        value={data.link}
                                        onChange={(e) => setData('link', e.target.value)}
                                        placeholder="/path/to/page or https://..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Optional URL to navigate when notification is clicked
                                    </p>
                                    {errors.link && (
                                        <p className="text-sm text-red-600">{errors.link}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <Link href="/notifications">
                                    <Button type="button" variant="secondary">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? isEdit
                                            ? 'Saving...'
                                            : 'Creating...'
                                        : isEdit
                                            ? 'Save Changes'
                                            : 'Create Notification'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
