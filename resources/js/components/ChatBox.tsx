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
        <Card className="flex flex-col border-none shadow-none bg-transparent h-full min-h-[450px]">
            <CardHeader className="p-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/70">Live Support Chat</CardTitle>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-1.5">
                        <span className="opacity-50">Creator:</span>
                        <span className="text-foreground/80">{ticketOwnerName}</span>
                    </div>
                    {respondentName && (
                        <div className="flex items-center gap-1.5 border-l pl-3 ml-1">
                            <span className="opacity-50">Support:</span>
                            <span className="text-primary">{respondentName}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6 scrollbar-thin scrollbar-thumb-muted">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 py-20">
                        <p className="text-xs font-black uppercase tracking-widest">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user.id === auth.user.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`relative px-4 py-3 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-card border border-primary/5 rounded-tl-none'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-4 mb-1 border-b border-current/10 pb-1">
                                        <p className="text-[9px] uppercase font-black tracking-[0.1em] opacity-80">
                                            {msg.user.id === ticketOwnerId ? 'Originator' : 'Technical Support'}
                                        </p>
                                        <span className="text-[9px] opacity-60 font-medium">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-black mb-1.5 opacity-90 uppercase tracking-tight">{msg.user.name}</p>
                                    <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </CardContent>
            {status !== 'Resolved' && (
                <CardFooter className="p-3 md:p-4 bg-card/30 backdrop-blur-md rounded-b-xl border-t mt-auto">
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2 items-center">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type real-time message..."
                            className="flex-1 bg-background h-11 md:h-10 text-sm font-medium border-primary/10 focus-visible:ring-primary/20"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    // Submit automatically
                                }
                            }}
                        />
                        <Button type="submit" size="icon" className="h-11 w-11 md:h-10 md:w-10 shadow-lg shadow-primary/20 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.854 8.325a.5.5 0 0 1 0 .3l-2.854 8.325a.498.498 0 0 0 .683.627l18-9a.5.5 0 0 0 0-.894Z" /><path d="M6.5 12h13.5" /></svg>
                        </Button>
                    </form>
                </CardFooter>
            )}
        </Card>
    );
}
