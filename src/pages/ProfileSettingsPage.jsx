import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useProfileState from '@/hooks/useProfileState';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileEffects from '@/components/profile/ProfileEffects';
import ProfileGames from '@/components/profile/ProfileGames';
import ProfilePassword from '@/components/profile/ProfilePassword';

const ProfileSettingsPage = () => {
    const { user, supabase, setUser } = useAuth();
    const { toast } = useToast();
    
    const {
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
    } = useProfileState(user, supabase, setUser, toast);

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
            <ProfileForm
                profile={profile}
                setProfile={setProfile}
                isSaving={isSaving}
                onSave={handleSaveProfile}
            >
                <ProfileAvatar
                    profile={profile}
                    setProfile={setProfile}
                    setNewAvatarFile={setNewAvatarFile}
                    activeEffectId={activeEffectId}
                    ownedEffects={ownedEffects}
                />
            </ProfileForm>

            {ownedEffects.length > 0 && (
                <ProfileEffects
                    ownedEffects={ownedEffects}
                    activeEffectId={activeEffectId}
                    isEffectLoading={isEffectLoading}
                    onSetEffect={handleSetEffect}
                />
            )}

            <ProfileGames
                profile={profile}
                setProfile={setProfile}
                isSaving={isSaving}
                onSave={handleSaveProfile}
            />

            <ProfilePassword
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isSaving={isSaving}
                onChangePassword={handleChangePassword}
            />
        </motion.div>
    );
};

export default ProfileSettingsPage;