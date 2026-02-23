import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Chip,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  VpnKey
} from '@mui/icons-material';
import { kiApi } from '@/utils/api';
import { KiSettings, KiTestResult } from '@/types';

const PROVIDER_LABELS: Record<string, { label: string; model: string; hint: string }> = {
  anthropic: { label: 'Anthropic (Claude)', model: 'claude-sonnet-4-6', hint: 'API-Key von console.anthropic.com' },
  openai: { label: 'OpenAI (GPT-4o)', model: 'gpt-4o', hint: 'API-Key von platform.openai.com' },
  google: { label: 'Google (Gemini)', model: 'gemini-1.5-pro', hint: 'API-Key von aistudio.google.com' }
};

export const EinstellungenPage: React.FC = () => {
  const [settings, setSettings] = useState<KiSettings | null>(null);
  const [provider, setProvider] = useState<string>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<KiTestResult | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => {
    kiApi.getSettings()
      .then(res => {
        setSettings(res.data);
        setProvider(res.data.provider);
      })
      .catch(() => {
        // Settings not accessible (non-OP_MANAGER user shouldn't reach this page)
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await kiApi.updateSettings({ provider, apiKey: apiKey || undefined });
      setSettings(prev => prev ? { ...prev, provider: provider as KiSettings['provider'], hasApiKey: !!(prev.hasApiKey || apiKey) } : null);
      setApiKey('');
      setSnackbar({ open: true, message: 'KI-Einstellungen gespeichert', severity: 'success' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: e.response?.data?.error || 'Fehler beim Speichern', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await kiApi.test();
      setTestResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setTestResult({ success: false, error: e.response?.data?.error || 'Verbindung fehlgeschlagen' });
    } finally {
      setTesting(false);
    }
  };

  const StatusChip = () => {
    if (!settings) return null;
    if (!settings.hasApiKey && !apiKey) {
      return <Chip icon={<VpnKey />} label="Key nicht gesetzt" color="default" size="small" />;
    }
    if (testResult === null) return null;
    if (testResult.success) {
      return <Chip icon={<CheckCircle />} label={`Verbunden — ${testResult.model}`} color="success" size="small" />;
    }
    return <Chip icon={<ErrorIcon />} label={`Fehler: ${testResult.error}`} color="error" size="small" sx={{ maxWidth: 320 }} />;
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">KI-Einstellungen</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Wählen Sie einen KI-Provider und hinterlegen Sie Ihren API-Key für die Instrumentensuche.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'medium' }}>KI-Provider</FormLabel>
          <RadioGroup
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setTestResult(null); }}
          >
            {Object.entries(PROVIDER_LABELS).map(([key, { label, model, hint }]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <FormControlLabel
                  value={key}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{model} · {hint}</Typography>
                    </Box>
                  }
                />
              </Box>
            ))}
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <TextField
          fullWidth
          label="API-Key"
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={settings?.hasApiKey ? '••••••••••••••••  (hinterlegt)' : 'Key eingeben...'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey(!showKey)} edge="end">
                  {showKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          helperText={settings?.hasApiKey && !apiKey ? 'Ein API-Key ist bereits hinterlegt. Neuen Key eingeben um zu ersetzen.' : ''}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={testing || (!settings?.hasApiKey && !apiKey)}
            startIcon={testing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {testing ? 'Teste...' : 'Verbindung testen'}
          </Button>
          <StatusChip />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
