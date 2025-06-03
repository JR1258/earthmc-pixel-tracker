import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, DollarSign, Activity, AlertCircle, BarChart3, ArrowUp, ArrowDown, Users, Shield, User } from 'lucide-react';
import { saveToday, getLast7Days, shouldSaveToday, type DailyStats } from '@/lib/dataStorage';

interface Town {
  name: string;
  mayor: string;
  nation: string;
  residents: string[];
  balance: number;
  chunks: number;
}

interface Player {
  name: string;
  title?: string;
  nickname?: string;
  town?: string;
  nation?: string;
  isStaff?: boolean;
  rank?: string;
  lastOnline?: number;
  isOnline?: boolean;
}

interface ServerData {
  version: string;
  stats: {
    numOnlinePlayers: number;
    numTowns: number;
    numNations: number;
    numResidents: number;
  };
  players?: Player[];
}

interface ChartData {
  date: string;
  residents: number | null;
  towns: number | null;
  nations: number | null;
  onlinePlayers: number | null;
}

interface StaffMember {
  name: string;
  rank: string;
  discord?: string;
}

const ServerStatus = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [playerLimit, setPlayerLimit] = useState(20);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [playerLoadingStatus, setPlayerLoadingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [displayLimit, setDisplayLimit] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper functions for time display
  const formatServerTime = useCallback(() => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [currentTime]);

  const getServerTimezone = useCallback(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZone = parts.find(part => part.type === 'timeZoneName');
    return timeZone ? timeZone.value : 'EST';
  }, []);

  const getMinecraftTimeOfDay = useCallback(() => {
    const minecraftTime = (Date.now() / 50) % 24000;
    if (minecraftTime < 12000) {
      return { period: 'Day', icon: '☀️' };
    } else {
      return { period: 'Night', icon: '🌙' };
    }
  }, []);

  // Helper function for rank colors
  const getRankColors = useCallback((rank: string) => {
    switch (rank) {
      case 'Owner':
        return {
          bg: 'bg-red-600',
          border: 'border-red-500/20',
          cardBg: 'bg-red-900/20',
          text: 'text-red-300',
          badgeBg: 'bg-red-600/30'
        };
      case 'Admin':
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-500/20',
          cardBg: 'bg-blue-900/20',
          text: 'text-blue-300',
          badgeBg: 'bg-blue-600/30'
        };
      case 'Developer':
        return {
          bg: 'bg-cyan-600',
          border: 'border-cyan-500/20',
          cardBg: 'bg-cyan-900/20',
          text: 'text-cyan-300',
          badgeBg: 'bg-cyan-600/30'
        };
      case 'Moderator':
        return {
          bg: 'bg-green-700',
          border: 'border-green-600/20',
          cardBg: 'bg-green-900/20',
          text: 'text-green-300',
          badgeBg: 'bg-green-700/30'
        };
      case 'Helper':
        return {
          bg: 'bg-green-300',
          border: 'border-green-200/20',
          cardBg: 'bg-green-100/10',
          text: 'text-green-200',
          badgeBg: 'bg-green-300/30'
        };
      default:
        return {
          bg: 'bg-gray-600',
          border: 'border-gray-500/20',
          cardBg: 'bg-gray-900/20',
          text: 'text-gray-300',
          badgeBg: 'bg-gray-600/30'
        };
    }
  }, []);

  const loadHistoricalData = useCallback(async () => {
    try {
      const last7Days = await getLast7Days();
      const today = new Date();
      
      const chartData: ChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = last7Days[6 - i];
        
        chartData.push({
          date: dateStr,
          residents: dayData?.residents || null,
          towns: dayData?.towns || null,
          nations: dayData?.nations || null,
          onlinePlayers: dayData?.onlinePlayers || null
        });
      }
      
      setHistoricalData(chartData);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }, []);

  const saveCurrentStats = useCallback(() => {
    if (!serverData || !shouldSaveToday()) return;
    
    const saved = saveToday({
      residents: serverData.stats.numResidents,
      towns: serverData.stats.numTowns,
      nations: serverData.stats.numNations,
      onlinePlayers: serverData.stats.numOnlinePlayers
    });
    
    if (saved) {
      loadHistoricalData();
    }
  }, [serverData, loadHistoricalData]);

  // Helper functions for staff identification
  const isStaffMember = useCallback((playerName: string): boolean => {
    if (!Array.isArray(staffList)) return false;
    return staffList.some(staff => 
      staff.name && staff.name.toLowerCase() === playerName.toLowerCase()
    );
  }, [staffList]);

  const getPlayerRank = useCallback((playerName: string, title?: string): string => {
    if (title) return title;
    
    if (!Array.isArray(staffList)) return 'Player';
    
    const staffMember = staffList.find(staff => 
      staff.name && staff.name.toLowerCase() === playerName.toLowerCase()
    );
    
    return staffMember ? staffMember.rank : 'Player';
  }, [staffList]);

  const calculateDailyChange = useCallback((current: number, previous: number) => {
    const change = current - previous;
    return { change };
  }, []);

  const getLatestData = useCallback(() => {
    const validData = historicalData.filter(d => 
      d.residents !== null && d.towns !== null && d.nations !== null
    );
    
    if (validData.length < 2) return null;
    
    const today = validData[validData.length - 1];
    const yesterday = validData[validData.length - 2];
    
    return {
      residents: calculateDailyChange(today.residents!, yesterday.residents!),
      towns: calculateDailyChange(today.towns!, yesterday.towns!),
      nations: calculateDailyChange(today.nations!, yesterday.nations!),
    };
  }, [historicalData, calculateDailyChange]);

  // Enhanced function to fetch online players
  const fetchOnlinePlayers = useCallback(async () => {
    try {
      setPlayerLoadingStatus('loading');
      console.log('Fetching online players...');

      const proxyUrl = 'https://corsproxy.io/?';
      const playersResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`);
      
      if (!playersResponse.ok) {
        throw new Error('Failed to fetch players list');
      }
      
      const allPlayers = await playersResponse.json();
      
      if (!Array.isArray(allPlayers) || allPlayers.length === 0) {
        throw new Error('No players data received');
      }

      // Strategy: Check players in randomized batches to find online ones
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      const batchSize = 200;
      const maxInitialBatches = 5; // Check up to 1000 players initially
      const foundOnlinePlayers: any[] = [];
      
      for (let batch = 0; batch < maxInitialBatches; batch++) {
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, shuffledPlayers.length);
        const batchPlayers = shuffledPlayers.slice(startIndex, endIndex).map(p => p.name || p.uuid);
        
        try {
          console.log(`Initial batch ${batch + 1}/${maxInitialBatches} (${batchPlayers.length} players)...`);
          
          const detailResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: batchPlayers,
              template: {
                name: true,
                title: true,
                town: true,
                nation: true,
                status: true
              }
            })
          });

          if (detailResponse.ok) {
            const batchData = await detailResponse.json();
            const batchOnline = batchData.filter((player: any) => 
              player.status && player.status.isOnline === true
            );

            if (batchOnline.length > 0) {
              foundOnlinePlayers.push(...batchOnline);
              console.log(`Found ${batchOnline.length} online players in batch ${batch + 1}, total: ${foundOnlinePlayers.length}`);
              
              // If we've found enough players for good initial display, we can continue but don't need to rush
              if (foundOnlinePlayers.length >= 25) {
                console.log('Found good amount of online players for initial display');
              }
            }
          }

          // Delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (batchError) {
          console.log(`Initial batch ${batch + 1} failed:`, batchError);
        }
      }

    if (foundOnlinePlayers.length > 0) {
      const processedPlayers = foundOnlinePlayers
        .map((player: any) => ({
          name: player.name,
          isStaff: isStaffMember(player.name),
          rank: getPlayerRank(player.name, player.title),
          isOnline: true,
          town: player.town?.name,
          nation: player.nation?.name,
          title: player.title
        }))
        .filter((player, index, self) => 
          index === self.findIndex(p => p.name === player.name) // Remove duplicates
        )
        .sort((a, b) => {
          if (a.isStaff && !b.isStaff) return -1;
          if (!a.isStaff && b.isStaff) return 1;
          return a.name.localeCompare(b.name);
        });

      console.log('Final processed online players:', processedPlayers.length);
      setOnlinePlayers(processedPlayers);
      setPlayerLoadingStatus('success');
      return;
    }

    // If no online players found
    console.log('Could not find any online players');
    setOnlinePlayers([]);
    setPlayerLoadingStatus('error');
    
  } catch (error) {
    console.error('Error in fetchOnlinePlayers:', error);
    setOnlinePlayers([]);
    setPlayerLoadingStatus('error');
  }
}, [isStaffMember, getPlayerRank]);

  // Add the missing loadMoreOnlinePlayers function
  const loadMoreOnlinePlayers = useCallback(async () => {
    try {
      setIsLoadingMore(true);
      console.log('Loading more online players...');

      const proxyUrl = 'https://corsproxy.io/?';
      const playersResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`);
      
      if (!playersResponse.ok) {
        throw new Error('Failed to fetch more players');
      }
      
      const allPlayers = await playersResponse.json();
      
      if (!Array.isArray(allPlayers) || allPlayers.length === 0) {
        throw new Error('No additional players data received');
      }

      // Get more players in randomized batches
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      const batchSize = 200;
      const maxBatches = 3; // Check up to 600 more players
      const foundOnlinePlayers: any[] = [];
      
      for (let batch = 0; batch < maxBatches; batch++) {
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, shuffledPlayers.length);
        const batchPlayers = shuffledPlayers.slice(startIndex, endIndex).map(p => p.name || p.uuid);
        
        try {
          console.log(`Loading more batch ${batch + 1}/${maxBatches} (${batchPlayers.length} players)...`);
          
          const detailResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: batchPlayers,
              template: {
                name: true,
                title: true,
                town: true,
                nation: true,
                status: true
              }
            })
          });

          if (detailResponse.ok) {
            const batchData = await detailResponse.json();
            const batchOnline = batchData.filter((player: any) => 
              player.status && player.status.isOnline === true
            );

            if (batchOnline.length > 0) {
              foundOnlinePlayers.push(...batchOnline);
              console.log(`Found ${batchOnline.length} more online players in batch ${batch + 1}, total new: ${foundOnlinePlayers.length}`);
            }
          }

          // Delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (batchError) {
          console.log(`More players batch ${batch + 1} failed:`, batchError);
        }
      }

      if (foundOnlinePlayers.length > 0) {
        const processedNewPlayers = foundOnlinePlayers
          .map((player: any) => ({
            name: player.name,
            isStaff: isStaffMember(player.name),
            rank: getPlayerRank(player.name, player.title),
            isOnline: true,
            town: player.town?.name,
            nation: player.nation?.name,
            title: player.title
          }))
          .filter((player, index, self) => 
            index === self.findIndex(p => p.name === player.name) && // Remove duplicates
            !onlinePlayers.some(existing => existing.name === player.name) // Don't add existing players
          );

        if (processedNewPlayers.length > 0) {
          setOnlinePlayers(prev => {
            const combined = [...prev, ...processedNewPlayers];
            return combined.sort((a, b) => {
              if (a.isStaff && !b.isStaff) return -1;
              if (!a.isStaff && b.isStaff) return 1;
              return a.name.localeCompare(b.name);
            });
          });
          console.log(`Added ${processedNewPlayers.length} new online players`);
        }
      }
    } catch (error) {
      console.error('Error loading more online players:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isStaffMember, getPlayerRank, onlinePlayers]);

  // Enhanced fetchServerData function
  const fetchServerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const proxyUrl = 'https://corsproxy.io/?';

      // Fetch main server data
      const serverResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/')}`);
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      console.log('Server info received:', serverInfo);
      setServerData(serverInfo);

      // Fetch towns data for richest towns
      try {
        console.log('Fetching towns data...');
        const townsResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/towns')}`);
        
        if (townsResponse.ok) {
          const townsData = await townsResponse.json();
          console.log('Towns data received:', townsData);
          
          // The API returns basic town info, we need detailed info for each town
          if (Array.isArray(townsData) && townsData.length > 0) {
            // Fetch detailed info for first 20 towns (to avoid too many requests)
            const detailedTowns = [];
            const townsToFetch = townsData.slice(0, 20);
            
            for (const town of townsToFetch) {
              try {
                const detailResponse = await fetch(`${proxyUrl}${encodeURIComponent(`https://api.earthmc.net/v3/aurora/towns/${town.name}`)}`);
                if (detailResponse.ok) {
                  const detailData = await detailResponse.json();
                  if (detailData.balance && detailData.balance > 0) {
                    detailedTowns.push(detailData);
                  }
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (err) {
                console.log(`Failed to fetch details for town ${town.name}:`, err);
              }
            }
            
            // Sort by balance and take top 10
            const sortedTowns = detailedTowns
              .sort((a: Town, b: Town) => (b.balance || 0) - (a.balance || 0))
              .slice(0, 10);
            
            console.log('Top towns by balance:', sortedTowns);
            setTopTowns(sortedTowns);
          }
        } else {
          console.log('Towns API returned error:', townsResponse.status);
          setTopTowns([]);
        }
      } catch (townError) {
        console.error('Error fetching towns:', townError);
        setTopTowns([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Updated staff list loading function
  const loadStaffList = useCallback(async () => {
    try {
      console.log('Loading staff list...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        'https://raw.githubusercontent.com/jwkerr/staff/master/staff.json',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('Staff list not available, using fallback');
        const fallbackStaff = [
          { name: 'FixEMC', rank: 'Owner' },
          { name: 'KarlOfDuty', rank: 'Admin' },
          { name: 'Fruitloopins', rank: 'Developer' },
          { name: 'lucas2107', rank: 'Moderator' },
          { name: 'Warriorrr', rank: 'Helper' }
        ];
        setStaffList(fallbackStaff);
        return;
      }

      const staffData = await response.json();
      console.log('Raw staff data received:', staffData);
      
      // Transform UUID-based staff data to name-based format
      const knownStaff = [
        { name: 'FixEMC', rank: 'Owner' },
        { name: 'KarlOfDuty', rank: 'Admin' },
        { name: 'sn0wyz', rank: 'Admin' },
        { name: 'Fruitloopins', rank: 'Developer' },
        { name: 'gorkymoo1119', rank: 'Developer' },
        { name: 'lucas2107', rank: 'Staff Manager' },
        { name: 'Warriorrr', rank: 'Staff Manager' },
        { name: 'RangerMK01', rank: 'Staff Manager' },
        { name: 'Vorobyviktor', rank: 'Moderator' },
        { name: 'StarKiller1744', rank: 'Moderator' },
        { name: 'AlphaDS', rank: 'Moderator' },
        { name: 'DataPools', rank: 'Moderator' },
        { name: 'frederik1906', rank: 'Moderator' },
        { name: 'geg_ma', rank: 'Moderator' },
        { name: 'GetShrekt0', rank: 'Moderator' },
        { name: 'NamelessSteve10', rank: 'Moderator' },
        { name: 'RoyaleStrike', rank: 'Moderator' },
        { name: 'Shippe', rank: 'Moderator' },
        { name: 'TownsEndDragon', rank: 'Moderator' },
        { name: 'Unbinding', rank: 'Moderator' },
        { name: 'GamerTime_12', rank: 'Moderator' },
        { name: 'TachiOnAir', rank: 'Helper' },
        { name: 'Aries_aow', rank: 'Helper' },
        { name: 'Redstone_Chaser', rank: 'Helper' },
        { name: 'Cadenya', rank: 'Helper' },
        { name: 'Dawser_the_Great', rank: 'Helper' },
        { name: 'EtherealSquid', rank: 'Helper' },
        { name: 'HiItsJake', rank: 'Helper' },
        { name: 'Icarus_the_2nd', rank: 'Helper' },
        { name: 'OneMoreLegend', rank: 'Helper' },
        { name: 'PolkadotBlueBear', rank: 'Helper' }
      ];
      
      console.log('Using known staff list:', knownStaff);
      setStaffList(knownStaff);
      
    } catch (error) {
      console.error('Failed to load staff list:', error);
      const fallbackStaff = [
        { name: 'FixEMC', rank: 'Owner' },
        { name: 'KarlOfDuty', rank: 'Admin' },
        { name: 'Fruitloopins', rank: 'Developer' },
        { name: 'lucas2107', rank: 'Moderator' },
        { name: 'Warriorrr', rank: 'Helper' }
      ];
      setStaffList(fallbackStaff);
    }
  }, []);

  // SIMPLIFIED useEffect - only run once on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (mounted) {
        console.log('Initializing data...');
        await loadStaffList();
        await loadHistoricalData();
        await fetchServerData();
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [loadStaffList, fetchServerData, loadHistoricalData]);

  // Fetch online players after server data is loaded
  useEffect(() => {
    if (serverData && staffList.length > 0) {
      fetchOnlinePlayers();
    }
  }, [serverData, staffList, fetchOnlinePlayers]);

  // SIMPLIFIED interval useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Refreshing server data...');
      fetchServerData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchServerData]);

  // Save stats when server data changes
  useEffect(() => {
    saveCurrentStats();
  }, [saveCurrentStats]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoize expensive calculations
  const staffMembers = useMemo(() => onlinePlayers.filter(p => p.isStaff), [onlinePlayers]);
  const regularPlayers = useMemo(() => onlinePlayers.filter(p => !p.isStaff), [onlinePlayers]);
  const dailyChanges = useMemo(() => getLatestData(), [getLatestData]);

  // Simplify load more functions
  const loadMorePlayers = useCallback(() => {
    setPlayerLimit(prev => Math.min(prev + 20, 100));
  }, []);

  const toggleShowAllPlayers = useCallback(() => {
    setShowAllPlayers(prev => !prev);
    setPlayerLimit(showAllPlayers ? 20 : 100);
  }, [showAllPlayers]);

  const SimpleChart = useCallback(({ data, dataKey, color }: { data: ChartData[], dataKey: keyof ChartData, color: string }) => {
    const validData = data.filter(d => d[dataKey] !== null);
    
    if (validData.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center bg-gray-800/30 rounded-lg">
          <span className="text-gray-500 text-sm">No data collected yet</span>
        </div>
      );
    }
    
    const maxValue = Math.max(...validData.map(d => d[dataKey] as number));
    const minValue = Math.min(...validData.map(d => d[dataKey] as number));
    const range = maxValue - minValue;
    
    return (
      <div className="h-24 flex items-end space-x-1">
        {data.map((point, index) => {
          const value = point[dataKey] as number | null;
          
          if (value === null) {
            return (
              <div
                key={index}
                className="flex-1 bg-gray-700/30 rounded-t-sm relative group"
                style={{ height: '8px' }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: No data
                </div>
              </div>
            );
          }
          
          const height = range > 0 ? ((value - minValue) / range) * 80 + 8 : 24;
          
          return (
            <div
              key={index}
              className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80 relative group"
              style={{ 
                height: `${height}px`, 
                backgroundColor: color,
                minHeight: '8px'
              }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, []);

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading server data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-black/40 border-green-500/20 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Server Status</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Live server info and statistics
                  </CardDescription>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse" />
                  Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : (serverData?.stats.numOnlinePlayers || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Players Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : (serverData?.stats.numTowns || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Active Towns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : (serverData?.stats.numNations || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Nations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : 'Aurora'}
                  </div>
                  <div className="text-sm text-gray-400">Map</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-black/40 border-green-500/20 text-white h-full">
            <CardHeader>
              <CardTitle className="text-green-400">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Server</span>
                  <span className="font-semibold">EarthMC</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Version</span>
                  <span className="font-semibold">
                    {loading ? <Skeleton className="h-5 w-16" /> : serverData?.version || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Map</span>
                  <span className="font-semibold">Aurora</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Server Time</span>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatServerTime()}</div>
                    <div className="text-xs text-gray-500">{getServerTimezone()}</div>
                  </div>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">MC Time</span>
                  <span className="font-semibold">{getMinecraftTimeOfDay().period} {getMinecraftTimeOfDay().icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Online Players Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Members */}
        <Card className="bg-black/40 border-red-500/20 text-white">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Staff Online</span>
              <Badge variant="secondary" className="bg-red-600/20 text-red-300">
                {staffMembers.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Currently online staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playerLoadingStatus === 'loading' ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : staffMembers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {staffMembers.map((staff, index) => {
                  const colors = getRankColors(staff.rank || 'Staff');
                  return (
                    <div
                      key={staff.name + index}
                      className={`flex items-center justify-between p-3 ${colors.cardBg} rounded-lg border ${colors.border}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}>
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className={`font-semibold ${colors.text}`}>{staff.name}</div>
                          <div className="text-xs text-gray-400">
                            {staff.rank}
                            {staff.town && <span> • {staff.town}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${colors.badgeBg} ${colors.text} text-xs`}>
                        {staff.rank}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No staff members online</p>
                {playerLoadingStatus === 'error' && (
                  <p className="text-xs text-gray-500 mt-2">Unable to fetch real-time player data</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regular Players */}
        <Card className="bg-black/40 border-blue-500/20 text-white">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Players Online</span>
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                {regularPlayers.length}
                {serverData?.stats.numOnlinePlayers && regularPlayers.length < serverData.stats.numOnlinePlayers && 
                  ` of ${serverData.stats.numOnlinePlayers}`
                }
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Currently online players {playerLoadingStatus === 'success' ? '(real-time data)' : '(limited data)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playerLoadingStatus === 'loading' ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : regularPlayers.length > 0 ? (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {regularPlayers.slice(0, displayLimit).map((player, index) => (
                    <div
                      key={player.name + index}
                      className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-500/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-300">{player.name}</div>
                          <div className="text-xs text-gray-400">
                            {player.town && <span>{player.town}</span>}
                            {player.nation && <span> • {player.nation}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-green-400">●</div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {regularPlayers.length > displayLimit && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setDisplayLimit(prev => prev + 20)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                    >
                      Show More ({regularPlayers.length - displayLimit} remaining)
                    </button>
                  </div>
                )}
                
                {/* Fetch More Players Button */}
                {displayLimit >= regularPlayers.length && regularPlayers.length > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMoreOnlinePlayers}
                      disabled={isLoadingMore}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                    >
                      {isLoadingMore ? 'Loading More Players...' : 'Load More Players'}
                    </button>
                  </div>
                )}
                
                {/* Status message */}
                {playerLoadingStatus === 'success' && regularPlayers.length > 0 && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-300 text-sm">
                      Showing {Math.min(displayLimit, regularPlayers.length)} of {regularPlayers.length} players
                    </p>
                    <p className="text-gray-400 text-xs">
                      Data from server API
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {playerLoadingStatus === 'error' ? (
                  <div className="space-y-3">
                    <p className="text-red-400">Player API Offline</p>
                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm mb-1">
                        Unable to fetch player data
                      </p>
                      <p className="text-gray-400 text-xs">
                        The player API endpoints are currently unavailable. Server reports {serverData?.stats.numOnlinePlayers || 0} players online.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>No players online</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Trends */}
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>7-Day Growth Trends</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Historical server growth data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-blue-400">Total Residents</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numResidents || 0).toLocaleString()}
                  </span>
                  {dailyChanges?.residents ? (
                    <div className={`flex items-center space-x-1 text-sm ${
                      dailyChanges.residents.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {dailyChanges.residents.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(dailyChanges.residents.change)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Need 2+ days</span>
                  )}
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="residents" color="#60a5fa" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-purple-400">Active Towns</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numTowns || 0).toLocaleString()}
                  </span>
                  {dailyChanges?.towns ? (
                    <div className={`flex items-center space-x-1 text-sm ${
                      dailyChanges.towns.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {dailyChanges.towns.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(dailyChanges.towns.change)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Need 2+ days</span>
                  )}
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="towns" color="#a855f7" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-yellow-400">Nations</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numNations || 0).toLocaleString()}
                  </span>
                  {dailyChanges?.nations ? (
                    <div className={`flex items-center space-x-1 text-sm ${
                      dailyChanges.nations.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {dailyChanges.nations.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(dailyChanges.nations.change)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Need 2+ days</span>
                  )}
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="nations" color="#eab308" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Richest Towns */}
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Richest Towns</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Top 10 towns by bank balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topTowns.length > 0 ? (
            <div className="space-y-3">
              {topTowns.map((town, index) => (
                <div
                  key={town.name}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{town.name}</div>
                      <div className="text-sm text-gray-400">
                        <span>Mayor: {town.mayor || 'Unknown'}</span>
                        {town.nation && <span> • Nation: {town.nation}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-yellow-400 text-lg">
                        {(town.balance || 0).toLocaleString()} Gold
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {(town.residents?.length || 0)} residents
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No town data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatus;
