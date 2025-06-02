
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Users, DollarSign, Crown, AlertCircle, Eye } from 'lucide-react';

interface BaseTown {
  name: string;
  uuid: string;
}

interface DetailedTown {
  name: string;
  uuid: string;
  board?: string;
  founder: string;
  mayor: {
    name: string;
    uuid: string;
  };
  nation?: {
    name: string;
    uuid: string;
  };
  timestamps: {
    registered: number;
    joinedNationAt?: number;
  };
  status: {
    isPublic: boolean;
    isOpen: boolean;
    isNeutral: boolean;
    isCapital: boolean;
    isRuined: boolean;
    hasNation: boolean;
  };
  stats: {
    numTownBlocks: number;
    maxTownBlocks: number;
    numResidents: number;
    balance: number;
  };
  coordinates: {
    spawn: {
      x: number;
      z: number;
    };
    homeBlock: [number, number];
  };
  residents: Array<{
    name: string;
    uuid: string;
  }>;
}

const TownBrowser = () => {
  const [allTowns, setAllTowns] = useState<BaseTown[]>([]);
  const [detailedTowns, setDetailedTowns] = useState<DetailedTown[]>([]);
  const [filteredTowns, setFilteredTowns] = useState<DetailedTown[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'residents'>('balance');
  const [selectedNation, setSelectedNation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('basic');

  const fetchBasicTowns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!response.ok) throw new Error('Failed to fetch towns data');
      
      const townsData = await response.json();
      setAllTowns(townsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching towns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedTowns = async (townUuids: string[]) => {
    try {
      setLoadingDetails(true);
      
      // Fetch detailed data for selected towns using POST
      const response = await fetch('https://api.earthmc.net/v3/aurora/towns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: townUuids.slice(0, 50) // Limit to prevent too large requests
        })
      });

      if (!response.ok) throw new Error('Failed to fetch detailed town data');
      
      const detailedData = await response.json();
      setDetailedTowns(detailedData);
    } catch (err) {
      console.error('Error fetching detailed towns:', err);
      setDetailedTowns([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadDetailedView = () => {
    if (allTowns.length > 0) {
      const topTownUuids = allTowns.slice(0, 50).map(town => town.uuid);
      fetchDetailedTowns(topTownUuids);
      setViewMode('detailed');
    }
  };

  useEffect(() => {
    fetchBasicTowns();
  }, []);

  useEffect(() => {
    if (viewMode === 'detailed' && detailedTowns.length > 0) {
      let filtered = detailedTowns.filter(town => {
        const townName = town.name || '';
        const mayorName = town.mayor?.name || '';
        const nationName = town.nation?.name || '';
        
        return townName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               mayorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               nationName.toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (selectedNation !== 'all') {
        filtered = filtered.filter(town => town.nation?.name === selectedNation);
      }

      // Sort towns
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'balance':
            return (b.stats?.balance || 0) - (a.stats?.balance || 0);
          case 'residents':
            return (b.stats?.numResidents || 0) - (a.stats?.numResidents || 0);
          default:
            return 0;
        }
      });

      setFilteredTowns(filtered);
    }
  }, [detailedTowns, searchTerm, sortBy, selectedNation, viewMode]);

  const uniqueNations = Array.from(new Set(detailedTowns.map(town => town.nation?.name).filter(Boolean))).sort();

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading towns: {error}</span>
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
            <MapPin className="w-5 h-5" />
            <span>Town Browser</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Search and explore all towns on EarthMC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'basic' ? 'default' : 'outline'}
                onClick={() => setViewMode('basic')}
                className="bg-green-600 hover:bg-green-700"
              >
                Basic View ({allTowns.length} towns)
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                onClick={loadDetailedView}
                disabled={loadingDetails}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                {loadingDetails ? 'Loading...' : 'Detailed View (Top 50)'}
              </Button>
            </div>

            {viewMode === 'detailed' && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search towns, mayors, or nations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <Select value={selectedNation} onValueChange={setSelectedNation}>
                  <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by nation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Nations</SelectItem>
                    {uniqueNations.map(nation => (
                      <SelectItem key={nation} value={nation}>{nation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: 'name' | 'balance' | 'residents') => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="residents">Residents</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-sm text-gray-400">
              {viewMode === 'basic' 
                ? `Showing ${allTowns.length} towns (basic info)` 
                : `Showing ${filteredTowns.length} of ${detailedTowns.length} towns (detailed info)`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Towns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
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
        ) : viewMode === 'basic' ? (
          allTowns.map(town => (
            <Card key={town.uuid} className="bg-black/40 border-green-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-green-400 text-lg">{town.name}</h3>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      Basic Info
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="text-gray-400">
                    Switch to detailed view to see more information
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : loadingDetails ? (
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
          filteredTowns.map(town => (
            <Card key={town.uuid} className="bg-black/40 border-green-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-green-400 text-lg">{town.name}</h3>
                    <div className="flex gap-1 mt-1">
                      {town.nation && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {town.nation.name}
                        </Badge>
                      )}
                      {town.status.isCapital && (
                        <Badge className="text-xs bg-purple-600">Capital</Badge>
                      )}
                      {town.status.isRuined && (
                        <Badge className="text-xs bg-red-600">Ruined</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      ${(town.stats?.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Mayor</span>
                    </span>
                    <span>{town.mayor?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Residents</span>
                    </span>
                    <span>{town.stats?.numResidents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Blocks</span>
                    </span>
                    <span>{town.stats?.numTownBlocks || 0}/{town.stats?.maxTownBlocks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <div className="flex gap-1">
                      {town.status.isPublic && <Badge className="text-xs bg-green-600">Public</Badge>}
                      {town.status.isOpen && <Badge className="text-xs bg-blue-600">Open</Badge>}
                      {town.status.isNeutral && <Badge className="text-xs bg-yellow-600">Neutral</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && viewMode === 'detailed' && filteredTowns.length === 0 && detailedTowns.length > 0 && (
        <Card className="bg-black/40 border-gray-500/20 text-white">
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No towns found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TownBrowser;
