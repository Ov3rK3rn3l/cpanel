import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Gamepad2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const CLAN_GAMES = [
    { name: 'Squad', id: 'squad' },
    { name: 'Hell Let Loose', id: 'hell-let-loose' },
    { name: 'Ready Or Not', id: 'ready-or-not' },
    { name: 'Arma 3', id: 'arma-3' },
    { name: 'Arma Reforger', id: 'arma-reforger' },
    { name: 'Squad 44', id: 'squad-44' },
];

const ProfileGames = ({ profile, setProfile, isSaving, onSave }) => {
    const handleGameSelectionChange = (gameId) => {
        setProfile(prev => {
            const currentGames = prev.profile_games || [];
            const newGames = currentGames.includes(gameId)
                ? currentGames.filter(id => id !== gameId)
                : [...currentGames, gameId];
            return { ...prev, profile_games: newGames };
        });
    };

    return (
        <Card className="glassmorphic border-primary/30 mt-8">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary flex items-center"><Gamepad2 className="mr-3" />Meus Jogos</CardTitle>
                <CardDescription>Marque os jogos do clã que você possui.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CLAN_GAMES.map(game => (
                    <div key={game.id} className="flex items-center space-x-2 p-2 rounded-md bg-card/50">
                        <Checkbox
                            id={game.id}
                            checked={(profile.profile_games || []).includes(game.id)}
                            onCheckedChange={() => handleGameSelectionChange(game.id)}
                        />
                        <label
                            htmlFor={game.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {game.name}
                        </label>
                    </div>
                ))}
            </CardContent>
             <CardFooter>
                 <Button onClick={onSave} disabled={isSaving} className="w-full btn-primary-dark">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Jogos
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProfileGames;