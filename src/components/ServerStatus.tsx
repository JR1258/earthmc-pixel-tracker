
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Crown, DollarSign, Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Town {
  name: string;
  mayor?: {
    name: string;
    uuid: string;
  };
  nation?: {
    name: string;
    uuid: string;
  };
  residents?: Array<{
    name: string;
    uuid: string;
  }>;
  stats?: {
    balance: number;
  };
  chunks?: number;
  location?: {
    x: number;
    z: number;
  };
}

interface OnlinePlayer {
  name: string;
  uuid: string;
}

interface ServerData {
  version: string;
  stats: {
    numOnlinePlayers: number;
    numTowns: number;
    numNations: number;
    numResidents: number;
  };
}

const ServerStatus = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch server data
      const serverResponse = await fetch('https://api.earthmc.net/v3/aurora/');
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      setServerData(serverInfo);

      // Fetch basic towns list
      const townsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();
      
      // Get top 10 towns by fetching detailed data for first 50 towns
      const topTownUuids = townsData.slice(0, 50).map((town: any) => town.uuid);
      
      const detailedTownsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: topTownUuids
        })
      });
      
      if (detailedTownsResponse.ok) {
        const detailedTowns = await detailedTownsResponse.json();
        const sortedTowns = detailedTowns
          .sort((a: Town, b: Town) => (b.stats?.balance || 0) - (a.stats?.balance || 0))
          .slice(0, 10);
        setTopTowns(sortedTowns);
      }

      // Fetch online players
      const playersResponse = await fetch('https://api.earthmc.net/v3/aurora/players');
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setOnlinePlayers(playersData.slice(0, 100)); // Limit to first 100 for performance
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerData();
    const interval = setInterval(fetchServerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
      {/* Server Status Card */}
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
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : serverData?.stats.numOnlinePlayers || 0}
              </div>
              <div className="text-sm text-gray-400">Players Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : serverData?.stats.numTowns || 0}
              </div>
              <div className="text-sm text-gray-400">Active Towns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : serverData?.version || 'Unknown'}
              </div>
              <div className="text-sm text-gray-400">Version</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : 'Aurora'}
              </div>
              <div className="text-sm text-gray-400">Map</div>
            </div>
          </div>

          {/* Online Players Section */}
          {onlinePlayers.length > 0 && (
            <div className="mt-6">
              <Button
                onClick={() => setShowOnlinePlayers(!showOnlinePlayers)}
                variant="outline"
                className="flex items-center space-x-2 mb-4"
              >
                <Users className="w-4 h-4" />
                <span>Online Players ({onlinePlayers.length})</span>
                {showOnlinePlayers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {showOnlinePlayers && (
                <div className="max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {onlinePlayers.map(player => (
                      <div key={player.uuid} className="text-sm text-gray-300 hover:text-white transition-colors">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Towns Card */}
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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topTowns.map((town, index) => (
                <div
                  key={town.name}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{town.name}</div>
                      <div className="text-sm text-gray-400">
                        Mayor: {town.mayor?.name || 'Unknown'} • Nation: {town.nation?.name || 'None'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      ${(town.stats?.balance || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {(town.residents?.length || 0)} residents
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatus;
