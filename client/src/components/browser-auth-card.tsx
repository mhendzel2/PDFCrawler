import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrowserAuthCardProps {
  downloadFolder: string;
}

export function BrowserAuthCard({ downloadFolder }: BrowserAuthCardProps) {
  const [sessionData, setSessionData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const { toast } = useToast();

  const extractionScript = `// Run this in your browser console while logged into EZProxy
function exportEZProxySession() {
    const cookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.includes('ezproxy') || c.includes('session') || c.includes('auth'));
    
    const sessionData = {
        cookies: cookies.join('; '),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        domain: window.location.hostname
    };
    
    console.log('Copy this session data:');
    console.log(JSON.stringify(sessionData, null, 2));
    return sessionData;
}

exportEZProxySession();`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(extractionScript);
    toast({
      title: "Script copied",
      description: "Paste this in your browser console while logged into EZProxy"
    });
  };

  const handleSaveSession = async () => {
    if (!sessionData.trim()) {
      toast({
        title: "Session data required",
        description: "Please paste your browser session data",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Validate JSON format
      const parsed = JSON.parse(sessionData);
      
      if (!parsed.cookies || !parsed.timestamp) {
        throw new Error('Invalid session format');
      }

      // Save to download folder
      const response = await fetch('/api/save-browser-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      setSessionSaved(true);
      toast({
        title: "Session saved successfully",
        description: "Your browser session is now available for automated downloads"
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Invalid session data format",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const response = await fetch('/api/browser-session-status');
      const data = await response.json();
      setSessionSaved(data.hasValidSession);
    } catch (error) {
      console.error('Failed to check session status:', error);
    }
  };

  React.useEffect(() => {
    checkSessionStatus();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Browser Session Authentication
        </CardTitle>
        <CardDescription>
          Save your EZProxy browser session for automated PDF downloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionSaved ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Valid browser session active. PDFs will be downloaded automatically instead of generating instruction files.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No browser session detected. The system will generate instruction files with EZProxy URLs.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="extraction-script" className="text-sm font-medium">
              Step 1: Extract Browser Session
            </Label>
            <div className="mt-1">
              <div className="relative">
                <Textarea
                  id="extraction-script"
                  value={extractionScript}
                  readOnly
                  className="text-xs font-mono h-24 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyScript}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                1. Log into EZProxy in your browser
                2. Copy this script and run it in the browser console (F12)
                3. Copy the output JSON data
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="session-data" className="text-sm font-medium">
              Step 2: Paste Session Data
            </Label>
            <Textarea
              id="session-data"
              placeholder="Paste the JSON session data from your browser console here..."
              value={sessionData}
              onChange={(e) => setSessionData(e.target.value)}
              className="mt-1 h-24"
            />
          </div>

          <Button 
            onClick={handleSaveSession}
            disabled={isLoading || !sessionData.trim()}
            className="w-full"
          >
            {isLoading ? 'Saving Session...' : 'Save Browser Session'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Session Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Automatic PDF downloads from multiple publishers</li>
            <li>2-hour session duration (University policy)</li>
            <li>Secure local storage in: {downloadFolder}</li>
            <li>Fallback to instruction files if session expires</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}