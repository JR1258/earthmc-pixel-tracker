import { useState, useEffect } from 'react';
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

  const loadHistoricalData = async () => {
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
  };

  const saveCurrentStats = () => {
    if (!serverData || !shouldSaveToday()) return;
    
    const saved = saveToday({
      residents: serverData.stats.numResidents,
      towns: serverData.stats.numTowns,
      nations: serverData.stats.numNations,
      onlinePlayers: serverData.stats.numOnlinePlayers
    });
    
    if (saved) {
      loadHistoricalData(); // Refresh the chart data
    }
  };

  // Load the real staff list from GitHub
  const loadStaffList = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/jwkerr/staff/master/staff.json');
      if (response.ok) {
        const staffData = await response.json();
        console.log('Loaded staff list:', staffData);
        setStaffList(staffData);
      } else {
        console.warn('Could not load staff list, using fallback');
        // Fallback staff list if the GitHub repo is unavailable
        setStaffList([
          { name: 'fix', rank: 'Owner' },
          { name: 'KarlOfDuty', rank: 'Admin' },
          { name: 'Seranis', rank: 'Admin' },
          { name: '32Oreo', rank: 'Moderator' },
          { name: 'ElectricBird', rank: 'Moderator' },
          { name: 'Fruitloopins', rank: 'Moderator' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load staff list:', error);
      // Use fallback staff list
      setStaffList([
        { name: 'fix', rank: 'Owner' },
        { name: 'KarlOfDuty', rank: 'Admin' },
        { name: 'Seranis', rank: 'Admin' },
        { name: '32Oreo', rank: 'Moderator' },
        { name: 'ElectricBird', rank: 'Moderator' },
        { name: 'Fruitloopins', rank: 'Moderator' },
      ]);
    }
  };

  // Helper function to identify staff members using the real staff list
  const isStaffMember = (playerName: string): boolean => {
    return staffList.some(staff => 
      staff.name.toLowerCase() === playerName.toLowerCase()
    );
  };

  // Helper function to get player rank from the real staff list
  const getPlayerRank = (playerName: string, title?: string): string => {
    if (title) return title;
    
    const staffMember = staffList.find(staff => 
      staff.name.toLowerCase() === playerName.toLowerCase()
    );
    
    if (staffMember) {
      return staffMember.rank;
    }
    
    return 'Player';
  };

  // Helper function to get rank colors
  const getRankColors = (rank: string) => {
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
          cardBg: 'bg-gray-800/20',
          text: 'text-gray-300',
          badgeBg: 'bg-gray-600/30'
        };
    }
  };

  // Fetch online players with better error handling and multiple approaches
  const fetchOnlinePlayers = async (proxyUrl: string) => {
    console.log('Attempting to fetch online players...');
    
    // Method 1: Try to get specific online players
    try {
      const playersResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [] // Empty query to get all players
        })
      });

      if (playersResponse.ok) {
        const responseText = await playersResponse.text();
        console.log('Raw players response:', responseText.substring(0, 500) + '...');
        
        let playersData;
        try {
          playersData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Invalid JSON response');
        }
        
        console.log('Parsed players data:', playersData);
        
        // Check if it's an array or object
        let processedPlayers = [];
        
        if (Array.isArray(playersData)) {
          // Handle array response
          processedPlayers = playersData
            .filter(player => player && player.status && player.status.isOnline)
            .map(player => ({
              name: player.name,
              title: player.title,
              nickname: player.nickname,
              town: player.town?.name,
              nation: player.nation?.name,
              isStaff: isStaffMember(player.name),
              rank: getPlayerRank(player.name, player.title)
            }));
        } else if (typeof playersData === 'object' && playersData !== null) {
          // Handle object response (keys are player names/UUIDs)
          const playerKeys = Object.keys(playersData);
          console.log(`Found ${playerKeys.length} player keys`);
          
          processedPlayers = playerKeys
            .map(key => {
              const player = playersData[key];
              if (player && player.status && player.status.isOnline) {
                return {
                  name: player.name || key,
                  title: player.title,
                  nickname: player.nickname,
                  town: player.town?.name,
                  nation: player.nation?.name,
                  isStaff: isStaffMember(player.name || key),
                  rank: getPlayerRank(player.name || key, player.title)
                };
              }
              return null;
            })
            .filter(player => player !== null);
        }
        
        if (processedPlayers.length > 0) {
          processedPlayers.sort((a, b) => {
            if (a.isStaff && !b.isStaff) return -1;
            if (!a.isStaff && b.isStaff) return 1;
            return a.name.localeCompare(b.name);
          });
          
          console.log(`Successfully processed ${processedPlayers.length} online players`);
          return processedPlayers;
        }
      }
    } catch (error) {
      console.error('Method 1 failed:', error);
    }

    // Method 2: Try alternative endpoint or approach
    try {
      console.log('Trying alternative approach...');
      const serverResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/')}`);
      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        
        // Check if server data contains online players list
        if (serverData.players && Array.isArray(serverData.players)) {
          const onlineFromServer = serverData.players
            .filter(player => player.isOnline)
            .map(player => ({
              name: player.name,
              title: player.title,
              town: player.town,
              nation: player.nation,
              isStaff: isStaffMember(player.name),
              rank: getPlayerRank(player.name, player.title)
            }));
          
          if (onlineFromServer.length > 0) {
            console.log(`Found ${onlineFromServer.length} players from server data`);
            return onlineFromServer;
          }
        }
      }
    } catch (error) {
      console.error('Method 2 failed:', error);
    }

    console.log('All methods failed, returning empty array');
    return [];
  };

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const proxyUrl = 'https://corsproxy.io/?';

      // Fetch main server data
      const serverResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/')}`);
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      setServerData(serverInfo);

      console.log('Server data loaded:', serverInfo);
      console.log(`Server reports ${serverInfo.stats.numOnlinePlayers} players online`);

      // Fetch online players using improved method
      const onlinePlayersData = await fetchOnlinePlayers(proxyUrl);
      setOnlinePlayers(onlinePlayersData);
      
      console.log(`Displaying ${onlinePlayersData.length} online players`);

      // Fetch towns data
      const townsResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/towns')}`);
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();
      
      let townsArray = Array.isArray(townsData) ? townsData : Object.values(townsData);
      
      const sortedTowns = townsArray
        .filter((town: Town) => town.balance && town.balance > 0)
        .sort((a: Town, b: Town) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 10);
      setTopTowns(sortedTowns);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load staff list first, then fetch server data
    loadStaffList().then(() => {
      fetchServerData();
    });
    loadHistoricalData();
    
    const interval = setInterval(fetchServerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (serverData) {
      saveCurrentStats();
    }
  }, [serverData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatServerTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getServerTimezone = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZone = parts.find(part => part.type === 'timeZoneName');
    return timeZone ? timeZone.value : 'EST';
  };

  const getMinecraftTimeOfDay = () => {
    const minecraftTime = (Date.now() / 50) % 24000;
    if (minecraftTime < 12000) {
      return { period: 'Day', icon: '☀️' };
    } else {
      return { period: 'Night', icon: '🌙' };
    }
  };

  const calculateDailyChange = (current: number, previous: number) => {
    const change = current - previous;
    return { change };
  };

  const getLatestData = () => {
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
  };

  const dailyChanges = getLatestData();
  const staffMembers = onlinePlayers.filter(p => p.isStaff);
  const regularPlayers = onlinePlayers.filter(p => !p.isStaff);

  const SimpleChart = ({ data, dataKey, color }: { data: ChartData[], dataKey: keyof ChartData, color: string }) => {
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
  };

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

      {/* Online Players Section - Real Data with Debug Info */}
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
              {serverData && onlinePlayers.length === 0 && (
                <span className="text-yellow-400 ml-2">
                  (API shows {serverData.stats.numOnlinePlayers} total online, but detailed data unavailable)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
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
                {serverData && serverData.stats.numOnlinePlayers > 0 && (
                  <p className="text-xs mt-2 text-yellow-400">
                    Server reports {serverData.stats.numOnlinePlayers} players online, but individual player data is not accessible
                  </p>
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
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Currently online players
              {serverData && onlinePlayers.length === 0 && (
                <span className="text-yellow-400 ml-2">
                  (Server total: {serverData.stats.numOnlinePlayers})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : regularPlayers.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {regularPlayers.slice(0, 10).map((player, index) => (
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
                  </div>
                ))}
                {regularPlayers.length > 10 && (
                  <div className="text-center py-2 text-gray-400 text-sm">
                    +{regularPlayers.length - 10} more players online
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Individual player data unavailable</p>
                {serverData && serverData.stats.numOnlinePlayers > 0 && (
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-yellow-400">
                      Server reports {serverData.stats.numOnlinePlayers} players online
                    </p>
                    <p className="text-gray-500">
                      The EarthMC API may be limiting detailed player data access
                    </p>
                  </div>
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
            Historical server growth data (shared across all users)
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

          {/* Data Info */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-semibold">Shared Data Storage</span>
            </div>
            <p className="text-xs text-gray-400">
              Historical data is shared via GitHub Gist. All users see the same charts and trends.
              {dailyChanges ? " Growth indicators are available!" : " Growth comparisons will appear after 2+ days of data."}
            </p>
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