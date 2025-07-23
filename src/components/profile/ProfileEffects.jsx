import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfileEffects = ({ ownedEffects, activeEffectId, isEffectLoading, onSetEffect }) => {
    return (
        <Card className="glassmorphic border-primary/30 mt-8">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary flex items-center"><Sparkles className="mr-3" />Gerenciar Efeitos Visuais</CardTitle>
                <CardDescription>Ative, desative ou troque o efeito visual do seu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ownedEffects.map(effect => (
                    <div key={effect.id} className="relative">
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full h-24 flex flex-col items-center justify-center gap-2 border-2",
                                activeEffectId === effect.id ? 'border-primary bg-primary/20' : 'border-muted'
                            )}
                            onClick={() => onSetEffect(effect.id)}
                            disabled={isEffectLoading}
                        >
                            <div className={cn("w-10 h-10 rounded-full", effect.css_class)}></div>
                            <span className="text-xs text-center">{effect.name}</span>
                        </Button>
                    </div>
                ))}
                <Button
                    variant="outline"
                    className={cn(
                        "w-full h-24 flex flex-col items-center justify-center gap-2 border-2",
                        activeEffectId === null ? 'border-primary bg-primary/20' : 'border-muted'
                    )}
                    onClick={() => onSetEffect(null)}
                    disabled={isEffectLoading}
                >
                    <XCircle className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-center">Nenhum</span>
                </Button>
            </CardContent>
        </Card>
    );
};

export default ProfileEffects;