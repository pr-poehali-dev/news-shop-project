import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import func2url from '../../../backend/func2url.json';

interface User {
  id: number;
  steamId: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  balance: number;
  isBlocked: boolean;
  blockReason: string | null;
  lastLogin: string | null;
  createdAt: string | null;
}

interface AdminUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface UsersManagementProps {
  users: User[];
  isLoadingUsers: boolean;
  adminUser: AdminUser | null;
  onReload: () => Promise<void>;
}

export default function UsersManagement({ 
  users, 
  isLoadingUsers, 
  adminUser, 
  onReload 
}: UsersManagementProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<number>(0);
  const [blockReason, setBlockReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleUpdateBalance = async (user: User, newBalance: number) => {
    if (!adminUser) return;

    try {
      const response = await fetch(func2url.users, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': adminUser.steamId
        },
        body: JSON.stringify({
          steamId: user.steamId,
          balance: newBalance
        })
      });

      if (response.ok) {
        await onReload();
        setEditingUserId(null);
        setBalanceAmount(0);
      }
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const handleBlockUser = async (user: User, reason: string) => {
    if (!adminUser) return;
    if (!reason.trim()) {
      alert('Укажите причину блокировки');
      return;
    }

    try {
      const response = await fetch(func2url.users, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': adminUser.steamId
        },
        body: JSON.stringify({
          steamId: user.steamId,
          isBlocked: true,
          blockReason: reason
        })
      });

      if (response.ok) {
        await onReload();
        setEditingUserId(null);
        setBlockReason('');
      }
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleUnblockUser = async (user: User) => {
    if (!adminUser) return;

    try {
      const response = await fetch(func2url.users, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': adminUser.steamId
        },
        body: JSON.stringify({
          steamId: user.steamId,
          isBlocked: false
        })
      });

      if (response.ok) {
        await onReload();
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  const startEditBalance = (user: User) => {
    setEditingUserId(user.steamId);
    setBalanceAmount(user.balance);
    setBlockReason('');
  };

  const startBlock = (user: User) => {
    setEditingUserId(user.steamId);
    setBlockReason(user.blockReason || '');
    setBalanceAmount(0);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setBalanceAmount(0);
    setBlockReason('');
  };

  const filteredUsers = users.filter(user => 
    user.personaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.steamId.includes(searchQuery)
  );

  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
  const blockedCount = users.filter(user => user.isBlocked).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon name="Users" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего пользователей</p>
              <p className="text-2xl font-bold">{users.length}</p>
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

      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Users" size={24} />
            Управление пользователями
          </h2>
          <div className="w-64">
            <Input
              placeholder="Поиск по имени или Steam ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Loader2" size={48} className="mx-auto mb-3 animate-spin" />
            <p className="text-lg">Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Users" size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg">
              {searchQuery ? 'Пользователи не найдены' : 'Нет зарегистрированных пользователей'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg border bg-background/50 transition-colors ${
                  user.isBlocked 
                    ? 'border-red-500/30 bg-red-500/5' 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.personaName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={24} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{user.personaName}</h3>
                        {user.isBlocked && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">
                            Заблокирован
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Icon name="Hash" size={14} />
                          <span className="font-mono text-xs">{user.steamId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Icon name="Wallet" size={14} />
                            <span className="font-semibold text-green-500">{user.balance} ₽</span>
                          </div>
                          {user.lastLogin && (
                            <div className="flex items-center gap-1">
                              <Icon name="Clock" size={14} />
                              <span className="text-xs">
                                {new Date(user.lastLogin).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {user.isBlocked && user.blockReason && (
                          <div className="flex items-start gap-1 mt-2 p-2 bg-red-500/10 rounded">
                            <Icon name="AlertCircle" size={14} className="text-red-500 mt-0.5" />
                            <span className="text-xs text-red-500">{user.blockReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {editingUserId === user.steamId ? (
                      <>
                        {balanceAmount !== 0 && (
                          <>
                            <Input
                              type="number"
                              value={balanceAmount}
                              onChange={(e) => setBalanceAmount(Number(e.target.value))}
                              placeholder="Новый баланс"
                              className="h-8 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateBalance(user, balanceAmount)}
                                className="flex-1"
                              >
                                <Icon name="Check" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                className="flex-1"
                              >
                                <Icon name="X" size={14} />
                              </Button>
                            </div>
                          </>
                        )}
                        {blockReason !== null && balanceAmount === 0 && (
                          <>
                            <Textarea
                              value={blockReason}
                              onChange={(e) => setBlockReason(e.target.value)}
                              placeholder="Причина блокировки..."
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBlockUser(user, blockReason)}
                                className="flex-1"
                              >
                                <Icon name="Ban" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                className="flex-1"
                              >
                                <Icon name="X" size={14} />
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditBalance(user)}
                          className="gap-2"
                          disabled={user.isBlocked}
                        >
                          <Icon name="Wallet" size={14} />
                          Баланс
                        </Button>
                        {user.isBlocked ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUnblockUser(user)}
                            className="gap-2"
                          >
                            <Icon name="Unlock" size={14} />
                            Разблокировать
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => startBlock(user)}
                            className="gap-2"
                          >
                            <Icon name="Ban" size={14} />
                            Заблокировать
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
