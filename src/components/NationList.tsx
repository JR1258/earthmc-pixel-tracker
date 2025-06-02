
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Crown, MapPin, Users, DollarSign, AlertCircle } from 'lucide-react';

interface BaseNation {
  name: string;
  uuid: string;
}

interface DetailedNation {
  name: string;
  uuid: string;
  board?: string;
  dynmapColour?: string;
  king?: {
    name: string;
    uuid: string;
  };
  capital?: {
    name: string;
    uuid: string;
  };
  towns?: Array<{
    name: string;
    uuid: string;
  }>;
  residents?: Array<{
    name: string;
    uuid: string;
  }>;
  stats?: {
    balance: number;
    numTowns: number;
    numResidents: number;
    numAllies: number;
    numEnemies: number;
  };
  status?: {
    isPublic: boolean;
    isOpen: boolean;
    isNeutral: boolean;
  };
}

const NationList = () => {
  const [allNations, setAllNations] = useState<BaseNation[]>([]);
  const [detailedNations, setDetailedNations] = useState<DetailedNation[]>([]);
  const [filteredNations, setFilteredNations] = useState<DetailedNation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'towns' | 'residents'>('balance');

  const fetchNations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic nations list
      const response = await fetch('https://api.earthmc.net/v3/aurora/nations');
      if (!response.ok) throw new Error('Failed to fetch nations data');
      
      const nationsData = await response.json();
      setAllNations(nationsData);

      // Automatically fetch detailed data for top 50 nations
      await fetchDetailedNations(nationsData.slice(0, 50).map((nation: BaseNation) => nation.uuid));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching nations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedNations = async (nationUuids: string[]) => {
    try {
      setLoadingDetails(true);
      
      const response = await fetch('https://api.earthmc.net/v3/aurora/nations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: nationUuids
        })
      });

      if (!response.ok) throw new Error('Failed to fetch detailed nation data');
      
      const detailedData = await response.json();
      setDetailedNations(detailedData);
    } catch (err) {
      console.error('Error fetching detailed nations:', err);
      setDetailedNations([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const searchNations = async () => {
    if (!searchTerm.trim()) {
      setFilteredNations(detailedNations);
      return;
    }

    try {
      // Try to search by exact name first
      const response = await fetch('https://api.earthmc.net/v3/aurora/nations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [searchTerm.trim()]
        })
      });

      if (response.ok) {
        const searchResults = await response.json();
        if (searchResults.length > 0) {
          setFilteredNations(searchResults);
          return;
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }

    // Fallback to local filtering
    const filtered = detailedNations.filter(nation => 
      nation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nation.king?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nation.capital?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNations(filtered);
  };

  useEffect(() => {
    fetchNations();
  }, []);

  useEffect(() => {
    if (detailedNations.length > 0) {
      let filtered = searchTerm ? filteredNations : detailedNations;

      // Sort nations
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'balance':
            return (b.stats?.balance || 0) - (a.stats?.balance || 0);
          case 'towns':
            return (b.stats?.numTowns || 0) - (a.stats?.numTowns || 0);
          case 'residents':
            return (b.stats?.numResidents || 0) - (a.stats?.numResidents || 0);
          default:
            return 0;
        }
      });

      if (!searchTerm) {
        setFilteredNations(filtered);
      }
    }
  }, [detailedNations, sortBy]);

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading nations: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-black/40 border-green-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Nations Browser</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Explore all nations on EarthMC Aurora (showing top 50 by default)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search nations by name, king, or capital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchNations()}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
              <Button onClick={searchNations} className="bg-green-600 hover:bg-green-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <Select value={sortBy} onValueChange={(value: 'name' | 'balance' | 'towns' | 'residents') => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-600 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="towns">Towns</SelectItem>
                <SelectItem value="residents">Residents</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-400">
              Showing {filteredNations.length} of {detailedNations.length} nations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading || loadingDetails ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="bg-black/40 border-green-500/20">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredNations.map(nation => (
            <Card key={nation.uuid} className="bg-black/40 border-green-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-400 text-lg mb-1">{nation.name}</h3>
                    {nation.dynmapColour && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-500"
                          style={{ backgroundColor: `#${nation.dynmapColour}` }}
                        />
                        <span className="text-xs text-gray-400">Nation Color</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      ${(nation.stats?.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>King</span>
                    </span>
                    <span>{nation.king?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Capital</span>
                    </span>
                    <span>{nation.capital?.name || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Towns</span>
                    </span>
                    <span>{nation.stats?.numTowns || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Residents</span>
                    </span>
                    <span>{nation.stats?.numResidents || 0}</span>
                  </div>
                </div>

                {/* Town list preview */}
                {nation.towns && nation.towns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Towns:</div>
                    <div className="flex flex-wrap gap-1">
                      {nation.towns.slice(0, 3).map(town => (
                        <Badge key={town.uuid} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {town.name}
                        </Badge>
                      ))}
                      {nation.towns.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          +{nation.towns.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && !loadingDetails && filteredNations.length === 0 && (
        <Card className="bg-black/40 border-gray-500/20 text-white">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No nations found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NationList;
