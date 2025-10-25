import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { formatShortDate } from '@/utils/dateFormat';
import func2url from '../../../backend/func2url.json';

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
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
}

interface TournamentsManagementProps {
  tournaments: Tournament[];
  user: SteamUser;
  onReload: () => void;
}

export default function TournamentsManagement({ tournaments, user, onReload }: TournamentsManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prize_pool: '',
    max_participants: '',
    tournament_type: 'solo',
    start_date: '',
    status: 'upcoming'
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.prize_pool || !formData.max_participants || !formData.start_date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetch(func2url.tournaments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          prize_pool: parseInt(formData.prize_pool),
          max_participants: parseInt(formData.max_participants),
          tournament_type: formData.tournament_type,
          start_date: formData.start_date,
          status: formData.status
        })
      });

      if (response.ok) {
        setIsCreating(false);
        setFormData({
          name: '',
          description: '',
          prize_pool: '',
          max_participants: '',
          tournament_type: 'solo',
          start_date: '',
          status: 'upcoming'
        });
        await onReload();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось создать турнир'}`);
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
      alert('Ошибка при создании турнира');
    }
  };

  const handleUpdate = async (tournament: Tournament) => {
    try {
      const response = await fetch(func2url.tournaments, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          id: tournament.id,
          name: formData.name,
          description: formData.description,
          prize_pool: parseInt(formData.prize_pool),
          max_participants: parseInt(formData.max_participants),
          tournament_type: formData.tournament_type,
          start_date: formData.start_date,
          status: formData.status
        })
      });

      if (response.ok) {
        setEditingId(null);
        await onReload();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось обновить турнир'}`);
      }
    } catch (error) {
      console.error('Failed to update tournament:', error);
      alert('Ошибка при обновлении турнира');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот турнир?')) {
      return;
    }

    try {
      const response = await fetch(func2url.tournaments, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await onReload();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось удалить турнир'}`);
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      alert('Ошибка при удалении турнира');
    }
  };

  const startEdit = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setFormData({
      name: tournament.name,
      description: tournament.description,
      prize_pool: tournament.prize_pool.toString(),
      max_participants: tournament.max_participants.toString(),
      tournament_type: tournament.tournament_type,
      start_date: tournament.start_date.slice(0, 16),
      status: tournament.status
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      prize_pool: '',
      max_participants: '',
      tournament_type: 'solo',
      start_date: '',
      status: 'upcoming'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление турнирами</h2>
          <p className="text-muted-foreground">Всего турниров: {tournaments.length}</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          <Icon name={isCreating ? "X" : "Plus"} size={18} />
          {isCreating ? 'Отменить' : 'Создать турнир'}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icon name="Plus" size={20} className="text-primary" />
            Новый турнир
          </h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название турнира"
              />
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Введите описание турнира"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prize_pool">Призовой фонд (₽) *</Label>
                <Input
                  id="prize_pool"
                  type="number"
                  value={formData.prize_pool}
                  onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                  placeholder="10000"
                />
              </div>

              <div>
                <Label htmlFor="max_participants">Макс. участников *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="32"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tournament_type">Тип турнира</Label>
                <select
                  id="tournament_type"
                  value={formData.tournament_type}
                  onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="solo">Соло</option>
                  <option value="team">Командный</option>
                  <option value="weekly">Еженедельный</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Статус</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="upcoming">Предстоящий</option>
                  <option value="active">Активный</option>
                  <option value="completed">Завершен</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="start_date">Дата начала *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="flex-1 gap-2">
                <Icon name="Check" size={18} />
                Создать
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline" className="flex-1">
                Отмена
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/30 transition-colors">
            {editingId === tournament.id ? (
              <div className="grid gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="Edit" size={20} className="text-primary" />
                  Редактирование турнира
                </h3>

                <div>
                  <Label htmlFor={`edit-name-${tournament.id}`}>Название *</Label>
                  <Input
                    id={`edit-name-${tournament.id}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor={`edit-description-${tournament.id}`}>Описание</Label>
                  <Textarea
                    id={`edit-description-${tournament.id}`}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`edit-prize-${tournament.id}`}>Призовой фонд (₽) *</Label>
                    <Input
                      id={`edit-prize-${tournament.id}`}
                      type="number"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`edit-max-${tournament.id}`}>Макс. участников *</Label>
                    <Input
                      id={`edit-max-${tournament.id}`}
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`edit-type-${tournament.id}`}>Тип турнира</Label>
                    <select
                      id={`edit-type-${tournament.id}`}
                      value={formData.tournament_type}
                      onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="solo">Соло</option>
                      <option value="team">Командный</option>
                      <option value="weekly">Еженедельный</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`edit-status-${tournament.id}`}>Статус</Label>
                    <select
                      id={`edit-status-${tournament.id}`}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="upcoming">Предстоящий</option>
                      <option value="active">Активный</option>
                      <option value="completed">Завершен</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`edit-date-${tournament.id}`}>Дата начала *</Label>
                  <Input
                    id={`edit-date-${tournament.id}`}
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => handleUpdate(tournament)} className="flex-1 gap-2">
                    <Icon name="Check" size={18} />
                    Сохранить
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="flex-1">
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        name={tournament.tournament_type === 'team' ? 'Users' : tournament.tournament_type === 'weekly' ? 'Zap' : 'Trophy'} 
                        size={24} 
                        className="text-primary" 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{tournament.name}</h3>
                      <p className="text-muted-foreground text-sm">{tournament.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="DollarSign" size={16} className="text-primary" />
                      <span className="text-muted-foreground">Призовой:</span>
                      <span className="font-bold">{tournament.prize_pool.toLocaleString('ru-RU')}₽</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Users" size={16} className="text-primary" />
                      <span className="text-muted-foreground">Участников:</span>
                      <span className="font-bold">{tournament.participants_count}/{tournament.max_participants}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} className="text-primary" />
                      <span className="text-muted-foreground">Начало:</span>
                      <span className="font-bold">
                        {formatShortDate(tournament.start_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Info" size={16} className="text-primary" />
                      <span className="text-muted-foreground">Статус:</span>
                      <span className="font-bold">
                        {tournament.status === 'upcoming' ? 'Предстоящий' : 
                         tournament.status === 'active' ? 'Активный' : 'Завершен'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={() => startEdit(tournament)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Icon name="Edit" size={16} />
                    Изменить
                  </Button>
                  <Button
                    onClick={() => handleDelete(tournament.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-500 hover:text-red-600 hover:border-red-500"
                  >
                    <Icon name="Trash2" size={16} />
                    Удалить
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {tournaments.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Trophy" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Турниры отсутствуют</p>
          </Card>
        )}
      </div>
    </div>
  );
}