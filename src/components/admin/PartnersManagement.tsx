import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import func2url from '../../../backend/func2url.json';

interface Partner {
  id: number;
  name: string;
  description: string;
  logo: string;
  website: string;
  category: string;
  isActive: boolean;
  orderPosition: number;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface PartnersManagementProps {
  partners: Partner[];
  isLoadingPartners: boolean;
  user: SteamUser | null;
  onReload: () => Promise<void>;
}

export default function PartnersManagement({ 
  partners, 
  isLoadingPartners, 
  user, 
  onReload 
}: PartnersManagementProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    website: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      description: partner.description,
      logo: partner.logo,
      website: partner.website
    });
  };

  const handleSave = async () => {
    console.log('🔵 handleSave called', { user, editingId, formData });
    
    if (!user) {
      console.log('❌ No user');
      return;
    }
    
    setError('');
    setSuccess('');
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.website.trim()) {
      console.log('❌ Validation failed');
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      const url = func2url.partners;
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...(editingId && editingId !== 0 && { id: editingId }),
        ...formData
      };
      
      console.log('📤 Sending request:', { url, method, body });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify(body)
      });

      console.log('📥 Response:', response.status, response.ok);

      if (response.ok) {
        setSuccess(editingId ? 'Партнёр обновлён' : 'Партнёр добавлен');
        await onReload();
        setTimeout(() => {
          handleCancel();
        }, 1000);
      } else {
        const data = await response.json();
        console.log('❌ Error response:', data);
        setError(data.error || 'Ошибка при сохранении');
      }
    } catch (error) {
      console.error('❌ Failed to save partner:', error);
      setError('Ошибка соединения с сервером');
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (!confirm('Вы уверены, что хотите удалить этого партнёра?')) return;

    try {
      const response = await fetch(func2url.partners, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await onReload();
      }
    } catch (error) {
      console.error('Failed to delete partner:', error);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    if (!user) return;

    try {
      const response = await fetch(func2url.partners, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          id: partner.id,
          isActive: !partner.isActive
        })
      });

      if (response.ok) {
        await onReload();
      }
    } catch (error) {
      console.error('Failed to toggle partner status:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      logo: '',
      website: ''
    });
    setError('');
    setSuccess('');
  };

  const handleNew = () => {
    setEditingId(0);
    setFormData({
      name: '',
      description: '',
      logo: '🤝',
      website: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Handshake" size={24} />
            Управление партнёрами
          </h2>
          <Button onClick={handleNew} className="gap-2">
            <Icon name="Plus" size={18} />
            Добавить партнёра
          </Button>
        </div>

        {editingId !== null && (
          <Card className="p-6 bg-primary/5 border-primary/20 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId === 0 ? 'Новый партнёр' : 'Редактирование партнёра'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                {success}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название компании"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Логотип (эмодзи)</label>
                <Input
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="🎮"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Веб-сайт</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание партнёра..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} className="gap-2">
                <Icon name="Check" size={18} />
                Сохранить
              </Button>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <Icon name="X" size={18} />
                Отмена
              </Button>
            </div>
          </Card>
        )}

        {isLoadingPartners ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Loader2" size={48} className="mx-auto mb-3 animate-spin" />
            <p className="text-lg">Загрузка партнёров...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Handshake" size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg">Нет добавленных партнёров</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={`p-4 rounded-lg border transition-colors ${
                  partner.isActive 
                    ? 'border-border bg-background/50 hover:border-primary/30' 
                    : 'border-muted bg-muted/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {partner.logo}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{partner.name}</h3>
                        {!partner.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            Скрыт
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {partner.description}
                      </p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Icon name="ExternalLink" size={12} />
                        {partner.website}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(partner)}
                      className="gap-2"
                    >
                      <Icon name="Edit" size={14} />
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant={partner.isActive ? "secondary" : "default"}
                      onClick={() => handleToggleActive(partner)}
                      className="gap-2"
                    >
                      <Icon name={partner.isActive ? "EyeOff" : "Eye"} size={14} />
                      {partner.isActive ? 'Скрыть' : 'Показать'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(partner.id)}
                      className="gap-2"
                    >
                      <Icon name="Trash2" size={14} />
                      Удалить
                    </Button>
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