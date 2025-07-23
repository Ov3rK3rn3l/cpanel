import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Users, Loader2, AlertTriangle, ShieldX, ExternalLink, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const CLAN_GAMES = [
    { name: 'Squad', id: 'squad' },
    { name: 'Hell Let Loose', id: 'hell-let-loose' },
    { name: 'Ready Or Not', id: 'ready-or-not' },
    { name: 'Arma 3', id: 'arma-3' },
    { name: 'Arma Reforger', id: 'arma-reforger' },
    { name: 'Squad 44', id: 'squad-44' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const GamePrice = ({ priceData }) => {
    if (!priceData) {
        return <span className="text-sm text-muted-foreground">Preço indisponível</span>;
    }

    const isFree = priceData.is_free;
    const onSale = priceData.discount_percent > 0;

    if (isFree) {
        return <span className="text-sm font-bold text-green-400">Gratuito</span>;
    }

    return (
        <div className="flex items-center gap-2">
            {onSale && (
                <span className="text-sm text-gray-400 line-through">{priceData.initial_formatted}</span>
            )}
            <span className="text-base font-bold text-primary-foreground">{priceData.final_formatted}</span>
        </div>
    );
};

const ClanGamesCard = () => {
    const { supabase } = useAuth();
    const { toast } = useToast();
    const [gamesData, setGamesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGamesData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select('codinome, avatar_url, profile_games')
                .is('data_saida', null)
                .neq('status', 'Desligado');

            if (membersError) throw membersError;

            const { data: steamData, error: steamError } = await supabase.functions.invoke('get-steam-game-details', {
                body: { gameNames: CLAN_GAMES.map(g => g.name) }
            });

            if (steamError) throw new Error(`Steam API Error: ${steamError.message}`);
            if (steamData.error) throw new Error(`Steam Function Error: ${steamData.error}`);

            const gamesWithDetails = CLAN_GAMES.map(game => {
                const owners = members.filter(member => 
                    Array.isArray(member.profile_games) && member.profile_games.includes(game.id)
                );
                const details = steamData[game.name] || {};
                return {
                    ...game,
                    owners,
                    steamDetails: details,
                };
            });

            setGamesData(gamesWithDetails);
        } catch (err) {
            console.error("Error fetching clan games data:", err);
            setError("Não foi possível carregar os dados dos jogos do clã.");
            toast({
                title: 'Erro ao carregar dados',
                description: err.message || 'Falha ao buscar dados dos jogos.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    useEffect(() => {
        fetchGamesData();
    }, [fetchGamesData]);

    if (loading) {
        return (
            <Card className="glassmorphic h-full">
                <CardHeader>
                    <CardTitle className="flex items-center text-primary"><Gamepad2 className="mr-2" /> Jogos do Clã</CardTitle>
                    <CardDescription>Buscando dados na Steam e perfis dos membros...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
             <Card className="glassmorphic h-full bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2" /> Erro</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-center items-center h-64 text-center">
                    <p className="text-destructive-foreground mb-4">{error}</p>
                    <Button onClick={fetchGamesData} variant="destructive">Tentar Novamente</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div variants={cardVariants}>
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center text-primary"><Gamepad2 className="mr-2" /> Jogos do Clã</CardTitle>
                    <CardDescription>Veja os principais jogos, preços na Steam e quem do clã os possui.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gamesData.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-card/50 hover:bg-primary/10 transition-all duration-300 h-full flex flex-col group border border-transparent hover:border-primary/30">
                                    <div className="relative">
                                        <div className="w-full h-32 rounded-t-lg overflow-hidden">
                                           {game.steamDetails?.header_image ? (
                                                <img src={game.steamDetails.header_image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    <Gamepad2 className="w-12 h-12 text-slate-600" />
                                                </div>
                                            )}
                                        </div>
                                        {game.steamDetails?.price_overview?.discount_percent > 0 && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                                                <Tag className="h-3 w-3 mr-1" /> -{game.steamDetails.price_overview.discount_percent}%
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{game.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <GamePrice priceData={game.steamDetails?.price_overview} />
                                                {game.steamDetails?.steam_appid && (
                                                    <a href={`https://store.steampowered.com/app/${game.steamDetails.steam_appid}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                                                        Ver na Steam <ExternalLink className="h-4 w-4 ml-1" />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3 flex items-center">
                                                <Users className="mr-2 h-4 w-4" /> {game.owners.length} membros possuem.
                                            </p>
                                        </div>
                                        {game.owners.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                {game.owners.slice(0, 7).map(owner => (
                                                    <div key={owner.codinome} className="group relative">
                                                        <img  
                                                            src={owner.avatar_url}
                                                            alt={owner.codinome} 
                                                            className="w-8 h-8 rounded-full border-2 border-primary/50 object-cover"
                                                         />
                                                         <span className="absolute bottom-full mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                            {owner.codinome}
                                                         </span>
                                                    </div>
                                                ))}
                                                {game.owners.length > 7 && (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                                        +{game.owners.length - 7}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-sm text-muted-foreground mt-auto">
                                                <ShieldX className="mr-2 h-4 w-4" />
                                                <span>Nenhum membro marcou este jogo.</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ClanGamesCard;