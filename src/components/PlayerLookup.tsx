import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown, Activity, Search, Loader2, AlertCircle } from 'lucide-react';

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

const PlayerLookup = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error state when searchQuery changes
    setError(null);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setPlayerData(null);

    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const response = await fetch(`${proxyUrl}${encodeURIComponent(`https://api.earthmc.net/v3/aurora/players/${encodeURIComponent(searchQuery.trim())}`)}`);
      
      if (!response.ok) {
        throw new Error('Player not found');
      }

      const data = await response.json();
      setPlayerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player data');
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerHead = (playerName: string) => {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">
          {playerName.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  const StatCard = ({ icon, label, value, color = "text-blue-400" }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className={color}>{icon}</div>
        <div>
          <div className="text-sm text-gray-400">{label}</div>
          <div className="font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Player Lookup</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Search for player information and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-4 mb-6">
            <Input
              type="text"
              placeholder="Enter player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {playerData && (
            <div className="space-y-6">
              <div className="flex items-start space-x-6 p-6 bg-gray-800/30 rounded-lg">
                {renderPlayerHead(playerData.name)}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{playerData.name}</h2>
                  {playerData.title && (
                    <div className="text-yellow-400 mb-2">{playerData.title}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600/20 text-blue-300">
                      {playerData.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    {playerData.town && (
                      <Badge className="bg-green-600/20 text-green-300">
                        {playerData.town}
                      </Badge>
                    )}
                    {playerData.nation && (
                      <Badge className="bg-purple-600/20 text-purple-300">
                        {playerData.nation}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="Town"
                  value={playerData.town || 'None'}
                  color="text-green-400"
                />
                <StatCard
                  icon={<Crown className="w-5 h-5" />}
                  label="Nation"
                  value={playerData.nation || 'None'}
                  color="text-purple-400"
                />
                <StatCard
                  icon={<Activity className="w-5 h-5" />}
                  label="Status"
                  value={playerData.isOnline ? 'Online' : 'Offline'}
                  color={playerData.isOnline ? "text-green-400" : "text-red-400"}
                />
              </div>

              {playerData.town && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Town Information</h3>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="text-gray-300">
                      Member of <span className="text-green-400 font-semibold">{playerData.town}</span>
                      {playerData.nation && (
                        <span> in the nation of <span className="text-purple-400 font-semibold">{playerData.nation}</span></span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!playerData && !loading && !error && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Search for a player to view their information</p>
              <p className="text-sm mt-2">Enter a player name in the search box above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerLookup;
