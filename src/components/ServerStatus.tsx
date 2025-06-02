
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Crown, DollarSign, Activity, AlertCircle } from 'lucide-react';

interface OnlineData {
  players: string[];
  timestamps: {
    unix: number;
    iso: string;
  };
}

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

const ServerStatus = () => {
  const [onlineData, setOnlineData] = useState<OnlineData | null>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch online players
      const onlineResponse = await fetch('https://api.earthmc.net/v3/aurora/online');
      if (!onlineResponse.ok) throw new Error('Failed to fetch online data');
      const onlineData = await onlineResponse.json();
      setOnlineData(onlineData);

      // Fetch towns for top 10
      const townsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();
      
      // Sort by balance and get top 10
      const sortedTowns = townsData
        .sort((a: Town, b: Town) => b.balance - a.balance)
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
                Live player count and server info
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
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : onlineData?.players.length || 0}
              </div>
              <div className="text-sm text-gray-400">Players Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : topTowns.length}
              </div>
              <div className="text-sm text-gray-400">Active Towns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : '1.20.1'}
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
                        Mayor: {town.mayor} • Nation: {town.nation}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      ${town.balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {town.residents.length} residents
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
