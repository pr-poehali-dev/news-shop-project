export interface Participant {
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  registered_at: string;
  confirmed_at?: string | null;
  is_admin?: boolean;
  is_moderator?: boolean;
}

export interface BracketMatch {
  id: number;
  round_number: number;
  match_number: number;
  player1_steam_id: string | null;
  player2_steam_id: string | null;
  player1_name: string | null;
  player2_name: string | null;
  player1_avatar: string | null;
  player2_avatar: string | null;
  winner_steam_id: string | null;
  player1_score: number;
  player2_score: number;
  status: string;
}

export interface TournamentDetail {
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
  participants: Participant[];
  bracket?: BracketMatch[];
  confirmed_at?: string | null;
}

export interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}