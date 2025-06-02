
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, MapPin, Crown, Users, AlertCircle, Loader2 } from 'lucide-react';

interface PlayerData {
  name: string;
  town: string;
  nation: string;
  balance: number;
  joinedTownAt: string;
  isOnline: boolean;
}

const PlayerLookup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      // First check if player is online
      const onlineResponse = await fetch('https://api.earthmc.net/v3/aurora/online');
      const onlineData = await onlineResponse.json();
      const isOnline = onlineData.players.includes(searchTerm);

      // Get all residents data (this requires fetching towns)
      const townsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!townsResponse.ok) throw new Error('Failed to fetch towns data');
      const townsData = await townsResponse.json();

      // Find the player's town
      const playerTown = townsData.find((town: any) => 
        town.residents.some((resident: string) => 
          resident.toLowerCase() === searchTerm.toLowerCase()
        )
      );

      if (!playerTown) {
        throw new Error('Player not found or not a resident of any town');
      }

      const playerInfo: PlayerData = {
        name: searchTerm,
        town: playerTown.name,
        nation: playerTown.nation,
        balance: 0, // This would require a different API endpoint
        joinedTownAt: 'Unknown', // This would require historical data
        isOnline
      };

      setPlayerData(playerInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Player not found');
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlayer();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Card */}
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Player Lookup</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Search for any player on EarthMC to see their town and nation info
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Enter player username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !searchTerm.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Card */}
      {hasSearched && (
        <Card className="bg-black/40 border-green-500/20 text-white">
          <CardHeader>
            <CardTitle className="text-green-400">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center space-x-2 text-red-400 p-4 bg-red-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            ) : playerData ? (
              <div className="space-y-6">
                {/* Player Header */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{playerData.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${playerData.isOnline ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {playerData.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-400">Town</span>
                      </div>
                      <div className="text-lg font-bold">{playerData.town}</div>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-400">Nation</span>
                      </div>
                      <div className="text-lg font-bold">{playerData.nation}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Status</span>
                      </div>
                      <div className="text-lg font-bold">
                        {playerData.isOnline ? 'Currently Online' : 'Offline'}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Player Info</div>
                      <div className="space-y-1 text-sm">
                        <div>Member of {playerData.town}</div>
                        <div>Citizen of {playerData.nation}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <div className="text-blue-400 text-sm font-semibold mb-2">Note</div>
                  <div className="text-sm text-gray-300">
                    Player data is fetched from the EarthMC API. Some detailed statistics like balance 
                    and join dates may not be available through the public API.
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="bg-black/40 border-gray-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-gray-400 text-sm">How to use Player Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400 space-y-2">
            <p>• Enter any Minecraft username to search for their EarthMC data</p>
            <p>• See which town and nation they belong to</p>
            <p>• Check if they're currently online</p>
            <p>• Data is updated in real-time from the EarthMC API</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerLookup;
