import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Image as ImageIcon, Key, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';

const CLAN_GAMES = [
    { name: 'Squad', id: 'squad' },
    { name: 'Hell Let Loose', id: 'hell-let-loose' },
    { name: 'Ready Or Not', id: 'ready-or-not' },
    { name: 'Arma 3', id: 'arma-3' },
    { name: 'Arma Reforger', id: 'arma-reforger' },
    { name: 'Squad 44', id: 'squad-44' },
];

const ProfileSettingsPage = () => {
    const { user, supabase, setUser } = useAuth();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState({
        codinome: '',
        email: '',
        discord_nick: '',
        steam_id: '',
        availability: '',
        biography: '',
        avatar_url: '',
        profile_games: [],
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [newAvatarFile, setNewAvatarFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (user) {
            setLoading(true);
            const { data: memberData, error } = await supabase
                .from('members')
                .select('codinome, discord_nick, steam_id, availability, biography, avatar_url, profile_games')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
            } else if (memberData) {
                setProfile(prev => ({
                    ...prev,
                    ...memberData,
                    email: user.email,
                    avatar_url: memberData.avatar_url || user.user_metadata.avatar_url,
                    profile_games: memberData.profile_games || [],
                }));
            } else {
                 setProfile(prev => ({
                    ...prev,
                    email: user.email,
                    avatar_url: user.user_metadata.avatar_url,
                }));
            }
            setLoading(false);
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfile(prev => ({ ...prev, avatar_url: event.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGameSelectionChange = (gameId) => {
        setProfile(prev => {
            const currentGames = prev.profile_games || [];
            const newGames = currentGames.includes(gameId)
                ? currentGames.filter(id => id !== gameId)
                : [...currentGames, gameId];
            return { ...prev, profile_games: newGames };
        });
    };
    
    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        
        let newAvatarPublicUrl = profile.avatar_url;
        
        if (newAvatarFile) {
            const fileExt = newAvatarFile.name.split('.').pop();
            const filePath = `${user.id}/${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, newAvatarFile, { upsert: true });

            if (uploadError) {
                toast({ title: "Erro no upload do avatar", description: uploadError.message, variant: "destructive" });
                setIsSaving(false);
                return;
            }
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            newAvatarPublicUrl = urlData.publicUrl;
        }

        const memberUpdates = {
            codinome: profile.codinome,
            discord_nick: profile.discord_nick,
            steam_id: profile.steam_id,
            availability: profile.availability,
            biography: profile.biography,
            avatar_url: newAvatarPublicUrl,
            profile_games: profile.profile_games,
        };
        
        const authUpdates = { data: { avatar_url: newAvatarPublicUrl } };
        if (profile.email && profile.email !== user.email) {
            authUpdates.email = profile.email;
        }

        const { data: { user: updatedAuthUser }, error: authUpdateError } = await supabase.auth.updateUser(authUpdates);

        if (authUpdateError) {
            toast({ title: "Erro ao atualizar autenticação", description: authUpdateError.message, variant: "destructive" });
            setIsSaving(false);
            return;
        }
        
        const { error: memberUpdateError } = await supabase
            .from('members')
            .update(memberUpdates)
            .eq('user_id', user.id);
            
        if (memberUpdateError) {
            toast({ title: "Erro ao salvar perfil", description: memberUpdateError.message, variant: "destructive" });
        } else {
             setUser(updatedAuthUser);
             toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
        }
        
        setIsSaving(false);
    };

    const handleChangePassword = async () => {
        if (password !== confirmPassword) {
            toast({ title: "As senhas não coincidem", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            toast({ title: "Erro ao alterar a senha", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Senha alterada com sucesso!" });
            setPassword('');
            setConfirmPassword('');
        }
        setIsSaving(false);
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-12 px-4 md:px-8 max-w-4xl"
        >
            <Card className="glassmorphic border-primary/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold text-primary">Meu Perfil</CardTitle>
                    <CardDescription>Gerencie suas informações e mantenha seus dados atualizados.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 flex flex-col items-center pt-6">
                        <div className="relative group">
                            <img 
                                src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.codinome}
                                alt="Avatar do usuário"
                                className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow-lg"
                                key={profile.avatar_url}
                             />
                            <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ImageIcon className="w-8 h-8 text-white" />
                            </label>
                            <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-4 text-center">Clique na imagem para alterar o avatar.</p>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <Label htmlFor="codinome">Nick (In-Game)</Label>
                            <Input id="codinome" name="codinome" value={profile.codinome} onChange={handleInputChange} className="input-dark" />
                        </div>
                        <div>
                            <Label htmlFor="discord_nick">Nick (Discord)</Label>
                            <Input id="discord_nick" name="discord_nick" value={profile.discord_nick} onChange={handleInputChange} className="input-dark" />
                        </div>
                        <div>
                            <Label htmlFor="steam_id">Steam ID</Label>
                            <Input id="steam_id" name="steam_id" value={profile.steam_id} onChange={handleInputChange} className="input-dark" placeholder="Ex: 76561197960287930"/>
                        </div>
                        <div>
                           <Label htmlFor="steam_profile">Perfil Steam</Label>
                           <a href={`https://steamcommunity.com/profiles/${profile.steam_id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mt-1">
                                {profile.steam_id ? `Ver perfil Steam` : 'N/D'}
                           </a>
                        </div>
                        <div>
                            <Label htmlFor="availability">Disponibilidade para Jogar</Label>
                            <Input id="availability" name="availability" value={profile.availability} onChange={handleInputChange} placeholder="Ex: Noites e Finais de Semana" className="input-dark" />
                        </div>
                         <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange} className="input-dark" />
                        </div>
                         <div>
                            <Label htmlFor="biography">Biografia</Label>
                            <Textarea id="biography" name="biography" value={profile.biography} onChange={handleInputChange} className="input-dark h-24" placeholder="Conte um pouco sobre você..." />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full btn-primary-dark">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Informações
                    </Button>
                </CardFooter>
            </Card>

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
                     <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full btn-primary-dark">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Jogos
                    </Button>
                </CardFooter>
            </Card>

            <Card className="glassmorphic border-primary/30 mt-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary flex items-center"><Key className="mr-3" />Alterar Senha</CardTitle>
                    <CardDescription>Para sua segurança, escolha uma senha forte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="password">Nova Senha</Label>
                        <div className="relative">
                            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-dark" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleChangePassword} disabled={isSaving} className="w-full btn-primary-dark">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Alterar Senha
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default ProfileSettingsPage;