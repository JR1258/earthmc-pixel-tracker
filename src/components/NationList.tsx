'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Nation } from '@/types/nation';

type SortOption = 'balance' | 'name' | 'towns' | 'residents';

const NationList = () => {
  const [nations, setNations] = useState<Nation[]>([]);
  const [filteredNations, setFilteredNations] = useState<Nation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.earthmc.net/v3/aurora/nations');
      if (!response.ok) throw new Error('Failed to fetch nation names');
      const nationList = await response.json();

      const detailedRes = await fetch('https://api.earthmc.net/v3/aurora/nations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nationList.map((n: any) => n.name) })
      });

      if (!detailedRes.ok) throw new Error('Failed to fetch detailed nation data');
      const detailedNations = await detailedRes.json();

      setNations(detailedNations);
      setFilteredNations(detailedNations);
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
    let sorted = [...nations];

    if (searchTerm) {
      sorted = sorted.filter((nation) =>
        nation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nation.king?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nation.capital?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    sorted.sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'balance') return (b.balance || 0) - (a.balance || 0);
      if (sortOption === 'towns') return (b.towns?.length || 0) - (a.towns?.length || 0);
      if (sortOption === 'residents') return (b.numResidents || 0) - (a.numResidents || 0);
      return 0;
    });

    setFilteredNations(sorted);
  }, [searchTerm, sortOption, nations]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search Nations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select value={sortOption} onValueChange={(v: SortOption) => setSortOption(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Balance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="towns">Towns</SelectItem>
            <SelectItem value="residents">Residents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-2">
          {filteredNations.map((nation) => (
            <Card key={nation.uuid}>
              <CardHeader>
                <CardTitle>{nation.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Capital:</strong> {nation.capital?.name}</div>
                <div><strong>King:</strong> {nation.king?.name}</div>
                <div><strong>Towns:</strong> {nation.towns?.length}</div>
                <div><strong>Residents:</strong> {nation.numResidents}</div>
                <div><strong>Balance:</strong> {nation.balance}g</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NationList;
