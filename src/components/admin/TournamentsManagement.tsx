import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import func2url from '../../../backend/func2url.json';
import TournamentForm from './tournaments/TournamentForm';
import TournamentCard from './tournaments/TournamentCard';
import type { Tournament, SteamUser, TournamentFormData } from './tournaments/types';
import { toLocalDateTimeInput, toUTCISOString } from '@/utils/dateFormat';

interface TournamentsManagementProps {
  tournaments: Tournament[];
  user: SteamUser;
  onReload: () => void;
}

export default function TournamentsManagement({ tournaments, user, onReload }: TournamentsManagementProps) {
  console.log('🎮 TournamentsManagement rendered', { user, tournamentsCount: tournaments.length });
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    prize_pool: '',
    max_participants: '',
    tournament_type: 'solo',
    start_date: '',
    status: 'upcoming',
    game: 'CS2'
  });
  
  console.log('📝 Current formData:', formData);
  console.log('✨ isCreating:', isCreating);

  const handleCreate = async () => {
    console.log('🔍 Validation check:', {
      name: formData.name,
      prize_pool: formData.prize_pool,
      max_participants: formData.max_participants,
      start_date: formData.start_date,
      allFilled: !!(formData.name && formData.prize_pool && formData.max_participants && formData.start_date)
    });
    
    if (!formData.name || !formData.prize_pool || !formData.max_participants || !formData.start_date) {
      alert('Заполните все обязательные поля');
      return;
    }

    console.log('📝 Creating tournament with data:', formData);
    console.log('🔑 User Steam ID:', user.steamId);
    console.log('🌐 URL:', func2url.tournaments);

    try {
      const requestBody = {
        name: formData.name,
        description: formData.description,
        prize_pool: parseInt(formData.prize_pool),
        max_participants: parseInt(formData.max_participants),
        tournament_type: formData.tournament_type,
        start_date: toUTCISOString(formData.start_date),
        status: formData.status,
        game: formData.game
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(func2url.tournaments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success result:', result);
        setIsCreating(false);
        setFormData({
          name: '',
          description: '',
          prize_pool: '',
          max_participants: '',
          tournament_type: 'solo',
          start_date: '',
          status: 'upcoming',
          game: 'CS2'
        });
        await onReload();
      } else {
        const error = await response.json();
        console.error('❌ Error response:', error);
        alert(`Ошибка: ${error.error || 'Не удалось создать турнир'}`);
      }
    } catch (error) {
      console.error('❌ Failed to create tournament:', error);
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
          start_date: toUTCISOString(formData.start_date),
          status: formData.status,
          game: formData.game
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
      start_date: toLocalDateTimeInput(tournament.start_date),
      status: tournament.status,
      game: tournament.game || 'CS2'
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
      status: 'upcoming',
      game: 'CS2'
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
        <TournamentForm
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <div key={tournament.id}>
            {editingId === tournament.id ? (
              <TournamentForm
                formData={formData}
                onFormChange={setFormData}
                onSubmit={() => handleUpdate(tournament)}
                onCancel={cancelEdit}
                isEditing={true}
                tournamentId={tournament.id}
              />
            ) : (
              <TournamentCard
                tournament={tournament}
                onEdit={() => startEdit(tournament)}
                onDelete={() => handleDelete(tournament.id)}
              />
            )}
          </div>
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