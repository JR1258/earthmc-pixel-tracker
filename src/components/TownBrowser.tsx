
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Users, DollarSign, Crown, AlertCircle } from 'lucide-react';

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

const TownBrowser = () => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [filteredTowns, setFilteredTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'residents'>('balance');
  const [selectedNation, setSelectedNation] = useState<string>('all');

  const fetchTowns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!response.ok) throw new Error('Failed to fetch towns data');
      
      const townsData = await response.json();
      setTowns(townsData);
      setFilteredTowns(townsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching towns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTowns();
  }, []);

  useEffect(() => {
    let filtered = towns.filter(town => 
      town.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      town.mayor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      town.nation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedNation !== 'all') {
      filtered = filtered.filter(town => town.nation === selectedNation);
    }

    // Sort towns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return (b.balance || 0) - (a.balance || 0);
        case 'residents':
          return b.residents.length - a.residents.length;
        default:
          return 0;
      }
    });

    setFilteredTowns(filtered);
  }, [towns, searchTerm, sortBy, selectedNation]);

  const uniqueNations = Array.from(new Set(towns.map(town => town.nation))).sort();

  const formatBalance = (balance: number | undefined | null): string => {
    if (balance === undefined || balance === null) return '$0';
    return `$${balance.toLocaleString()}`;
  };

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
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredTowns.length} of {towns.length} towns
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
        ) : (
          filteredTowns.map(town => (
            <Card key={town.name} className="bg-black/40 border-green-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-green-400 text-lg">{town.name}</h3>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {town.nation}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      {formatBalance(town.balance)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Mayor</span>
                    </span>
                    <span>{town.mayor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Residents</span>
                    </span>
                    <span>{town.residents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Location</span>
                    </span>
                    <span>{town.location.x}, {town.location.z}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Chunks</span>
                    <span>{town.chunks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && filteredTowns.length === 0 && (
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
