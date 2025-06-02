import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Users, AlertCircle } from 'lucide-react';

const ServerStatus = () => {
  const [serverData, setServerData] = useState<any>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);
  const [showOnline, setShowOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServer = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://api.earthmc.net/v3/aurora/');
        if (!res.ok) throw new Error('Failed to fetch server data');
        const data = await res.json();
        setServerData(data);

        // Fetch online players
        const playersRes = await fetch('https://api.earthmc.net/v3/aurora/players');
        if (playersRes.ok) {
          const players = await playersRes.json();
          // If you have online status, filter here. Otherwise, show all.
          setOnlinePlayers(players.map((p: any) => p.name));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchServer();
  }, []);

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading server status: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-blue-500/20 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Server Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !serverData ? (
          <div>Loading...</div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span>Online Players:</span>
              <span className="font-bold text-green-400">{serverData.stats?.numOnlinePlayers || 0}</span>
              <button
                className="flex items-center text-blue-400 hover:underline"
                onClick={() => setShowOnline(v => !v)}
              >
                {showOnline ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showOnline ? 'Hide' : 'Show'} Online Players
              </button>
            </div>
            {showOnline && (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white max-h-48 overflow-y-auto">
                {onlinePlayers.map(name => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            )}
            <div className="mt-4">
              <div>Server Version: <span className="font-mono">{serverData.version}</span></div>
              <div>Moon Phase: <span className="font-mono">{serverData.moonPhase}</span></div>
              <div>Max Players: <span className="font-mono">{serverData.stats?.maxPlayers}</span></div>
              <div>Total Residents: <span className="font-mono">{serverData.stats?.numResidents}</span></div>
              <div>Total Towns: <span className="font-mono">{serverData.stats?.numTowns}</span></div>
              <div>Total Nations: <span className="font-mono">{serverData.stats?.numNations}</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerStatus;