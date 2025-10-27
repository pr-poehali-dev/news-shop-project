import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Tournament {
  id: number;
  name: string;
  description: string;
  prize_pool: number;
  max_participants: number;
  status: string;
  tournament_type: string;
  start_date: string;
  participants_count: number;
  is_registered?: boolean;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface TournamentsTabProps {
  tournaments: Tournament[];
  user: SteamUser | null;
  isRegistering: number | null;
  onRegister: (tournamentId: number) => void;
}

const TournamentsTab = ({ tournaments, user, isRegistering, onRegister }: TournamentsTabProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Скоро';
      case 'ongoing':
        return 'Идёт';
      case 'completed':
        return 'Завершён';
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '1v1':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case '5v5':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'battle_royale':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const mockPlayers = [
    { rank: 1, name: 'ProPlayer2024', mmr: 7850, wins: 342, losses: 158 },
    { rank: 2, name: 'CyberKnight', mmr: 7640, wins: 298, losses: 142 },
    { rank: 3, name: 'ShadowMaster', mmr: 7520, wins: 276, losses: 134 },
    { rank: 4, name: 'NeonGamer', mmr: 7400, wins: 254, losses: 126 },
    { rank: 5, name: 'PixelWarrior', mmr: 7280, wins: 232, losses: 118 },
    { rank: 6, name: 'TechSamurai', mmr: 7150, wins: 210, losses: 110 },
    { rank: 7, name: 'VoidHunter', mmr: 7020, wins: 188, losses: 102 },
    { rank: 8, name: 'StormRider', mmr: 6890, wins: 166, losses: 94 },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
          <span className="text-sm font-medium text-primary">Соревнования</span>
        </div>
        <p className="text-muted-foreground text-xl">Участвуйте в турнирах и выигрывайте призы</p>
      </div>

      <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        {tournaments.map((tournament, index) => (
          <Card 
            key={tournament.id}
            className="group p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => navigate(`/tournament/${tournament.id}`)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                      {tournament.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                      {getStatusText(tournament.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(tournament.tournament_type)}`}>
                      {tournament.tournament_type}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{tournament.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Icon name="Trophy" size={20} />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="DollarSign" size={14} />
                  <span><strong className="text-foreground">{tournament.prize_pool.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} ₽</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="Users" size={14} />
                  <span><strong className="text-foreground">{tournament.participants_count}/{tournament.max_participants}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  <span>{tournament.start_date}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                {tournament.is_registered ? (
                  <Button disabled className="gap-2 text-xs h-9" variant="secondary">
                    <Icon name="CheckCircle2" size={16} />
                    Вы зарегистрированы
                  </Button>
                ) : (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegister(tournament.id);
                    }}
                    disabled={isRegistering === tournament.id || tournament.status !== 'upcoming'}
                    className="gap-2 text-xs h-9"
                  >
                    <Icon name="UserPlus" size={16} />
                    {isRegistering === tournament.id ? 'Регистрация...' : 'Зарегистрироваться'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tournament/${tournament.id}`);
                  }}
                  className="gap-2 text-xs h-9"
                >
                  <Icon name="Info" size={16} />
                  Подробнее
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="w-96 p-6 border border-border bg-card/50 backdrop-blur h-fit sticky top-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Users" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Топ игроков</h3>
              <p className="text-xs text-muted-foreground">Рейтинговая таблица</p>
            </div>
          </div>

          <div className="space-y-2">
            {mockPlayers.map((player) => (
              <div
                key={player.rank}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                  player.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                  player.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-muted/20 text-muted-foreground'
                }`}>
                  {player.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {player.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{player.mmr} MMR</span>
                    <span>•</span>
                    <span>{player.wins}W / {player.losses}L</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full gap-2 text-xs">
            <Icon name="Trophy" size={14} />
            Посмотреть полную таблицу
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default TournamentsTab;