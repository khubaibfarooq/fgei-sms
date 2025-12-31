import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// @ts-ignore
window.Pusher = Pusher;

interface Message {
    id: number;
    message: string;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface ChatBoxProps {
    helpDeskId: number;
    status: string;
}

export default function ChatBox({ helpDeskId, status }: ChatBoxProps) {
    const { auth } = usePage().props as any;
    const [messages, setMessages] = useState<Message[]>([]);
    const [ticketOwnerId, setTicketOwnerId] = useState<number | null>(null);
    const [ticketOwnerName, setTicketOwnerName] = useState<string>('');
    const [respondentId, setRespondentId] = useState<number | null>(null);
    const [respondentName, setRespondentName] = useState<string>('');
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const echoRef = useRef<any>(null);

    useEffect(() => {
        // Fetch existing messages
        axios.get(`/helpdesk/${helpDeskId}/messages`).then((response) => {
            setMessages(response.data.messages);
            setTicketOwnerId(response.data.ticket_owner_id);
            setTicketOwnerName(response.data.ticket_owner_name);
            setRespondentId(response.data.respondent_id);
            setRespondentName(response.data.respondent_name);
        });

        // Setup Echo
        const echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        echo.private(`helpdesk.${helpDeskId}`)
            .listen('MessageSent', (e: { message: Message }) => {
                setMessages((prev) => [...prev, e.message]);
            });

        echoRef.current = echo;

        return () => {
            if (echoRef.current) {
                echoRef.current.leave(`helpdesk.${helpDeskId}`);
            }
        };
    }, [helpDeskId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        setNewMessage('');

        try {
            const response = await axios.post(`/helpdesk/${helpDeskId}/messages`, {
                message: content,
            });
            setMessages((prev) => [...prev, response.data]);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    return (
        <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversation</CardTitle>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                        <span className="font-bold">Creator:</span> {ticketOwnerName}
                    </div>
                    {respondentName && (
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Support:</span> {respondentName}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.user.id === auth.user.id ? 'items-end' : 'items-start'
                            }`}
                    >
                        <div
                            className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.user.id === auth.user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                                }`}
                        >
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5">
                                {msg.user.id === ticketOwnerId ? 'Creator' : 'Support'}
                            </p>
                            <p className="text-sm font-semibold mb-1">{msg.user.name}</p>
                            <p className="text-sm">{msg.message}</p>
                            <span className="text-[10px] opacity-70 block mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </CardContent>
            {status !== 'Resolved' && (
                <CardFooter className="p-4 pt-0">
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1"
                        />
                        <Button type="submit">Send</Button>
                    </form>
                </CardFooter>
            )}
        </Card>
    );
}
