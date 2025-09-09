import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Save, Eye, EyeOff } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  theme_mode: 'light' | 'dark';
  ai_model: string;
  ai_api_key: string;
}

interface AISettingsProps {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano', provider: 'OpenAI' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini', provider: 'OpenAI' },
  { value: 'gpt-4.1-nano-2025-04-14', label: 'GPT-4.1 Nano', provider: 'OpenAI' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1', provider: 'OpenAI' }
];

export function AISettings({ profile, setProfile, onSave, saving }: AISettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  if (!profile) return null;

  const handleModelChange = (newModel: string) => {
    setProfile({ ...profile, ai_model: newModel });
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setProfile({ ...profile, ai_api_key: newApiKey });
  };

  const selectedModel = AI_MODELS.find(model => model.value === profile.ai_model);

  const getApiKeyPlaceholder = () => {
    if (profile.ai_model?.startsWith('gpt-')) {
      return 'Cole aqui sua chave da API OpenAI';
    }
    return 'Cole aqui sua chave da API Google Gemini';
  };

  const getApiKeyHelp = () => {
    if (profile.ai_model?.startsWith('gpt-')) {
      return 'Obtenha sua chave em: https://platform.openai.com/api-keys';
    }
    return 'Obtenha sua chave em: https://aistudio.google.com/app/apikey';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Configurações de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ai-model">Modelo de IA</Label>
          <Select value={profile.ai_model || ''} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o modelo de IA" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span>{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.provider}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <p className="text-sm text-muted-foreground">
              Modelo: {selectedModel.label} ({selectedModel.provider})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">Chave da API</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={profile.ai_api_key || ''}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={getApiKeyPlaceholder()}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {getApiKeyHelp()}
          </p>
        </div>

        <Button onClick={onSave} disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações de IA'}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-semibold mb-2">ℹ️ Como usar:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Escolha o modelo de IA</li>
            <li>Cole sua chave de API</li>
            <li>Clique em "Salvar" acima</li>
            <li>Use no concierge de viagens</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}