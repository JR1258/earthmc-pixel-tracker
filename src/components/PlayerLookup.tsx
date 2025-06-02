import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, MapPin, Crown, Users, AlertCircle, Loader2, DollarSign, Calendar, Clock } from 'lucide-react';

// Add custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(55, 65, 81, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.8);
  }
`;

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
  friends?: Array<{ name: string; uuid: string }>;
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

      // Use a different CORS proxy that better handles POST requests
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://api.earthmc.net/v3/aurora/players')}`;
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [searchTerm.trim()]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      // Check if response is valid JSON
      let playersData;
      try {
        playersData = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Invalid response format from API');
      }
      
      // The API returns an object with player names/UUIDs as keys
      const playerKeys = Object.keys(playersData);
      if (playerKeys.length === 0) {
        throw new Error('Player not found');
      }

      const playerKey = playerKeys[0];
      const player = playersData[playerKey];
      
      if (!player || player.error) {
        throw new Error('Player not found or invalid data');
      }

      setPlayerData(player);
    } catch (err) {
      console.error('Player lookup error:', err);
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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateWithTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinecraftHeadUrl = (username: string) => {
    return `https://mc-heads.net/avatar/${username}/64`;
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
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
                  placeholder="Enter player username or UUID..."
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
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                        <img
                          src={getMinecraftHeadUrl(playerData.name)}
                          alt={`${playerData.name}'s head`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                        <User className="w-6 h-6 text-white hidden" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {playerData.formattedName || playerData.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {playerData.status?.isOnline && (
                            <Badge className="bg-green-600">Online</Badge>
                          )}
                          {playerData.status && !playerData.status.isOnline && (
                            <Badge className="bg-gray-600">Offline</Badge>
                          )}
                          {playerData.status?.isKing && (
                            <Badge className="bg-purple-600">King</Badge>
                          )}
                          {playerData.status?.isMayor && (
                            <Badge className="bg-blue-600">Mayor</Badge>
                          )}
                          {playerData.status?.isNPC && (
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
                          {playerData.ranks?.townRanks && playerData.ranks.townRanks.length > 0 && (
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
                          {playerData.ranks?.nationRanks && playerData.ranks.nationRanks.length > 0 && (
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
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-yellow-400">Gold Balance</span>
                        </div>
                        <div className="text-lg font-bold text-yellow-400">{(playerData.stats?.balance || 0).toLocaleString()} Gold</div>
                      </div>

                      <div className="p-4 bg-gray-800/50 rounded-lg relative group">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-yellow-400">Friends</span>
                        </div>
                        <div className="text-lg font-bold">{playerData.stats?.numFriends || 0}</div>
                        
                        {/* Enhanced Friends hover tooltip */}
                        {playerData.friends && playerData.friends.length > 0 && (
                          <div className="absolute bottom-full left-0 mb-2 w-72 p-0 bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none group-hover:pointer-events-auto">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 rounded-t-xl">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-semibold text-yellow-400">Friends List</span>
                                <span className="text-xs text-gray-400">({playerData.friends.length})</span>
                              </div>
                            </div>
                            
                            {/* Friends List */}
                            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                              <div className="space-y-1">
                                {playerData.friends.map((friend, index) => (
                                  <div 
                                    key={friend.uuid} 
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 group/friend"
                                  >
                                    <div className="relative">
                                      <img
                                        src={getMinecraftHeadUrl(friend.name)}
                                        alt={friend.name}
                                        className="w-8 h-8 rounded-md border border-gray-600 group-hover/friend:border-yellow-400/50 transition-colors"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                                        }}
                                      />
                                      <div className="w-8 h-8 rounded-md bg-gray-700 border border-gray-600 items-center justify-center hidden">
                                        <User className="w-4 h-4 text-gray-400" />
                                      </div>
                                      {/* Online indicator placeholder */}
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-600 rounded-full border-2 border-gray-900"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-200 group-hover/friend:text-white transition-colors truncate">
                                        {friend.name}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {friend.uuid.split('-')[0]}...
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      #{index + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Footer */}
                            {playerData.friends.length > 5 && (
                              <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/30 rounded-b-xl">
                                <div className="text-xs text-gray-400 text-center">
                                  Scroll to see all {playerData.friends.length} friends
                                </div>
                              </div>
                            )}
                            
                            {/* Arrow pointer */}
                            <div className="absolute top-full left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-600/50"></div>
                          </div>
                        )}
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

                  {/* Enhanced Timeline */}
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-blue-400">Timeline</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                        <div>
                          <div className="text-sm font-medium text-green-400">Account Created</div>
                          <div className="text-sm text-gray-300">{formatDate(playerData.timestamps.registered)}</div>
                        </div>
                      </div>
                      
                      {playerData.timestamps.joinedTownAt && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          <div>
                            <div className="text-sm font-medium text-blue-400">Joined Current Town</div>
                            <div className="text-sm text-gray-300">{formatDate(playerData.timestamps.joinedTownAt)}</div>
                          </div>
                        </div>
                      )}
                      
                      {playerData.timestamps.lastOnline && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                          <div>
                            <div className="text-sm font-medium text-yellow-400 flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>Last Seen</span>
                            </div>
                            <div className="text-sm text-gray-300">{formatDateWithTime(playerData.timestamps.lastOnline)}</div>
                            <div className="text-xs text-gray-400">{getTimeAgo(playerData.timestamps.lastOnline)}</div>
                          </div>
                        </div>
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
              <p>• Enter any Minecraft username or UUID to search</p>
              <p>• View detailed player information including town, nation, and ranks</p>
              <p>• See player balance, friends, and activity timeline</p>
              <p>• Hover over the friends count to see the full friends list</p>
              <p>• Data is fetched in real-time from the EarthMC API</p>
              <p>• Note: Using CORS proxy for browser compatibility</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PlayerLookup;