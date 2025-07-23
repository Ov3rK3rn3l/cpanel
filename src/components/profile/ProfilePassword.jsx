import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Key, Eye, EyeOff } from 'lucide-react';

const ProfilePassword = ({ password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword, isSaving, onChangePassword }) => {
    return (
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
                <Button onClick={onChangePassword} disabled={isSaving || !password} className="w-full btn-primary-dark">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Alterar Senha
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProfilePassword;