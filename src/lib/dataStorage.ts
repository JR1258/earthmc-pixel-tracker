export interface DailyStats {
  date: string;
  residents: number;
  towns: number;
  nations: number;
  onlinePlayers: number;
}

export interface HistoricalData {
  lastUpdated: string;
  stats: DailyStats[];
}

const STORAGE_KEY = 'earthmc_historical_data';

export const saveToday = (stats: Omit<DailyStats, 'date'>) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Get existing data
    const existingData = getHistoricalData();
    
    // Check if today's data already exists
    const todayIndex = existingData.stats.findIndex(s => s.date === today);
    
    const newStats: DailyStats = {
      date: today,
      residents: stats.residents,
      towns: stats.towns,
      nations: stats.nations,
      onlinePlayers: stats.onlinePlayers
    };
    
    if (todayIndex >= 0) {
      // Update existing entry
      existingData.stats[todayIndex] = newStats;
    } else {
      // Add new entry
      existingData.stats.push(newStats);
    }
    
    // Keep only last 30 days of data
    existingData.stats = existingData.stats
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
    
    existingData.lastUpdated = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
    
    console.log('Daily stats saved successfully');
    return newStats;
  } catch (error) {
    console.error('Failed to save daily stats:', error);
    return null;
  }
};

export const getHistoricalData = (): HistoricalData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load historical data:', error);
  }
  
  // Return empty data structure if nothing exists
  return {
    lastUpdated: new Date().toISOString(),
    stats: []
  };
};

export const getLast7Days = () => {
  const data = getHistoricalData();
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  // Create array for last 7 days
  const last7Days: (DailyStats | null)[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = data.stats.find(s => s.date === dateStr);
    last7Days.push(dayData || null);
  }
  
  return last7Days;
};

export const shouldSaveToday = (): boolean => {
  const data = getHistoricalData();
  const today = new Date().toISOString().split('T')[0];
  const lastSaved = data.stats.find(s => s.date === today);
  
  if (!lastSaved) return true;
  
  // Only save once per day, but allow updates if it's been more than 1 hour
  const lastUpdate = new Date(data.lastUpdated);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  return lastUpdate < oneHourAgo;
};