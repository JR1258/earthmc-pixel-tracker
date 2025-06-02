import { supabase } from '@/integrations/supabase/client';

export interface DailyStats {
  id?: number;
  date: string;
  residents: number;
  towns: number;
  nations: number;
  online_players: number;
  created_at?: string;
}

export const saveDailyStats = async (stats: Omit<DailyStats, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('daily_stats')
      .upsert({
        date: stats.date,
        residents: stats.residents,
        towns: stats.towns,
        nations: stats.nations,
        online_players: stats.online_players
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving daily stats:', error);
    throw error;
  }
};

export const getHistoricalStats = async (days: number = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching historical stats:', error);
    return [];
  }
};