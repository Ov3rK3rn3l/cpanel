import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

const OnlineMembersCard = ({ onlineUsers, isLoading }) => {
    const usersArray = Object.values(onlineUsers || {}).map(u => u[0]);

    return (
        <Card className="glassmorphic border-primary/30 h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
                    <div className="relative flex items-center mr-2">
                        <Users className="h-6 w-6 text-primary" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    Membros Online ({usersArray.length})
                </CardTitle>
                <CardDescription>Veja quem está no QG agora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto flex-grow custom-scrollbar pr-2">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                ) : usersArray.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Ninguém online no momento.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {usersArray.map((user, index) => (
                            <motion.div
                                key={user.codinome}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 bg-card/60 rounded-lg border border-primary/20 flex items-center gap-4"
                            >
                                <Avatar className="h-10 w-10 border-2 border-primary/50">
                                    <AvatarImage src={user.avatar_url} alt={user.codinome} />
                                    <AvatarFallback>{user.codinome?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-primary text-sm">{user.codinome}</h4>
                                    <p className="text-xs text-muted-foreground">{user.patente}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </CardContent>
        </Card>
    );
};

export default OnlineMembersCard;