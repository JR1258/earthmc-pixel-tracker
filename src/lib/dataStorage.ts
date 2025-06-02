export interface DailyStats {
  date: string;
  residents: number;
  towns: number;
  nations: number;
  onlinePlayers: number;
}

// Your actual GitHub username and gist ID
const GITHUB_USERNAME = 'JR1258';
const GIST_ID = 'afd29d02bf92e7e62b4790eef9cd12d7';
const GIST_URL = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/${GIST_ID}/raw/earthmc-stats.json`;

// Load shared data from GitHub Gist
const getSharedData = async () => {
  try {
    console.log('Fetching from:', GIST_URL);
    const response = await fetch(GIST_URL);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded shared data:', data);
      return data;
    } else {
      console.error('Failed to fetch:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to load shared data:', error);
  }
  
  return { lastUpdated: new Date().toISOString(), stats: [] };
};

// Add this function right before getLast7Days
export const debugCurrentDates = () => {
  const today = new Date();
  console.log('=== DATE DEBUG ===');
  console.log('Current timestamp:', Date.now());
  console.log('Today is:', today.toISOString().split('T')[0]);
  console.log('Looking for these 7 days:');
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    console.log(`  ${i === 0 ? 'TODAY' : `${i} days ago`}: ${dateStr}`);
  }
  console.log('===================');
};

// Get last 7 days from shared data
export const getLast7Days = async (): Promise<(DailyStats | null)[]> => {
  // Add this line at the start
  debugCurrentDates();
  
  try {
    const sharedData = await getSharedData();
    const data = sharedData.stats || [];
    
    console.log('Processing data for last 7 days:', data);
    
    const result: (DailyStats | null)[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = data.find((s: DailyStats) => s.date === dateStr);
      result.push(dayData || null);
      
      console.log(`Day ${dateStr}:`, dayData || 'No data');
    }
    
    console.log('Final result:', result);
    return result;
  } catch (error) {
    console.error('Failed to load shared data, using local backup:', error);
    return getLast7DaysLocal();
  }
};

// Save today's stats (for now, save locally and show shared data)
export const saveToday = async (stats: Omit<DailyStats, 'date'>) => {
  const today = new Date().toISOString().split('T')[0];
  
  const newStats: DailyStats = {
    date: today,
    residents: stats.residents,
    towns: stats.towns,
    nations: stats.nations,
    onlinePlayers: stats.onlinePlayers
  };
  
  console.log('Saving today\'s stats:', newStats);
  
  // Save locally as backup
  saveToLocalStorage(newStats);
  
  // For now, we'll show the shared data but save locally
  console.log('Stats saved locally. Shared data will be updated manually for now.');
  
  return newStats;
};

export const shouldSaveToday = (): boolean => {
  // Save once per hour to avoid spam
  const lastSave = localStorage.getItem('last_save_time');
  if (!lastSave) return true;
  
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  return parseInt(lastSave) < oneHourAgo;
};

// Fallback localStorage functions
const saveToLocalStorage = (stats: DailyStats) => {
  try {
    const existing = getLocalData();
    const todayIndex = existing.findIndex(s => s.date === stats.date);
    
    if (todayIndex >= 0) {
      existing[todayIndex] = stats;
    } else {
      existing.push(stats);
    }
    
    // Keep only last 30 days
    const sorted = existing
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
    
    localStorage.setItem('earthmc_historical_data', JSON.stringify(sorted));
    localStorage.setItem('last_save_time', Date.now().toString());
    return stats;
  } catch (error) {
    console.error('localStorage save failed:', error);
    return null;
  }
};

const getLocalData = (): DailyStats[] => {
  try {
    const stored = localStorage.getItem('earthmc_historical_data');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const getLast7DaysLocal = (): (DailyStats | null)[] => {
  const data = getLocalData();
  const result: (DailyStats | null)[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = data.find(s => s.date === dateStr);
    result.push(dayData || null);
  }
  
  return result;
};
// Export local data functions for testing