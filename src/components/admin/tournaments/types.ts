export interface Tournament {
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
}

export interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
}

export interface TournamentFormData {
  name: string;
  description: string;
  prize_pool: string;
  max_participants: string;
  tournament_type: string;
  start_date: string;
  status: string;
  game: string;
}
