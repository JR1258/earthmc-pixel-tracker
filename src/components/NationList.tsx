
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Crown, MapPin, Users, DollarSign, AlertCircle } from 'lucide-react';

interface Nation {
  name: string;
  capital: string;
  king: string;
  towns: string[];
  residents: string[];
  balance: number;
  color: string;
}

const NationList = () => {
  const [nations, setNations] = useState<Nation[]>([]);
  const [filteredNations, setFilteredNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'towns' | 'residents'>('balance');

  const fetchNations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.earthmc.net/v3/aurora/nations');
      if (!response.ok) throw new Error('Failed to fetch nations data');
      
      const nationsData = await response.json();
      setNations(nationsData);
      setFilteredNations(nationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching nations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNations();
  }, []);

  useEffect(() => {
    let filtered = nations.filter(nation => 
      nation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nation.king.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nation.capital.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort nations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return b.balance - a.balance;
        case 'towns':
          return b.towns.length - a.towns.length;
        case 'residents':
          return b.residents.length - a.residents.length;
        default:
          return 0;
      }
    });

    setFilteredNations(filtered);
  }, [nations, searchTerm, sortBy]);

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
            Explore all nations on EarthMC Aurora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search nations, kings, or capitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600 text-white"
              />
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
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredNations.length} of {nations.length} nations
          </div>
        </CardContent>
      </Card>

      {/* Nations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
          filteredNations.map(nation => (
            <Card key={nation.name} className="bg-black/40 border-green-500/20 text-white hover:bg-black/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-400 text-lg mb-1">{nation.name}</h3>
                    {nation.color && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-500"
                          style={{ backgroundColor: nation.color }}
                        />
                        <span className="text-xs text-gray-400">Nation Color</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      ${nation.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>King</span>
                    </span>
                    <span>{nation.king}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Capital</span>
                    </span>
                    <span>{nation.capital}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Towns</span>
                    </span>
                    <span>{nation.towns.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Residents</span>
                    </span>
                    <span>{nation.residents.length}</span>
                  </div>
                </div>

                {/* Town list preview */}
                {nation.towns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Towns:</div>
                    <div className="flex flex-wrap gap-1">
                      {nation.towns.slice(0, 3).map(town => (
                        <Badge key={town} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {town}
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

      {!loading && filteredNations.length === 0 && (
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
