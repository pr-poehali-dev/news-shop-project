import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface ChatMessage {
  id: number;
  steamId: string;
  personaName: string;
  avatarUrl?: string;
  message: string;
  createdAt: string;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface GlobalChatProps {
  user: SteamUser | null;
  onLoginClick: () => void;
}

export default function GlobalChat({ user, onLoginClick }: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      checkAdmin();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${func2url.chat}?limit=50`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      onLoginClick();
      return;
    }

    if (!newMessage.trim() || newMessage.length > 500) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(func2url.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steam_id: user.steamId,
          persona_name: user.personaName,
          avatar_url: user.avatarUrl,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const checkAdmin = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${func2url['check-admin']}?steam_id=${user.steamId}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!user || !isAdmin) return;

    try {
      const response = await fetch(`${func2url.chat}?message_id=${messageId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Steam-Id': user.steamId
        }
      });

      if (response.ok) {
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full h-[calc(100vh-120px)] flex flex-col bg-card/95 backdrop-blur sticky top-6">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Icon name="MessageCircle" size={20} className="text-primary" />
        <h3 className="font-semibold">Общий чат</h3>
        <span className="text-xs text-muted-foreground">
          ({messages.length})
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Icon name="MessageSquare" size={48} className="mb-2 opacity-50" />
            <p className="text-sm">Сообщений пока нет</p>
            <p className="text-xs">Будьте первым!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 group">
              <img
                src={msg.avatarUrl || 'https://via.placeholder.com/32'}
                alt={msg.personaName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm truncate">
                    {msg.personaName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        {!user ? (
          <Button
            type="button"
            onClick={onLoginClick}
            className="w-full"
            variant="outline"
          >
            <Icon name="User" size={16} className="mr-2" />
            Войти для отправки
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              maxLength={500}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              size="icon"
            >
              {isSending ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Send" size={18} />
              )}
            </Button>
          </div>
        )}
        {user && (
          <p className="text-xs text-muted-foreground mt-2">
            {newMessage.length}/500
          </p>
        )}
      </form>
    </Card>
  );
}