'use client';

import { useState } from 'react';
import { Resident } from '@/types/resident';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

const PlayerLookup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerData, setPlayerData] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setPlayerData(null);
      setHasSearched(true);

      const response = await fetch('https://api.earthmc.net/v3/aurora/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: [searchTerm.trim()] })
      });

      if (!response.ok) throw new Error('Failed to fetch player data');

      const playersData = await response.json();

      if (!Array.isArray(playersData) || playersData.length === 0) {
        setError('Player not found');
        return;
      }

      setPlayerData(playersData[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPlayerData(null);
      console.error('Error fetching player:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter Player Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={searchPlayer} disabled={loading}>
          Search
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : playerData ? (
        <Card>
          <CardHeader>
            <CardTitle>{playerData.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><strong>Town:</strong> {playerData.town?.name || 'None'}</div>
            <div><strong>Nation:</strong> {playerData.nation?.name || 'None'}</div>
            <div><strong>Online:</strong> {playerData.status?.isOnline ? 'Yes' : 'No'}</div>
          </CardContent>
        </Card>
      ) : hasSearched ? (
        <div>No player data available.</div>
      ) : null}
    </div>
  );
};

export default PlayerLookup;
