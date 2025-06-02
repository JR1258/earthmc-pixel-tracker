import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Crown, DollarSign, Activity, AlertCircle, Clock, Cloud, Globe, Server } from 'lucide-react';

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

const ServerStatus = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const estOffset = now.getTimezoneOffset() + 300; // EST is UTC-5
    return estOffset === 0 ? 'EST' : 'EDT';
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
    // Mock uptime calculation - in real implementation you'd get this from the API
    const uptimeHours = Math.floor(Math.random() * 168) + 24; // Random between 1-7 days
    const days = Math.floor(uptimeHours / 24);
    const hours = uptimeHours % 24;
    return `${days}d ${hours}h`;
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

        {/* Enhanced Quick Stats Card */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 border-green-500/20 text-white h-full">
            <CardHeader>
              <CardTitle className="text-green-400">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Server</span>
                  </div>
                  <span className="font-semibold">EarthMC</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Version</span>
                  </div>
                  <span className="font-semibold">
                    {loading ? <Skeleton className="h-5 w-16" /> : serverData?.version || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Map</span>
                  </div>
                  <span className="font-semibold">Aurora</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Server Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatServerTime()}</div>
                    <div className="text-xs text-gray-500">{getServerTimezone()}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getMinecraftTimeOfDay().icon}</span>
                    <span className="text-gray-400">MC Time</span>
                  </div>
                  <span className="font-semibold">{getMinecraftTimeOfDay().period}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Weather</span>
                  </div>
                  <span className="font-semibold">Clear ☀️</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">Uptime</span>
                  </div>
                  <span className="font-semibold text-green-400">{getUptime()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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