import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { JOGO_PRINCIPAL_OPTIONS } from '@/components/admin/members/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProfileSettingsPage = () => {
  const { user, supabase, setUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    avatar_url: '',
    profile_games: [],
    primary_game: '',
    discord_id: '', 
  });
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableGames, setAvailableGames] = useState(JOGO_PRINCIPAL_OPTIONS);
  const [newGameInput, setNewGameInput] = useState('');

  const fetchProfile = useCallback(async () => {
    if (user && supabase) {
      setLoading(true);
      
      const { data: authUserData } = await supabase.auth.getUser();
      const currentAuthUser = authUserData.user;

      let discordIdFromAuth = '';
      if (currentAuthUser?.user_metadata?.identities) {
        const discordIdentity = currentAuthUser.user_metadata.identities.find(id => id.provider === 'discord');
        if (discordIdentity) {
          discordIdFromAuth = discordIdentity.id;
        }
      }

      setProfile(prev => ({
        ...prev,
        username: currentAuthUser?.user_metadata?.nick || currentAuthUser?.user_metadata?.user_name || currentAuthUser?.user_metadata?.name || '',
        email: currentAuthUser?.email || '',
        avatar_url: currentAuthUser?.user_metadata?.avatar_url || '',
        profile_games: currentAuthUser?.user_metadata?.profile_games || [],
        primary_game: currentAuthUser?.user_metadata?.primary_game || '',
        discord_id: discordIdFromAuth || prev.discord_id || currentAuthUser?.user_metadata?.discord_id || '',
      }));

      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatarFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({ ...prev, avatar_url: event.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGameToggle = (game) => {
    setProfile(prev => {
      const newGames = prev.profile_games.includes(game)
        ? prev.profile_games.filter(g => g !== game)
        : [...prev.profile_games, game];
      return { ...prev, profile_games: newGames };
    });
  };

  const handleAddNewGame = () => {
    if (newGameInput && !availableGames.includes(newGameInput)) {
      setAvailableGames(prev => [...prev, newGameInput]);
      handleGameToggle(newGameInput); 
      setNewGameInput('');
    } else if (availableGames.includes(newGameInput) && !profile.profile_games.includes(newGameInput)) {
      handleGameToggle(newGameInput);
      setNewGameInput('');
    }
  };

  const handlePrimaryGameChange = (value) => {
    setProfile(prev => ({ ...prev, primary_game: value }));
  };

  const handleSaveProfile = async () => {
    if (!user || !supabase) return;
    setIsSaving(true);

    let newAvatarSupabaseUrl = profile.avatar_url;

    if (newAvatarFile) {
      const fileExt = newAvatarFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, { upsert: true });

      if (uploadError) {
        toast({ title: "Erro ao fazer upload do avatar", description: uploadError.message, variant: "destructive" });
        setIsSaving(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      newAvatarSupabaseUrl = urlData.publicUrl;
    }
    
    const updates = {
      data: {
        nick: profile.username,
        avatar_url: newAvatarSupabaseUrl,
        user_name: profile.username, 
        name: profile.username,
        profile_games: profile.profile_games,
        primary_game: profile.primary_game,
        discord_id: profile.discord_id, 
      }
    };

    if (profile.email && profile.email !== user.email) {
      updates.email = profile.email;
    }
  
    const { data: updatedUser, error: updateUserError } = await supabase.auth.updateUser(updates);
  
    if (updateUserError) {
      toast({ title: "Erro ao atualizar perfil", description: updateUserError.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
      setUser(updatedUser.user); 
      setProfile(prev => ({
        ...prev,
        username: updatedUser.user.user_metadata.nick || updatedUser.user.user_metadata.user_name || '',
        avatar_url: updatedUser.user.user_metadata.avatar_url || '',
        profile_games: updatedUser.user.user_metadata.profile_games || [],
        primary_game: updatedUser.user.user_metadata.primary_game || '',
        discord_id: updatedUser.user.user_metadata.discord_id || '',
      }));
      setNewAvatarFile(null);
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
      className="container mx-auto py-12 px-4 md:px-8 max-w-3xl"
    >
      <Card className="glassmorphic border-primary/30">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-primary">Configurações de Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais e preferências de jogo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url || "https://images.unsplash.com/photo-1691398495617-18457fbf826d"}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                  key={profile.avatar_url}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary shadow-lg">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ImageIcon className="w-8 h-8 text-white" />
              </label>
              <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <p className="text-sm text-muted-foreground">Clique na imagem para alterar o avatar.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-muted-foreground">Nome de Usuário (Nick)</Label>
              <Input id="username" name="username" value={profile.username} onChange={handleInputChange} className="input-dark" />
            </div>
            <div>
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange} className="input-dark" />
            </div>
            <div>
              <Label htmlFor="discord_id" className="text-muted-foreground">Discord ID</Label>
              <Input id="discord_id" name="discord_id" value={profile.discord_id} onChange={handleInputChange} className="input-dark" placeholder="Seu ID do Discord (ex: usuario#1234 ou ID numérico)" />
              <p className="text-xs text-muted-foreground mt-1">Este ID é usado para integrações com o Discord. Se você logou com Discord, ele pode ter sido preenchido automaticamente.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Seus Jogos</h3>
            <div className="flex flex-wrap gap-3">
              {availableGames.map(game => (
                <Button
                  key={game}
                  variant={profile.profile_games.includes(game) ? "default" : "outline"}
                  onClick={() => handleGameToggle(game)}
                  className={`transition-all duration-200 ${profile.profile_games.includes(game) ? 'bg-primary text-primary-foreground ring-2 ring-primary-light' : 'border-primary/50 hover:bg-primary/10'}`}
                >
                  {game}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input 
                type="text" 
                value={newGameInput} 
                onChange={(e) => setNewGameInput(e.target.value)} 
                placeholder="Adicionar outro jogo..."
                className="input-dark flex-grow"
              />
              <Button onClick={handleAddNewGame} variant="secondary" className="btn-secondary-dark whitespace-nowrap">Adicionar Jogo</Button>
            </div>
          </div>

          <div>
            <Label htmlFor="primary_game_select" className="text-muted-foreground">Jogo Principal</Label>
            <Select value={profile.primary_game} onValueChange={handlePrimaryGameChange}>
              <SelectTrigger id="primary_game_select" className="input-dark">
                <SelectValue placeholder="Selecione seu jogo principal" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {profile.profile_games.length > 0 ? 
                  profile.profile_games.map(game => <SelectItem key={game} value={game}>{game}</SelectItem>) :
                  <SelectItem value="" disabled>Adicione jogos à sua lista primeiro</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full btn-primary-dark">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileSettingsPage;
