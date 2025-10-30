import { useState } from 'react';
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
  game: string;
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
  const [selectedGame, setSelectedGame] = useState<string>('Все');

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

  const allGames = ['Все', ...Array.from(new Set(tournaments.map(t => t.game || 'CS2')))];
  const filteredTournaments = selectedGame === 'Все' 
    ? tournaments 
    : tournaments.filter(t => (t.game || 'CS2') === selectedGame);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
          <span className="text-sm font-medium text-primary">Соревнования</span>
        </div>
        <p className="text-muted-foreground text-xl">Участвуйте в турнирах и выигрывайте призы</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {allGames.map((game) => (
          <Button
            key={game}
            variant={selectedGame === game ? "default" : "outline"}
            onClick={() => setSelectedGame(game)}
            className="gap-2"
          >
            <Icon name={game === 'Все' ? 'Grid3x3' : 'Gamepad2'} size={16} />
            {game}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament, index) => (
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
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                        {tournament.game || 'CS2'}
                      </span>
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
          ))
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur">
            <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Турниров не найдено</h3>
            <p className="text-muted-foreground">Попробуйте выбрать другую игру</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TournamentsTab;