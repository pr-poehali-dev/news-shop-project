import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface UserStatsProps {
  totalUsers: number;
  totalBalance: number;
  moderatorsCount: number;
  blockedCount: number;
}

export default function UserStats({ 
  totalUsers, 
  totalBalance, 
  moderatorsCount, 
  blockedCount 
}: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon name="Users" size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Всего пользователей</p>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Icon name="Wallet" size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Общий баланс</p>
            <p className="text-2xl font-bold">{totalBalance} ₽</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Icon name="Shield" size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Модераторов</p>
            <p className="text-2xl font-bold">{moderatorsCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon name="Ban" size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Заблокировано</p>
            <p className="text-2xl font-bold">{blockedCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
