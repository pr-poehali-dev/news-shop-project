import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { formatRelativeTime } from '@/utils/dateFormat';
import func2url from '../../backend/func2url.json';

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
  avatar: string;
  steam_id?: string;
  avatar_url?: string;
  parent_comment_id?: number | null;
  likes_count: number;
  is_liked: boolean;
  is_admin?: boolean;
  is_moderator?: boolean;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface CommentsProps {
  newsId: string;
}

export default function Comments({ newsId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SteamUser | null>(() => {
    const savedUser = localStorage.getItem('steamUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    try {
      const steamId = user?.steamId || '';
      console.log('💬 Loading comments for news_id:', newsId, 'steam_id:', steamId);
      const response = await fetch(`${func2url.comments}?news_id=${newsId}&steam_id=${steamId}`);
      const data = await response.json();
      console.log('💬 Loaded comments:', data.comments?.length || 0);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.text.trim()) return;

    if (!user) {
      alert('Войдите через Steam, чтобы оставить комментарий');
      return;
    }

    try {
      const response = await fetch(func2url.comments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          news_id: parseInt(newsId),
          author: user.personaName,
          text: newComment.text,
          steam_id: user.steamId,
          avatar_url: user.avatarUrl
        })
      });

      const data = await response.json();
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setNewComment({ text: '' });
        setIsFormVisible(false);
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleReply = async (parentCommentId: number) => {
    if (!replyText.trim()) return;

    if (!user) {
      alert('Войдите через Steam, чтобы ответить');
      return;
    }

    try {
      const response = await fetch(func2url.comments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          news_id: parseInt(newsId),
          author: user.personaName,
          text: replyText,
          steam_id: user.steamId,
          avatar_url: user.avatarUrl,
          parent_comment_id: parentCommentId
        })
      });

      const data = await response.json();
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!user) {
      alert('Войдите через Steam, чтобы лайкать комментарии');
      return;
    }

    try {
      const response = await fetch(func2url.comments, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'like',
          comment_id: commentId,
          steam_id: user.steamId
        })
      });

      const data = await response.json();
      if (data) {
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes_count: data.likes_count, is_liked: data.is_liked }
            : comment
        ));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    if (!user) {
      alert('Войдите через Steam');
      return;
    }

    try {
      const response = await fetch(func2url.comments, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment_id: commentId,
          steam_id: user.steamId
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments(comments.filter(c => c.id !== commentId && c.parent_comment_id !== commentId));
      } else {
        alert(data.error || 'Не удалось удалить комментарий');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Ошибка при удалении комментария');
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId: number) => comments.filter(c => c.parent_comment_id === parentId);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id}>
      <Card className={`p-6 bg-card/50 backdrop-blur border-border hover:border-primary/30 transition-colors ${isReply ? 'ml-16 mt-3' : ''}`}>
        <div className="flex gap-4">
          {comment.avatar_url ? (
            <img 
              src={comment.avatar_url} 
              alt={comment.author} 
              className="w-12 h-12 rounded-full border-2 border-primary/20 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
              {comment.avatar}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-lg">{comment.author}</h4>
                {comment.is_admin && (
                  <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs font-semibold rounded uppercase">
                    Админ
                  </span>
                )}
                {comment.is_moderator && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded uppercase">
                    Модер
                  </span>
                )}
                {comment.steam_id && (
                  <span className="px-2 py-0.5 bg-[#171a21] text-xs rounded flex items-center gap-1">
                    <Icon name="Gamepad2" size={12} />
                    Steam
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Icon name="Clock" size={14} />
                {formatRelativeTime(comment.date)}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{comment.text}</p>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => handleLike(comment.id)}
                className={`text-sm transition-colors flex items-center gap-1 ${
                  comment.is_liked 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon name={comment.is_liked ? "ThumbsUp" : "ThumbsUp"} size={16} />
                {comment.likes_count > 0 ? comment.likes_count : 'Нравится'}
              </button>
              {!isReply && (
                <button 
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Icon name="Reply" size={16} />
                  Ответить
                </button>
              )}
              {user && comment.steam_id === user.steamId && (
                <button 
                  onClick={() => handleDelete(comment.id)}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Icon name="Trash2" size={16} />
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {replyingTo === comment.id && user && (
        <Card className="ml-16 mt-3 p-4 border-primary/30 bg-card/80 backdrop-blur">
          <div className="flex gap-3 mb-3">
            <img 
              src={user.avatarUrl} 
              alt={user.personaName} 
              className="w-10 h-10 rounded-full border-2 border-primary/20"
            />
            <div className="flex-1">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Ответить ${comment.author}...`}
                className="min-h-[80px] bg-background/50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              size="sm"
              onClick={() => handleReply(comment.id)}
              disabled={!replyText.trim()}
            >
              <Icon name="Send" size={16} />
              Отправить
            </Button>
            <Button 
              size="sm"
              variant="outline" 
              onClick={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              Отмена
            </Button>
          </div>
        </Card>
      )}
      
      {getReplies(comment.id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Icon name="MessageSquare" size={28} />
          Комментарии ({topLevelComments.length})
        </h3>
        {user ? (
          !isFormVisible && (
            <Button onClick={() => setIsFormVisible(true)} className="gap-2">
              <Icon name="Plus" size={18} />
              Оставить комментарий
            </Button>
          )
        ) : (
          <div className="text-sm text-muted-foreground">
            Войдите через Steam, чтобы комментировать
          </div>
        )}
      </div>

      {isFormVisible && user && (
        <Card className="p-6 border-primary/30 bg-card/80 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={user.avatarUrl} 
                alt={user.personaName} 
                className="w-12 h-12 rounded-full border-2 border-primary/20"
              />
              <div>
                <div className="font-semibold">{user.personaName}</div>
                <div className="text-sm text-muted-foreground">Steam пользователь</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Комментарий</label>
              <Textarea
                value={newComment.text}
                onChange={(e) => setNewComment({ text: e.target.value })}
                placeholder="Поделитесь своим мнением об обновлении..."
                className="min-h-[100px] bg-background/50"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="gap-2">
                <Icon name="Send" size={18} />
                Отправить
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsFormVisible(false);
                  setNewComment({ text: '' });
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка комментариев...</div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Пока нет комментариев. Будьте первым!</div>
        ) : (
          topLevelComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}