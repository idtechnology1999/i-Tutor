import { api, isLive } from './api';
import type { TeamMember } from './admin';

/* The team on the public website (GET /api/team). Demo mode reads the team
   the admin saved in this browser. */

export async function publicTeam(): Promise<TeamMember[]> {
  if (!isLive) {
    try {
      const team = JSON.parse(window.localStorage.getItem('itutor-team') ?? '[]') as TeamMember[];
      return team.sort((a, b) => a.order - b.order);
    } catch {
      return [];
    }
  }
  return api<TeamMember[]>('/api/team');
}
