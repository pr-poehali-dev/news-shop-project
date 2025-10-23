import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const ServersTab = () => {
  const servers = [
    {
      id: 1,
      name: 'РУ Европа #1',
      map: 'de_dust2',
      players: '24/32',
      ping: 15,
      status: 'online' as const
    },
    {
      id: 2,
      name: 'РУ Европа #2',
      map: 'de_mirage',
      players: '18/32',
      ping: 18,
      status: 'online' as const
    },
    {
      id: 3,
      name: 'РУ Москва #1',
      map: 'de_inferno',
      players: '30/32',
      ping: 12,
      status: 'online' as const
    },
    {
      id: 4,
      name: 'РУ Санкт-Петербург',
      map: 'de_nuke',
      players: '16/32',
      ping: 20,
      status: 'online' as const
    }
  ];

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
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Онлайн
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name="Map" size={16} />
                      <span>{server.map}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Users" size={16} />
                      <span>{server.players}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Wifi" size={16} />
                      <span>{server.ping}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => copyToClipboard(`connect ${server.name.toLowerCase().replace(/\s+/g, '')}.okyes.com`)}
                  className="gap-2"
                >
                  <Icon name="Copy" size={18} />
                  IP
                </Button>
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Icon name="Play" size={18} />
                  Подключиться
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServersTab;
