import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Player {
  id: number;
  position: number;
  player_name: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  level: number;
  rank: string;
  achievements: string[];
  winrate: number;
  kd_ratio: number;
  total_games: number;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rankFilter, setRankFilter] = useState('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      const mockPlayers: Player[] = data.players || [];
      
      if (mockPlayers.length === 0) {
        const samplePlayers = generateSamplePlayers();
        setPlayers(samplePlayers);
      } else {
        setPlayers(mockPlayers);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      const samplePlayers = generateSamplePlayers();
      setPlayers(samplePlayers);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSamplePlayers = (): Player[] => {
    const ranks = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
    const avatars = ['🎮', '⚔️', '🔮', '🏆', '👥', '🔥', '🛡️', '🐛', '⚡', '🎯', '🦉', '⛈️', '❄️', '🐉', '🗡️', '👻', '💎', '🌟', '🗿'];
    const achievements = [
      ['Легенда арены', 'Мастер оружия', 'Непобедимый'],
      ['Снайпер', 'Охотник', 'Меткий стрелок'],
      ['Повелитель магии', 'Чародей'],
      ['Про игрок', 'Чемпион'],
      ['Лидер команды', 'Стратег']
    ];

    const basePlayers = [
      { name: 'DarkKnight', rating: 2450, wins: 245, losses: 89 },
      { name: 'ShadowHunter', rating: 2380, wins: 223, losses: 95 },
      { name: 'MysticMage', rating: 2290, wins: 210, losses: 102 },
      { name: 'ProGamer', rating: 2150, wins: 198, losses: 110 },
      { name: 'TeamLeader', rating: 2080, wins: 185, losses: 115 },
      { name: 'HeroLover', rating: 1950, wins: 172, losses: 128 },
      { name: 'TankMain', rating: 1880, wins: 165, losses: 135 },
      { name: 'BugHunter', rating: 1820, wins: 158, losses: 142 },
      { name: 'SpeedRunner', rating: 1750, wins: 145, losses: 155 },
      { name: 'SniperElite', rating: 1690, wins: 138, losses: 162 },
      { name: 'NightOwl', rating: 1620, wins: 125, losses: 175 },
      { name: 'StormBringer', rating: 1580, wins: 118, losses: 182 },
      { name: 'IceQueen', rating: 1520, wins: 112, losses: 188 },
      { name: 'FireDragon', rating: 1460, wins: 105, losses: 195 },
      { name: 'SilentAssassin', rating: 1400, wins: 98, losses: 202 },
      { name: 'GhostRider', rating: 1350, wins: 92, losses: 208 },
      { name: 'ThunderStrike', rating: 1290, wins: 85, losses: 215 },
      { name: 'CrystalGuard', rating: 1230, wins: 78, losses: 222 },
      { name: 'SkyWalker', rating: 1180, wins: 72, losses: 228 },
      { name: 'RockSolid', rating: 1120, wins: 65, losses: 235 }
    ];

    return basePlayers.map((player, index) => {
      const totalGames = player.wins + player.losses;
      const kills = player.wins * 13 + Math.floor(Math.random() * 50);
      const deaths = player.losses * 10 + Math.floor(Math.random() * 50);
      const rankIndex = Math.floor(index / 4);
      
      return {
        id: index + 1,
        position: index + 1,
        player_name: player.name,
        avatar: avatars[index % avatars.length],
        rating: player.rating,
        wins: player.wins,
        losses: player.losses,
        kills,
        deaths,
        level: 50 - Math.floor(index * 1.5),
        rank: ranks[Math.min(rankIndex, 4)],
        achievements: achievements[Math.min(rankIndex, 4)] || ['Новичок'],
        winrate: parseFloat(((player.wins / totalGames) * 100).toFixed(1)),
        kd_ratio: parseFloat((kills / deaths).toFixed(2)),
        total_games: totalGames
      };
    });
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Diamond': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
      case 'Platinum': return 'text-slate-300 bg-slate-300/10 border-slate-300/30';
      case 'Gold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'Silver': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'Bronze': return 'text-orange-600 bg-orange-600/10 border-orange-600/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const filteredPlayers = rankFilter === 'all' 
    ? players 
    : players.filter(p => p.rank === rankFilter);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Okyes</h1>
              </div>
            </div>

            {user && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <img src={user.avatarUrl} alt={user.personaName} className="w-8 h-8 rounded-full" />
                <span className="font-medium">{user.personaName}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="space-y-10">
          <div className="space-y-3">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
              <span className="text-sm font-medium text-primary">Топ игроков</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Рейтинг
            </h2>
            <p className="text-muted-foreground text-xl">Лучшие игроки сервера по рейтингу</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {['all', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(rank => (
              <Button
                key={rank}
                variant={rankFilter === rank ? 'default' : 'outline'}
                onClick={() => setRankFilter(rank)}
                className="gap-2"
              >
                {rank === 'all' ? 'Все ранги' : rank}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              Загрузка рейтинга...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlayers.map((player, index) => (
                <Card 
                  key={player.id}
                  className={`p-6 border transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur ${
                    index < 3 ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-3xl font-bold w-16 text-center">
                      {getPositionBadge(player.position)}
                    </div>

                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl flex-shrink-0">
                      {player.avatar}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold">{player.player_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRankColor(player.rank)}`}>
                          {player.rank}
                        </span>
                        <span className="text-sm text-muted-foreground">Ур. {player.level}</span>
                      </div>

                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Рейтинг</div>
                          <div className="text-lg font-bold text-primary">{player.rating}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Побед</div>
                          <div className="text-lg font-bold text-green-500">{player.wins}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Поражений</div>
                          <div className="text-lg font-bold text-red-500">{player.losses}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Винрейт</div>
                          <div className="text-lg font-bold">{player.winrate}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">K/D</div>
                          <div className="text-lg font-bold">{player.kd_ratio}</div>
                        </div>
                      </div>

                      {player.achievements.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {player.achievements.slice(0, 3).map((achievement, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground border border-border"
                            >
                              {achievement}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
