
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Crown, DollarSign, Search, Loader2, AlertCircle } from 'lucide-react';
import ServerStatus from '@/components/ServerStatus';
import TownBrowser from '@/components/TownBrowser';
import PlayerLookup from '@/components/PlayerLookup';
import NationList from '@/components/NationList';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-green-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EarthMC Tracker</h1>
                <p className="text-green-400 text-sm">Real-time server statistics and data</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">earthmc.net</div>
              <div className="text-xs text-green-400">Live Data</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-green-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="towns" className="data-[state=active]:bg-green-600">
              Towns
            </TabsTrigger>
            <TabsTrigger value="nations" className="data-[state=active]:bg-green-600">
              Nations
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-green-600">
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ServerStatus />
              </div>
              <div className="space-y-6">
                <Card className="bg-black/40 border-green-500/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-green-400">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Server</span>
                        <span className="text-green-400">EarthMC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version</span>
                        <span>1.20.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Map</span>
                        <span>Aurora</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="towns" className="mt-6">
            <TownBrowser />
          </TabsContent>

          <TabsContent value="nations" className="mt-6">
            <NationList />
          </TabsContent>

          <TabsContent value="players" className="mt-6">
            <PlayerLookup />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-green-500/20 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p>© 2024 EarthMC Tracker - Unofficial fan site for earthmc.net</p>
            <p className="text-xs mt-2">Data refreshed every 5 minutes via EarthMC API</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
