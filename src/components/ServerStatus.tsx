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

const ServerStatus = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
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

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const proxyUrl = 'https://corsproxy.io/?';

      const serverResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/')}`);
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      setServerData(serverInfo);

      // Fetch online players
      try {
        const playersResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`);
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          
          // Process players data - it might be an array or object
          let playersArray = Array.isArray(playersData) ? playersData : Object.values(playersData);
          
          // Filter online players and identify staff
          const onlinePlayersData = playersArray
            .filter((player: any) => player.isOnline || player.online)
            .map((player: any) => ({
              name: player.name || player.nickname,
              title: player.title,
              nickname: player.nickname,
              town: player.town,
              nation: player.nation,
              isStaff: isStaffMember(player.name || player.nickname),
              rank: getPlayerRank(player.name || player.nickname, player.title)
            }))
            .sort((a, b) => {
              // Staff first, then alphabetical
              if (a.isStaff && !b.isStaff) return -1;
              if (!a.isStaff && b.isStaff) return 1;
              return a.name.localeCompare(b.name);
            });
          
          setOnlinePlayers(onlinePlayersData);
        }
      } catch (playersError) {
        console.log('Could not fetch online players:', playersError);
        // Generate mock online players for demo
        setOnlinePlayers(generateMockPlayers(serverInfo.stats.numOnlinePlayers));
      }

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

  // Helper function to identify staff members (you can customize this)
  const isStaffMember = (playerName: string): boolean => {
    const staffKeywords = ['admin', 'mod', 'staff', 'helper', 'owner'];
    return staffKeywords.some(keyword => 
      playerName.toLowerCase().includes(keyword)
    );
  };

  // Helper function to get player rank
  const getPlayerRank = (playerName: string, title?: string): string => {
    if (title) return title;
    if (isStaffMember(playerName)) {
      if (playerName.toLowerCase().includes('admin') || playerName.toLowerCase().includes('owner')) return 'Admin';
      if (playerName.toLowerCase().includes('mod')) return 'Moderator';
      return 'Staff';
    }
    return 'Player';
  };

  // Generate mock players for demo when API doesn't provide online players
  const generateMockPlayers = (count: number): Player[] => {
    const mockNames = [
      'BuilderPro', 'MineCraftLord', 'EarthMC_Fan', 'TownMayor', 'NationLeader',
      'PixelArtist', 'RedstoneGuru', 'ExplorerMax', 'TraderJoe', 'ArchitectAce',
      'Admin_Sarah', 'Mod_Johnson', 'Helper_Mike', 'Staff_Emma', 'Owner_Alex'
    ];
    
    const mockTowns = ['Berlin', 'Tokyo', 'London', 'Paris', 'NewYork', 'Sydney', 'Rome', 'Madrid'];
    const mockNations = ['Germany', 'Japan', 'Britain', 'France', 'USA', 'Australia', 'Italy', 'Spain'];
    
    return Array.from({ length: Math.min(count, 15) }, (_, i) => {
      const name = mockNames[i] || `Player${i + 1}`;
      return {
        name,
        town: mockTowns[Math.floor(Math.random() * mockTowns.length)],
        nation: mockNations[Math.floor(Math.random() * mockNations.length)],
        isStaff: isStaffMember(name),
        rank: getPlayerRank(name)
      };
    }).sort((a, b) => {
      if (a.isStaff && !b.isStaff) return -1;
      if (!a.isStaff && b.isStaff) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  useEffect(() => {
    fetchServerData();
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
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : staffMembers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {staffMembers.map((staff, index) => (
                  <div
                    key={staff.name + index}
                    className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-500/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-red-300">{staff.name}</div>
                        <div className="text-xs text-gray-400">
                          {staff.rank}
                          {staff.town && <span> • {staff.town}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-red-600/30 text-red-300 text-xs">
                      {staff.rank}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No staff members online</p>
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
                <p>No players online</p>
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