import React from 'react';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfileAvatar = ({ profile, setProfile, setNewAvatarFile, activeEffectId, ownedEffects }) => {
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

    return (
        <div className="md:col-span-1 flex flex-col items-center pt-6">
            <div className="relative group">
                <div className={cn("w-40 h-40 rounded-full border-4 border-primary shadow-lg", activeEffectId && ownedEffects.find(e => e.id === activeEffectId)?.css_class)}>
                    <img 
                        src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.codinome}
                        alt="Avatar do usuário"
                        className="w-full h-full rounded-full object-cover"
                        key={profile.avatar_url}
                     />
                 </div>
                <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ImageIcon className="w-8 h-8 text-white" />
                </label>
                <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">Clique na imagem para alterar o avatar.</p>
        </div>
    );
};

export default ProfileAvatar;