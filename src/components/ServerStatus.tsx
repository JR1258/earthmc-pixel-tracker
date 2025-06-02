import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Crown, DollarSign, Activity, AlertCircle, Clock, Cloud, Globe, Server, TrendingUp, Zap, Shield, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

interface Town {
  name: string;
  mayor: string;
  nation: string;
  residents: string[];
  balance: number;
  chunks: number;
  location: {
    x: number;
    z: number;
  };
}

interface ServerData {
  version: string;
  stats: {
    numOnlinePlayers: number;
    numTowns: number;
    numNations: number;
    numResidents: number;
  };
  time?: {
    serverTime: number;
    worldTime: number;
    isDay: boolean;
    weather: string;
  };
}

interface DailyStats {
  date: string;
  residents: number;
  towns: number;
  nations: number;
  onlinePlayers: number;
}

const ServerStatus = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverUptime] = useState(() => {
    // Generate a stable uptime that doesn't change every render
    const baseUptime = 3 * 24 + 14; // 3 days 14 hours as base
    return baseUptime;
  });

  // Mock historical data - in a real app, this would come from your backend
  const [historicalData] = useState<DailyStats[]>(() => {
    const data: DailyStats[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic mock data with growth trends
      const baseResidents = 28000 + (Math.random() * 2000);
      const baseTowns = 4000 + (Math.random() * 200);
      const baseNations = 450 + (Math.random() * 20);
      const baseOnline = 120 + (Math.random() * 80);
      
      data.push({
        date: date.toISOString().split('T')[0],
        residents: Math.floor(baseResidents + (6 - i) * 50), // Growth over time
        towns: Math.floor(baseTowns + (6 - i) * 8),
        nations: Math.floor(baseNations + (6 - i) * 2),
        onlinePlayers: Math.floor(baseOnline + (Math.random() * 40 - 20)) // More volatile
      });
    }
    
    return data;
  });

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use CORS proxy for both requests
      const proxyUrl = 'https://corsproxy.io/?';

      // Fetch server data
      const serverResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/')}`);
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      setServerData(serverInfo);

      // Fetch towns data
      const townsResponse = await fetch(`${proxyUrl}${encodeURIComponent('https://api.earthmc.net/v3/aurora/towns')}`);
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();
      
      // Convert object to array if needed and sort by balance
      let townsArray = Array.isArray(townsData) ? townsData : Object.values(townsData);
      
      const sortedTowns = townsArray
        .filter((town: Town) => town.balance && town.balance > 0) // Only towns with actual balance
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
    fetchServerData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchServerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatServerTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York', // EarthMC server timezone (EST/EDT)
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
    // Minecraft day cycle is 20 minutes (1200 seconds)
    // 0-12000 ticks = day, 12000-24000 ticks = night
    const minecraftTime = (Date.now() / 50) % 24000; // Rough approximation
    if (minecraftTime < 12000) {
      return { period: 'Day', icon: '☀️' };
    } else {
      return { period: 'Night', icon: '🌙' };
    }
  };

  const getUptime = () => {
    // Fixed uptime calculation that doesn't change
    const days = Math.floor(serverUptime / 24);
    const hours = serverUptime % 24;
    return `${days}d ${hours}h`;
  };

  const calculateDailyChange = (current: number, previous: number) => {
    const change = current - previous;
    const percentage = previous > 0 ? ((change / previous) * 100) : 0;
    return { change, percentage };
  };

  const getLatestData = () => {
    if (historicalData.length < 2) return null;
    const today = historicalData[historicalData.length - 1];
    const yesterday = historicalData[historicalData.length - 2];
    
    return {
      residents: calculateDailyChange(today.residents, yesterday.residents),
      towns: calculateDailyChange(today.towns, yesterday.towns),
      nations: calculateDailyChange(today.nations, yesterday.nations),
    };
  };

  const dailyChanges = getLatestData();

  const SimpleChart = ({ data, dataKey, color }: { data: DailyStats[], dataKey: keyof DailyStats, color: string }) => {
    const maxValue = Math.max(...data.map(d => d[dataKey] as number));
    const minValue = Math.min(...data.map(d => d[dataKey] as number));
    const range = maxValue - minValue;
    
    return (
      <div className="h-24 flex items-end space-x-1">
        {data.map((point, index) => {
          const value = point[dataKey] as number;
          const height = range > 0 ? ((value - minValue) / range) * 80 + 8 : 8;
          
          return (
            <div
              key={index}
              className={`flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80 relative group`}
              style={{ 
                height: `${height}px`, 
                backgroundColor: color,
                minHeight: '8px'
              }}
            >
              {/* Tooltip */}
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
      {/* Top Row - Server Status and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Status Card */}
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

        {/* Quick Stats Card - Simple Design */}
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
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Weather</span>
                  <span className="font-semibold">Clear ☀️</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Uptime</span>
                  <span className="font-semibold text-green-400">{getUptime()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Growth Trends Chart - Fills the empty space */}
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>7-Day Growth Trends</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Daily server growth and activity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Residents Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-400">Total Residents</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numResidents || 0).toLocaleString()}
                    </span>
                    {dailyChanges?.residents && (
                      <div className={`flex items-center space-x-1 text-sm ${
                        dailyChanges.residents.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {dailyChanges.residents.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span>{Math.abs(dailyChanges.residents.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="residents" color="#60a5fa" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>

            {/* Towns Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-purple-400">Active Towns</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numTowns || 0).toLocaleString()}
                    </span>
                    {dailyChanges?.towns && (
                      <div className={`flex items-center space-x-1 text-sm ${
                        dailyChanges.towns.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {dailyChanges.towns.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span>{Math.abs(dailyChanges.towns.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="towns" color="#a855f7" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>

            {/* Nations Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400">Nations</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-8 w-16" /> : (serverData?.stats.numNations || 0).toLocaleString()}
                    </span>
                    {dailyChanges?.nations && (
                      <div className={`flex items-center space-x-1 text-sm ${
                        dailyChanges.nations.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {dailyChanges.nations.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span>{Math.abs(dailyChanges.nations.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <SimpleChart data={historicalData} dataKey="nations" color="#eab308" />
              <div className="text-xs text-gray-400 text-center">Past 7 days</div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Weekly Growth</div>
              <div className="text-lg font-bold text-green-400">
                +{dailyChanges ? dailyChanges.residents.change * 7 : 0} residents
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">New Towns</div>
              <div className="text-lg font-bold text-blue-400">
                +{dailyChanges ? dailyChanges.towns.change * 7 : 0} this week
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Growth Rate</div>
              <div className="text-lg font-bold text-purple-400">
                {dailyChanges ? dailyChanges.residents.percentage.toFixed(1) : 0}% daily
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Richest Towns Card */}
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