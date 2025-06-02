'use client';

import { useEffect, useState } from 'react';
import { Town } from '@/types/town';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

const ServerStatus = () => {
  const [serverData, setServerData] = useState<any>(null);
  const [topTowns, setTopTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const serverResponse = await fetch('https://api.earthmc.net/v3/aurora/');
      if (!serverResponse.ok) throw new Error('Failed to fetch server data');
      const serverInfo = await serverResponse.json();
      setServerData(serverInfo);

      const townsResponse = await fetch('https://api.earthmc.net/v3/aurora/towns');
      if (!townsResponse.ok) throw new Error('Failed to fetch towns list');
      const townList = await townsResponse.json();

      const detailedRes = await fetch('https://api.earthmc.net/v3/aurora/towns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: townList.slice(0, 100).map((t: any) => t.name) })
      });

      if (!detailedRes.ok) throw new Error('Failed to fetch detailed town data');
      const detailedTowns = await detailedRes.json();

      const sortedTowns = detailedTowns
        .sort((a: Town, b: Town) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 10);

      setTopTowns(sortedTowns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Server Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div><strong>Online Players:</strong> {serverData?.players?.online}</div>
              <div><strong>Uptime:</strong> {serverData?.uptime}</div>
              <div><strong>TPS:</strong> {serverData?.tps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Richest Towns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {topTowns.map((town, idx) => (
                <div key={town.uuid}>
                  <strong>#{idx + 1} {town.name}</strong> — {town.balance}g
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ServerStatus;
