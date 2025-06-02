import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, DollarSign, MapPin, Crown, AlertCircle } from 'lucide-react';

interface BaseNation {
  name: string;
  uuid: string;
}

interface DetailedNation {
  name: string;
  uuid: string;
  king: { name: string; uuid: string };
  capital: { name: string; uuid: string };
  stats: {
    numTownBlocks: number;
    numResidents: number;
    numTowns: number;
    balance: number;
  };
  residents: Array<{ name: string; uuid: string }>;
  towns: Array<{ name: string; uuid: string }>;
}

const NationList = () => {
  const [allNations, setAllNations] = useState<BaseNation[]>([]);
  const [detailedNations, setDetailedNations] = useState<DetailedNation[]>([]);
  const [filteredNations, setFilteredNations] = useState<DetailedNation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'residents' | 'towns'>('balance');

  // Fetch all nations (basic info)
  const fetchBasicNations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.earthmc.net/v3/aurora/nations');
      if (!response.ok) throw new Error('Failed to fetch nations data');
      const nationsData = await response.json();
      setAllNations(nationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed info for the top 50 nations by sort/search
  const fetchDetailedNations = async (sortBy: 'balance' | 'residents' | 'towns' | 'name', searchTerm = '') => {
    setLoadingDetails(true);
    setError(null);
    try {
      // Fetch all nations (basic info)
      const response = await fetch('https://api.earthmc.net/v3/aurora/nations');
      if (!response.ok) throw new Error('Failed to fetch nations data');
      const nationsData = await response.json();

      // Filter by search term
      let filtered = nationsData;
      if (searchTerm) {
        filtered = filtered.filter((n: any) =>
          n.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort
      filtered = filtered.sort((a: any, b: any) => {
        if (sortBy === 'balance') return (b.stats?.balance || 0) - (a.stats?.balance || 0);
        if (sortBy === 'residents') return (b.stats?.numResidents || 0) - (a.stats?.numResidents || 0);
        if (sortBy === 'towns') return (b.stats?.numTowns || 0) - (a.stats?.numTowns || 0);
        return (a.name || '').localeCompare(b.name || '');
      });

      // Get top 50 UUIDs
      const topUuids = filtered.slice(0, 50).map((n: any) => n.uuid);

      // Fetch detailed info
      const detailRes = await fetch('https://api.earthmc.net/v3/aurora/nations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topUuids }),
      });
      if (!detailRes.ok) throw new Error('Failed to fetch detailed nation data');
      const detailed = await detailRes.json();

      setDetailedNations(detailed);
      setFilteredNations(detailed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDetailedNations([]);
      setFilteredNations([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchBasicNations();
  }, []);

  useEffect(() => {
    fetchDetailedNations(sortBy, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, searchTerm]);

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
      <Card className="bg-black/40 border-yellow-500/20 text-white">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Nation Browser</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Search and explore all nations on EarthMC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search nations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: 'name' | 'balance' | 'residents' | 'towns') => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="residents">Residents</SelectItem>
                  <SelectItem value="towns">Towns</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-400">
              Showing {filteredNations.length} of {detailedNations.length} nations (detailed info)
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading || loadingDetails ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="bg-black/40 border-yellow-500/20">
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
            <Card key={nation.uuid} className="bg-black/40 border-yellow-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-yellow-400 text-lg">{nation.name}</h3>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      King: {nation.king?.name || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-yellow-400">
                      ${(nation.stats?.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Residents</span>
                    </span>
                    <span>{nation.stats?.numResidents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Towns</span>
                    </span>
                    <span>{nation.stats?.numTowns || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NationList;