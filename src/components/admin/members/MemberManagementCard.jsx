import React from 'react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Loader2, UploadCloud, DownloadCloud } from 'lucide-react';

    const MemberManagementCard = ({ onSync, onLoad, isSyncing, spreadsheetId, sheetName }) => {
      return (
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Integração com Google Sheets</CardTitle>
            <CardDescription>
              Sincronize ou carregue membros da sua planilha Google Sheets (Nome: "{sheetName || 'N/A'}").
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onSync} className="btn-secondary-dark w-full sm:w-auto" disabled={isSyncing || !spreadsheetId}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Sincronizar para Sheets
            </Button>
            <Button onClick={onLoad} className="btn-outline-dark w-full sm:w-auto" disabled={isSyncing || !spreadsheetId}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
              Carregar do Sheets
            </Button>
          </CardContent>
          {!spreadsheetId && (
            <CardContent className="pt-2">
              <p className="text-sm text-destructive">Atenção: VITE_GOOGLE_SPREADSHEET_ID não configurado. Integração desabilitada.</p>
            </CardContent>
          )}
        </Card>
      );
    };

    export default MemberManagementCard;