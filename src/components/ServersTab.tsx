import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import func2url from '../../backend/func2url.json';

interface Server {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  map: string;
  currentPlayers: number;
  maxPlayers: number;
  status: 'online' | 'offline' | 'maintenance';
}

const ServersTab = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadServers = async () => {
    try {
      const response = await fetch(func2url.servers);
      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateServersStatus = async () => {
    try {
      const response = await fetch(func2url['server-status'], {
        method: 'POST'
      });
      const data = await response.json();
      if (data.servers) {
        setServers(prevServers => {
          return prevServers.map(server => {
            const updatedServer = data.servers.find((s: any) => s.id === server.id);
            return updatedServer ? { ...server, ...updatedServer } : server;
          });
        });
      }
    } catch (error) {
      console.error('Failed to update server status:', error);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    updateServersStatus();
    const interval = setInterval(updateServersStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
          <span className="text-sm font-medium text-primary">Игровые сервера</span>
        </div>
        <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Наши сервера
        </h2>
        <p className="text-muted-foreground text-xl">Выберите сервер и присоединяйтесь к игре</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Loader2" size={48} className="mx-auto mb-3 animate-spin" />
          <p className="text-lg">Загрузка серверов...</p>
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Server" size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-lg">Серверы не найдены</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {servers.map((server, index) => (
          <Card 
            key={server.id}
            className="group p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 bg-card/50 backdrop-blur"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Icon name="Server" size={28} />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold tracking-tight">{server.name}</h3>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                      server.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      server.status === 'offline' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        server.status === 'online' ? 'bg-green-500 animate-pulse' :
                        server.status === 'offline' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      {server.status === 'online' ? 'Онлайн' : server.status === 'offline' ? 'Оффлайн' : 'Тех. работы'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name="Map" size={16} />
                      <span>{server.map || 'Загрузка...'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Users" size={16} />
                      <span>{server.currentPlayers}/{server.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Globe" size={16} />
                      <span>{server.ipAddress}:{server.port}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => copyToClipboard(`${server.ipAddress}:${server.port}`)}
                  className="gap-2"
                >
                  <Icon name="Copy" size={18} />
                  IP
                </Button>
                <Button 
                  size="lg" 
                  className="gap-2 shadow-lg shadow-primary/20"
                  onClick={() => window.location.href = `steam://connect/${server.ipAddress}:${server.port}`}
                >
                  <Icon name="Play" size={18} />
                  Подключиться
                </Button>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServersTab;