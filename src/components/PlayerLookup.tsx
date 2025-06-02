import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-react';

const PlayerLookup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlayer = async () => {
    setLoading(true);
    setError(null);
    setPlayerData(null);
    try {
      const response = await fetch('https://api.earthmc.net/v3/aurora/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: [searchTerm.trim()] }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch player data');
      }
      const playersData = await response.json();
      if (!playersData || playersData.length === 0) {
        throw new Error('Player not found');
      }
      setPlayerData(playersData[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Player not found');
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black/40 border-green-500/20 text-white">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Player Lookup</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter player name or UUID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchPlayer()}
            className="bg-gray-800/50 border-gray-600 text-white"
          />
          <Button onClick={searchPlayer} disabled={loading || !searchTerm.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {playerData && (
          <div className="space-y-2">
            <div>
              <span className="font-bold text-green-400">{playerData.name}</span>
              <span className="ml-2 text-xs text-gray-400">({playerData.uuid})</span>
            </div>
            <div>Title: {playerData.title || 'None'}</div>
            <div>Surname: {playerData.surname || 'None'}</div>
            <div>Balance: <span className="text-green-400">${playerData.stats?.balance || 0}</span></div>
            <div>Nation: {playerData.nation?.name || 'None'}</div>
            <div>Town: {playerData.town?.name || 'None'}</div>
            <div>Online: {playerData.status?.isOnline ? 'Yes' : 'No'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerLookup;