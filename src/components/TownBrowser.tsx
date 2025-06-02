'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Town } from '@/types/town';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type SortOption = 'name' | 'balance' | 'residents';

const TownBrowser = () => {
  const [allTowns, setAllTowns] = useState<Town[]>([]);
  const [detailedTowns, setDetailedTowns] = useState<Town[]>([]);
  const [filteredTowns, setFilteredTowns] = useState<Town[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('detailed');
  const [sortOption, setSortOption] = useState<SortOption>('balance');
  const [selectedNation, setSelectedNation] = useState<string | null>(null);

  const fetchDetailedTowns = async (townNames: string[]) => {
    try {
      setLoadingDetails(true);
      const response = await fetch('https://api.earthmc.net/v3/aurora/towns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: townNames })
      });
      if (!response.ok) throw new Error('Failed to fetch detailed town data');
      const data = await response.json();
      setDetailedTowns(data);
    } catch (err) {
      console.error('Error fetching detailed towns:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchTowns = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://api.earthmc.net/v3/aurora/towns');
        const data = await res.json();
        setAllTowns(data);
        const townNames = data.map((t: any) => t.name);
        await fetchDetailedTowns(townNames);
      } catch (err) {
        setError('Failed to load town data');
      } finally {
        setLoading(false);
      }
    };
    fetchTowns();
  }, []);

  useEffect(() => {
    let towns = [...(viewMode === 'basic' ? allTowns : detailedTowns)];

    if (searchTerm) {
      towns = towns.filter((town) =>
        town.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedNation) {
      towns = towns.filter((town) => town.nation?.name === selectedNation);
    }

    towns.sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'balance') return (b.balance || 0) - (a.balance || 0);
      if (sortOption === 'residents') return (b.numResidents || 0) - (a.numResidents || 0);
      return 0;
    });

    setFilteredTowns(towns);
  }, [searchTerm, allTowns, detailedTowns, viewMode, sortOption, selectedNation]);

  const uniqueNations = Array.from(
    new Set(detailedTowns.map((town) => town.nation?.name).filter(Boolean))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search Towns..."
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
            <SelectItem value="residents">Residents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {uniqueNations.map((nation) => (
          <Badge
            key={nation}
            variant={selectedNation === nation ? 'default' : 'outline'}
            onClick={() =>
              setSelectedNation(selectedNation === nation ? null : nation)
            }
            className="cursor-pointer"
          >
            {nation}
          </Badge>
        ))}
      </div>

      {loading || loadingDetails ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-2">
          {filteredTowns.map((town) => (
            <Card key={town.uuid}>
              <CardHeader>
                <CardTitle>{town.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Mayor:</strong> {town.mayor?.name}</div>
                <div><strong>Nation:</strong> {town.nation?.name || 'None'}</div>
                <div><strong>Residents:</strong> {town.numResidents}</div>
                <div><strong>Balance:</strong> {town.balance}g</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TownBrowser;
