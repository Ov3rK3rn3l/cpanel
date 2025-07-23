import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

const ProfileForm = ({ profile, setProfile, isSaving, onSave, children }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Card className="glassmorphic border-primary/30">
            <CardHeader>
                <CardTitle className="text-3xl font-semibold text-primary">Meu Perfil</CardTitle>
                <CardDescription>Gerencie suas informações e mantenha seus dados atualizados.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {children}
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
                 <Button onClick={onSave} disabled={isSaving} className="w-full btn-primary-dark">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Informações
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProfileForm;