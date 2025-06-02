
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, MapPin, Crown, Users, AlertCircle, Loader2, DollarSign } from 'lucide-react';

interface PlayerData {
  name: string;
  uuid: string;
  title?: string;
  surname?: string;
  formattedName?: string;
  about?: string;
  town?: {
    name: string;
    uuid: string;
  };
  nation?: {
    name: string;
    uuid: string;
  };
  timestamps: {
    registered: number;
    joinedTownAt?: number;
    lastOnline?: number;
  };
  status: {
    isOnline: boolean;
    isNPC: boolean;
    isMayor: boolean;
    isKing: boolean;
    hasTown: boolean;
    hasNation: boolean;
  };
  stats: {
    balance: number;
    numFriends: number;
  };
  ranks: {
    townRanks: string[];
    nationRanks: string[];
  };
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
      setPlayerData(null);

      console.log('Searching for player:', searchTerm.trim());

      const response = await fetch('https://api.earthmc.net/v3/aurora/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [searchTerm.trim()]
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const playersData = await response.json();
      console.log('Response data:', playersData);
      
      if (!playersData || playersData.length === 0) {
        throw new Error('Player not found');
      }

      setPlayerData(playersData[0]);
    } catch (err) {
      console.error('Player search error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error - please check your connection and try again');
      } else {
        setError(err instanceof Error ? err.message : 'Player not found');
      }
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlayer();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
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
            Search for any player on EarthMC to see their detailed information
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
                      <h3 className="text-xl font-bold">
                        {playerData.formattedName || playerData.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {playerData.status.isOnline && (
                          <Badge className="bg-green-600">Online</Badge>
                        )}
                        {!playerData.status.isOnline && (
                          <Badge className="bg-gray-600">Offline</Badge>
                        )}
                        {playerData.status.isKing && (
                          <Badge className="bg-purple-600">King</Badge>
                        )}
                        {playerData.status.isMayor && (
                          <Badge className="bg-blue-600">Mayor</Badge>
                        )}
                        {playerData.status.isNPC && (
                          <Badge className="bg-orange-600">NPC</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {playerData.town && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-blue-400">Town</span>
                        </div>
                        <div className="text-lg font-bold">{playerData.town.name}</div>
                        {playerData.ranks.townRanks.length > 0 && (
                          <div className="text-sm text-gray-400">
                            Ranks: {playerData.ranks.townRanks.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {playerData.nation && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Crown className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-400">Nation</span>
                        </div>
                        <div className="text-lg font-bold">{playerData.nation.name}</div>
                        {playerData.ranks.nationRanks.length > 0 && (
                          <div className="text-sm text-gray-400">
                            Ranks: {playerData.ranks.nationRanks.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Balance</span>
                      </div>
                      <div className="text-lg font-bold">${playerData.stats.balance.toLocaleString()}</div>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-400">Friends</span>
                      </div>
                      <div className="text-lg font-bold">{playerData.stats.numFriends}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {playerData.about && (
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-sm font-semibold text-gray-400 mb-2">About</div>
                    <div className="text-sm">{playerData.about}</div>
                  </div>
                )}

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-400 mb-2">Timeline</div>
                  <div className="space-y-1 text-sm">
                    <div>Registered: {formatDate(playerData.timestamps.registered)}</div>
                    {playerData.timestamps.joinedTownAt && (
                      <div>Joined Town: {formatDate(playerData.timestamps.joinedTownAt)}</div>
                    )}
                    {playerData.timestamps.lastOnline && (
                      <div>Last Online: {formatDate(playerData.timestamps.lastOnline)}</div>
                    )}
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
            <p>• Enter any Minecraft username to search</p>
            <p>• View detailed player information including town, nation, and ranks</p>
            <p>• See player balance, friends, and activity timeline</p>
            <p>• Data is fetched in real-time from the EarthMC API</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerLookup;
