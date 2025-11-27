import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4 Optimized', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4 Mini', provider: 'OpenAI' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'Google' },
  { value: 'claude-2', label: 'Claude 2', provider: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek', provider: 'DeepSeek' },
];

export default function Settings() {
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    // In production, this would save to backend
    localStorage.setItem('preferredModel', selectedModel);
    
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your AI assistant preferences</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Selection</CardTitle>
                <CardDescription>
                  Choose which AI model to use for responses. Different models have different capabilities and response times.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Preferred Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col items-start">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.provider}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Current selection: <span className="font-medium">{AI_MODELS.find(m => m.value === selectedModel)?.label}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  For local testing, you can provide your own API key. This is optional for production use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored securely and never shared.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Capabilities</CardTitle>
                <CardDescription>
                  Understanding different AI models and their strengths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium mb-1">GPT-4 Optimized</h4>
                    <p className="text-muted-foreground">
                      Best overall performance with advanced reasoning and comprehensive responses.
                    </p>
                  </div>
                  <div className="border-l-2 border-accent pl-4">
                    <h4 className="font-medium mb-1">GPT-4 Mini</h4>
                    <p className="text-muted-foreground">
                      Faster responses with good accuracy, ideal for quick queries.
                    </p>
                  </div>
                  <div className="border-l-2 border-muted pl-4">
                    <h4 className="font-medium mb-1">Gemini Pro & Others</h4>
                    <p className="text-muted-foreground">
                      Alternative models with unique strengths in specific domains.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
