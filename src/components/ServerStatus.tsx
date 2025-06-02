
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Crown, DollarSign, Activity, AlertCircle } from 'lucide-react';

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
  const [onlinePlayerCount, setOnlinePlayerCount] = useState<number>(0);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiWarning(null);

      // Try to fetch online players, but handle gracefully if it fails
      try {
        const onlineResponse = await fetch('https://api.earthmc.net/v3/aurora/online');
        if (onlineResponse.ok) {
          const onlineData = await onlineResponse.json();
          setOnlinePlayerCount(onlineData.players?.length || 0);
        } else {
          console.log('Online endpoint not available, using placeholder data');
          setApiWarning('Online player count unavailable - API endpoint not found');
          setOnlinePlayerCount(0); // Set to 0 as placeholder
        }
      } catch (onlineErr) {
        console.log('Failed to fetch online data:', onlineErr);
        setApiWarning('Online player count unavailable');
        setOnlinePlayerCount(0);
      }

      // Fetch towns for top 10
      const townsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();
      
      // Sort by balance and get top 10
      const sortedTowns = townsData
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
      {/* API Warning */}
      {apiWarning && (
        <Card className="bg-yellow-900/20 border-yellow-500/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{apiWarning}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : onlinePlayerCount}
              </div>
              <div className="text-sm text-gray-400">
                Players Online{apiWarning ? '*' : ''}
              </div>
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
                        Mayor: {town.mayor || 'Unknown'} • Nation: {town.nation || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      ${(town.balance || 0).toLocaleString()}
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
