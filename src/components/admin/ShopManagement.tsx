import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import func2url from '../../../backend/func2url.json';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShopItem {
  id: number;
  name: string;
  amount: string;
  price: number;
  is_active: boolean;
  order_position: number;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface ShopManagementProps {
  shopItems: ShopItem[];
  isLoadingShop: boolean;
  user: SteamUser | null;
  onReload: () => Promise<void>;
}

interface SortableShopItemProps {
  item: ShopItem;
  shopItems: ShopItem[];
  onEdit: (item: ShopItem) => void;
  onToggle: (item: ShopItem) => void;
  onDelete: (id: number) => void;
  onMove: (item: ShopItem, direction: 'up' | 'down') => void;
}

function SortableShopItem({ item, shopItems, onEdit, onToggle, onDelete, onMove }: SortableShopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-lg border bg-background/50 hover:border-primary/30 transition-colors ${
        item.is_active ? 'border-border' : 'border-muted opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary/10 rounded touch-none"
          style={{ touchAction: 'none' }}
        >
          <Icon name="GripVertical" size={20} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{item.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${
              item.is_active 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-gray-500/20 text-gray-500'
            }`}>
              {item.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{item.amount}</span>
            <span className="font-semibold text-primary">{item.price} ₽</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMove(item, 'up')}
            disabled={shopItems.sort((a, b) => a.order_position - b.order_position).findIndex(i => i.id === item.id) === 0}
            title="Переместить вверх"
          >
            <Icon name="ArrowUp" size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMove(item, 'down')}
            disabled={shopItems.sort((a, b) => a.order_position - b.order_position).findIndex(i => i.id === item.id) === shopItems.length - 1}
            title="Переместить вниз"
          >
            <Icon name="ArrowDown" size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(item)}
            className="flex-1"
          >
            <Icon name="Edit" size={14} className="mr-1" />
            Редактировать
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={item.is_active ? "outline" : "default"}
            onClick={() => onToggle(item)}
            className="flex-1"
          >
            <Icon name={item.is_active ? "EyeOff" : "Eye"} size={14} className="mr-1" />
            {item.is_active ? 'Скрыть' : 'Показать'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(item.id)}
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ShopManagement({ shopItems, isLoadingShop, user, onReload }: ShopManagementProps) {
  const [editingShopId, setEditingShopId] = useState<number | null>(null);
  const [shopFormData, setShopFormData] = useState({
    name: '',
    amount: '',
    price: 0,
    is_active: true
  });

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const url = func2url['shop-items'];
      const method = editingShopId ? 'PUT' : 'POST';
      const body = editingShopId 
        ? { ...shopFormData, id: editingShopId }
        : shopFormData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await onReload();
        resetShopForm();
      }
    } catch (error) {
      console.error('Failed to save shop item:', error);
    }
  };

  const handleEditShopItem = (item: ShopItem) => {
    setEditingShopId(item.id);
    setShopFormData({
      name: item.name,
      amount: item.amount,
      price: item.price,
      is_active: item.is_active
    });
  };

  const handleDeleteShopItem = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return;
    if (!user) return;

    try {
      const response = await fetch(
        `${func2url['shop-items']}?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-Admin-Steam-Id': user.steamId
          }
        }
      );

      if (response.ok) {
        await onReload();
      }
    } catch (error) {
      console.error('Failed to delete shop item:', error);
    }
  };

  const handleToggleActive = async (item: ShopItem) => {
    if (!user) return;

    try {
      const response = await fetch(func2url['shop-items'], {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active
        })
      });

      if (response.ok) {
        await onReload();
      }
    } catch (error) {
      console.error('Failed to toggle shop item:', error);
    }
  };

  const resetShopForm = () => {
    setEditingShopId(null);
    setShopFormData({
      name: '',
      amount: '',
      price: 0,
      is_active: true
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !user) return;

    const sortedItems = [...shopItems].sort((a, b) => a.order_position - b.order_position);
    const oldIndex = sortedItems.findIndex(item => item.id === active.id);
    const newIndex = sortedItems.findIndex(item => item.id === over.id);

    const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order_position: index
      }));

      for (const update of updates) {
        await fetch(func2url['shop-items'], {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Steam-Id': user.steamId
          },
          body: JSON.stringify(update)
        });
      }

      await onReload();
    } catch (error) {
      console.error('Failed to reorder shop items:', error);
    }
  };

  const handleMoveShopItem = async (item: ShopItem, direction: 'up' | 'down') => {
    if (!user) return;

    const sortedItems = [...shopItems].sort((a, b) => a.order_position - b.order_position);
    const currentIndex = sortedItems.findIndex(i => i.id === item.id);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedItems.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapItem = sortedItems[swapIndex];

    try {
      await fetch(func2url['shop-items'], {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          id: item.id,
          order_position: swapItem.order_position
        })
      });

      await fetch(func2url['shop-items'], {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify({
          id: swapItem.id,
          order_position: item.order_position
        })
      });

      await onReload();
    } catch (error) {
      console.error('Failed to reorder shop items:', error);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Icon name={editingShopId ? "Edit" : "Plus"} size={24} />
            {editingShopId ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
          
          <form onSubmit={handleShopSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название товара</label>
              <Input
                value={shopFormData.name}
                onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                placeholder="VIP статус на месяц"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Количество/Описание</label>
              <Input
                value={shopFormData.amount}
                onChange={(e) => setShopFormData({ ...shopFormData, amount: e.target.value })}
                placeholder="1000 монет, 30 дней, и т.д."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽)</label>
              <Input
                type="number"
                value={shopFormData.price}
                onChange={(e) => setShopFormData({ ...shopFormData, price: Number(e.target.value) })}
                placeholder="100"
                required
                min="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={shopFormData.is_active}
                onChange={(e) => setShopFormData({ ...shopFormData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Активен (отображается в магазине)
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <Icon name={editingShopId ? "Save" : "Plus"} size={18} className="mr-2" />
                {editingShopId ? 'Сохранить' : 'Добавить'}
              </Button>
              {editingShopId && (
                <Button type="button" variant="outline" onClick={resetShopForm}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <div>
        <Card className="p-6 bg-card/80 backdrop-blur border-primary/20 max-h-[800px] flex flex-col">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 flex-shrink-0">
            <Icon name="ShoppingBag" size={24} />
            Список товаров ({shopItems.length})
          </h2>
          
          {isLoadingShop ? (
            <div className="text-center py-12 text-muted-foreground">
              Загрузка товаров...
            </div>
          ) : shopItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="ShoppingBag" size={48} className="mx-auto mb-3 opacity-20" />
              <p>Товары не добавлены</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={shopItems.sort((a, b) => a.order_position - b.order_position).map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {shopItems
                      .sort((a, b) => a.order_position - b.order_position)
                      .map((item) => (
                        <SortableShopItem
                          key={item.id}
                          item={item}
                          shopItems={shopItems}
                          onEdit={handleEditShopItem}
                          onToggle={handleToggleActive}
                          onDelete={handleDeleteShopItem}
                          onMove={handleMoveShopItem}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}