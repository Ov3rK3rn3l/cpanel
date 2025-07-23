import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ScanLine, User, Gamepad2, Users, AlertTriangle, ShieldCheck, ShieldOff, ShieldAlert, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SteamScannerPage = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [ownedGames, setOwnedGames] = useState(null);
  const [friendList, setFriendList] = useState(null);
  const [playerBans, setPlayerBans] = useState(null);
  const [scanError, setScanError] = useState(null);

  const callSteamProxy = useCallback(async (endpoint, params) => {
    const { data, error } = await supabase.functions.invoke('steam-api-proxy', {
        body: { endpoint, ...params },
    });
    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    return data;
  }, [supabase]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!steamId) {
        toast({ title: "SteamID Inválido", description: "Por favor, insira um SteamID64 válido.", variant: "destructive" });
        return;
    }
    setLoading(true);
    setProfileData(null);
    setOwnedGames(null);
    setFriendList(null);
    setPlayerBans(null);
    setScanError(null);

    try {
        const playerSummaryPromise = callSteamProxy('GetPlayerSummaries', { steamid: steamId });
        const ownedGamesPromise = callSteamProxy('GetOwnedGames', { steamid: steamId });
        const friendListPromise = callSteamProxy('GetFriendList', { steamid: steamId });
        const playerBansPromise = callSteamProxy('GetPlayerBans', { steamid: steamId });

        const [playerSummaryResult, gamesResult, friendsResult, bansResult] = await Promise.allSettled([
            playerSummaryPromise,
            ownedGamesPromise,
            friendListPromise,
            playerBansPromise,
        ]);

        let hasCriticalError = false;

        if (playerSummaryResult.status === 'fulfilled' && playerSummaryResult.value?.steamid) {
            setProfileData(playerSummaryResult.value);
        } else {
            const errorMessage = playerSummaryResult.reason?.message || 'Não foi possível obter os dados do perfil. Verifique o SteamID e tente novamente.';
            setScanError(errorMessage);
            toast({ title: "Erro Crítico", description: errorMessage, variant: "destructive" });
            hasCriticalError = true;
        }

        if (gamesResult.status === 'fulfilled') setOwnedGames(gamesResult.value);
        else setOwnedGames({ error: gamesResult.reason?.message || "Não foi possível carregar os jogos." });
        
        if (friendsResult.status === 'fulfilled') setFriendList(friendsResult.value);
        else setFriendList({ error: friendsResult.reason?.message || "Não foi possível carregar a lista de amigos." });

        if (bansResult.status === 'fulfilled') setPlayerBans(bansResult.value);
        else setPlayerBans({ error: bansResult.reason?.message || "Não foi possível carregar informações de banimento." });
        
        if (hasCriticalError) {
           setProfileData(null);
        }

    } catch (err) {
        console.error("Erro inesperado ao buscar dados da Steam:", err.message);
        setScanError(err.message || "Ocorreu um erro desconhecido.");
        toast({ title: "Erro na Busca", description: err.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };
  
  const personaState = [
    "Offline", "Online", "Ocupado", "Ausente", "Soneca", "Procurando para trocar", "Procurando para jogar"
  ];
  
  const renderGameImage = (game) => {
    return <img  alt={game.name} class="w-16 h-8 object-cover rounded" src="https://images.unsplash.com/photo-1543882501-9251a94dc7c3" />;
  };

  const BanStatus = ({ label, value, isBanned }) => (
    <div className={`flex justify-between items-center p-2 rounded ${isBanned ? 'bg-red-500/20' : 'bg-green-500/10'}`}>
        <div className="flex items-center">
            {isBanned ? <ShieldAlert className="w-5 h-5 mr-2 text-red-400" /> : <ShieldCheck className="w-5 h-5 mr-2 text-green-400" />}
            <span className="font-medium">{label}</span>
        </div>
        <span className={`font-bold ${isBanned ? 'text-red-400' : 'text-green-400'}`}>{value}</span>
    </div>
  );

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-12 px-4 md:px-8"
    >
        <Card className="glassmorphic-dark border-primary/40 shadow-2xl">
            <CardHeader className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1}} transition={{ delay: 0.2, type: 'spring' }}>
                    <ScanLine className="mx-auto h-16 w-16 text-primary animate-pulse" />
                </motion.div>
                <CardTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Steam Profile Scanner</CardTitle>
                <CardDescription className="text-muted-foreground text-lg">
                    Insira um SteamID64 para obter informações públicas de um perfil, incluindo status de banimentos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto">
                    <Input
                        type="text"
                        value={steamId}
                        onChange={(e) => setSteamId(e.target.value)}
                        placeholder="Ex: 76561197960287930"
                        className="input-dark text-center text-lg flex-grow"
                    />
                    <Button type="submit" disabled={loading} className="btn-primary-dark w-full sm:w-auto">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ScanLine className="mr-2 h-5 w-5" />}
                        Escanear Perfil
                    </Button>
                </form>
            </CardContent>
        </Card>

        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center mt-12"
                >
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="mt-4 text-xl text-muted-foreground">Buscando dados na Matrix da Steam...</p>
                </motion.div>
            )}

            {scanError && !loading && (
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-12"
                >
                    <Card className="max-w-md mx-auto bg-destructive/10 border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center justify-center">
                                <AlertTriangle className="mr-2"/> Erro na Operação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive-foreground">{scanError}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {profileData && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                >
                    {/* Profile Card */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
                        <Card className="glassmorphic h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center text-primary"><User className="mr-2"/> Perfil</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center text-center">
                                <img alt="Avatar do usuário Steam" className="w-32 h-32 rounded-full border-4 border-primary shadow-lg mb-4 object-cover" src={profileData.avatarfull} />
                                <h3 className="text-2xl font-bold">{profileData.personaname}</h3>
                                <p className="text-muted-foreground">{profileData.realname || 'Nome real não informado'}</p>
                                <a href={profileData.profileurl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Ver na Steam</a>

                                <div className="mt-4 w-full text-left space-y-2">
                                    <p><strong className="text-primary-light">Status:</strong> {personaState[profileData.personastate] || 'Desconhecido'}</p>
                                    <p><strong className="text-primary-light">Jogando:</strong> {profileData.gameextrainfo || 'Nenhum'}</p>
                                    <p><strong className="text-primary-light">País:</strong> {profileData.loccountrycode || 'Não informado'}</p>
                                    <p><strong className="text-primary-light">Desde:</strong> {profileData.timecreated ? new Date(profileData.timecreated * 1000).toLocaleDateString() : 'Não informado'}</p>
                                    <div className="flex items-center">
                                        <strong className="text-primary-light mr-2">Visibilidade:</strong> 
                                        {profileData.communityvisibilitystate === 3 ? <ShieldCheck className="text-green-500"/> : <ShieldOff className="text-red-500" />}
                                        <span className="ml-1">{profileData.communityvisibilitystate === 3 ? 'Público' : 'Privado/Amigos'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Security Status Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
                        <Card className="glassmorphic h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center text-primary"><Ban className="mr-2"/> Status de Segurança</CardTitle>
                                <CardDescription>
                                    Verificação de banimentos VAC e outros.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {playerBans && !playerBans.error ? (
                                    <>
                                        <BanStatus label="VAC Ban" value={playerBans.VACBanned ? "Sim" : "Não"} isBanned={playerBans.VACBanned} />
                                        <BanStatus label="Banimentos em Jogos" value={playerBans.NumberOfGameBans} isBanned={playerBans.NumberOfGameBans > 0} />
                                        <BanStatus label="Comunidade" value={playerBans.CommunityBanned ? "Banido" : "OK"} isBanned={playerBans.CommunityBanned} />
                                        <BanStatus label="Trocas" value={playerBans.EconomyBan !== 'none' ? "Banido" : "OK"} isBanned={playerBans.EconomyBan !== 'none'} />
                                        {playerBans.VACBanned && <p className="text-sm text-muted-foreground text-center pt-2">Último banimento há {playerBans.DaysSinceLastBan} dias.</p>}
                                    </>
                                ) : (
                                    <div className="text-center pt-8">
                                       <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                                       <p className="text-muted-foreground">{playerBans?.error || "Não foi possível carregar o status de banimento."}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Games Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 xl:col-span-1">
                         <Card className="glassmorphic h-full">
                             <CardHeader>
                                <CardTitle className="flex items-center text-primary"><Gamepad2 className="mr-2"/> Jogos</CardTitle>
                                <CardDescription>
                                    {ownedGames?.game_count ? `${ownedGames.game_count} jogos na biblioteca.` : ownedGames?.error ? '' : 'Informação de jogos não disponível.'}
                                </CardDescription>
                             </CardHeader>
                             <CardContent className="max-h-96 overflow-y-auto custom-scrollbar">
                                {ownedGames?.games && ownedGames.games.length > 0 ? (
                                    <ul className="space-y-3">
                                        {ownedGames.games
                                          .sort((a,b) => b.playtime_forever - a.playtime_forever)
                                          .slice(0, 50)
                                          .map(game => (
                                            <li key={game.appid} className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors">
                                                {renderGameImage(game)}
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{game.name || `AppID: ${game.appid}`}</p>
                                                    <p className="text-sm text-muted-foreground">{(game.playtime_forever / 60).toFixed(1)} horas jogadas</p>
                                                </div>
                                            </li>
                                        ))}
                                        {ownedGames.games.length > 50 && <p className="text-center mt-2 text-muted-foreground">... e mais {ownedGames.games.length - 50} jogos.</p>}
                                    </ul>
                                ) : (
                                    <div className="text-center pt-8">
                                       <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                                       <p className="text-muted-foreground">A lista de jogos é privada ou vazia.</p>
                                    </div>
                                )}
                             </CardContent>
                         </Card>
                    </motion.div>

                    {/* Friends Card */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 xl:col-span-3">
                        <Card className="glassmorphic h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center text-primary"><Users className="mr-2"/> Amigos</CardTitle>
                                 <CardDescription>
                                    {friendList?.friends?.length ? `${friendList.friends.length} amigos.` : friendList?.error ? '' : 'Informação de amigos não disponível.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-96 overflow-y-auto custom-scrollbar">
                                 {friendList?.friends && friendList.friends.length > 0 ? (
                                    <ul className="space-y-2">
                                        {friendList.friends.slice(0, 50).map(friend => (
                                            <li key={friend.steamid} className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors">
                                                <p className="font-semibold text-sm">{friend.steamid}</p>
                                                <p className="text-xs text-muted-foreground">Amigos desde: {new Date(friend.friend_since * 1000).toLocaleDateString()}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center pt-8">
                                       <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                                       <p className="text-muted-foreground">A lista de amigos é privada ou vazia.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
};

export default SteamScannerPage;