import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatShortDateTime } from '@/utils/dateFormat';
import { Participant } from './types';

interface ParticipantsListProps {
  participants: Participant[];
}

const ParticipantsList = ({ participants }: ParticipantsListProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Участники</h2>
          <p className="text-muted-foreground mt-1">Список зарегистрированных игроков</p>
        </div>
        <div className="text-2xl font-bold text-primary">{participants.length}</div>
      </div>

      {participants.length === 0 ? (
        <Card className="p-8 text-center">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Пока никто не зарегистрировался на турнир</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {participants.map((participant, index) => (
            <Card 
              key={participant.steam_id} 
              className="p-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <img 
                    src={participant.avatar_url} 
                    alt={participant.persona_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{participant.persona_name}</p>
                      {participant.is_admin && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                          Администратор
                        </span>
                      )}
                      {participant.is_moderator && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Модератор
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Зарегистрирован: {formatShortDateTime(participant.registered_at)}
                    </p>
                  </div>
                </div>
                <div>
                  {participant.confirmed_at ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <Icon name="CheckCircle2" size={16} />
                      <span className="text-xs font-medium">Подтвержден</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="Clock" size={16} />
                      <span className="text-xs">Ожидание</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;