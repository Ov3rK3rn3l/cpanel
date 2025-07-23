import { useState, useEffect, useCallback } from 'react';

const useProfileState = (user, supabase, setUser, toast) => {
    const [profile, setProfile] = useState({
        codinome: '',
        email: '',
        discord_nick: '',
        steam_id: '',
        availability: '',
        biography: '',
        avatar_url: '',
        profile_games: [],
        id: null
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [newAvatarFile, setNewAvatarFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [ownedEffects, setOwnedEffects] = useState([]);
    const [activeEffectId, setActiveEffectId] = useState(null);
    const [isEffectLoading, setIsEffectLoading] = useState(false);

    const fetchProfileAndEffects = useCallback(async () => {
        if (user) {
            setLoading(true);
            const { data: memberData, error } = await supabase
                .from('members')
                .select('id, codinome, discord_nick, steam_id, availability, biography, avatar_url, profile_games')
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

                const { data: effectsData, error: effectsError } = await supabase
                    .from('user_visual_effects')
                    .select('is_active, visual_effects(*)')
                    .eq('member_id', memberData.id);

                if (effectsError) {
                    toast({ title: "Erro ao carregar efeitos", description: effectsError.message, variant: "destructive" });
                } else {
                    setOwnedEffects(effectsData.map(e => e.visual_effects));
                    const activeEffect = effectsData.find(e => e.is_active);
                    setActiveEffectId(activeEffect ? activeEffect.visual_effects.id : null);
                }
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
        fetchProfileAndEffects();
    }, [fetchProfileAndEffects]);

    const handleSetEffect = async (effectId) => {
        setIsEffectLoading(true);
        const { data, error } = await supabase.rpc('set_active_visual_effect', {
            p_member_id: profile.id,
            p_effect_to_activate_id: effectId,
        });

        if (error || !data.success) {
            toast({ title: 'Erro ao alterar efeito', description: error?.message || data?.message, variant: 'destructive' });
        } else {
            setActiveEffectId(effectId);
            toast({ title: 'Efeito atualizado!', description: 'Seu novo efeito visual está ativo.' });
        }
        setIsEffectLoading(false);
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
        
        const authUpdates = { data: { avatar_url: newAvatarPublicUrl, name: profile.codinome } };
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

    return {
        profile,
        setProfile,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        showPassword,
        setShowPassword,
        newAvatarFile,
        setNewAvatarFile,
        loading,
        isSaving,
        ownedEffects,
        activeEffectId,
        isEffectLoading,
        handleSetEffect,
        handleSaveProfile,
        handleChangePassword,
    };
};

export default useProfileState;