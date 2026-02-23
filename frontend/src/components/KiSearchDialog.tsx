import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { AutoAwesome as KiIcon, Search as SearchIcon } from '@mui/icons-material';
import { kiApi } from '@/utils/api';
import { KiSearchResult } from '@/types';

const QUICK_CHIPS = [
  'Aesculap Skalpell',
  'Karl Storz Trokar',
  'Stryker Klemme',
  'B. Braun Schere',
  'Olympus Zange'
];

interface KiSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: KiSearchResult) => void;
}

export const KiSearchDialog: React.FC<KiSearchDialogProps> = ({ open, onClose, onApply }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KiSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await kiApi.search(q.trim());
      setResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'KI-Suche fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    handleSearch(chip);
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KiIcon color="primary" />
        KI-Instrumentensuche
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="z.B. Aesculap Skalpell 15er"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
          >
            Suchen
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {QUICK_CHIPS.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              size="small"
              onClick={() => handleChipClick(chip)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {result && !loading && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="overline" color="primary">KI-Ergebnis</Typography>
              <Typography variant="h6" gutterBottom>{result.bezeichnung}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {result.artikelNr && (
                  <Chip label={`Art.-Nr.: ${result.artikelNr}`} size="small" color="primary" variant="outlined" />
                )}
                {result.hersteller && (
                  <Chip label={result.hersteller} size="small" variant="outlined" />
                )}
              </Box>
              {result.beschreibung && (
                <Typography variant="body2" color="text.secondary">
                  {result.beschreibung}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!result}
        >
          In Formular übernehmen
        </Button>
      </DialogActions>
    </Dialog>
  );
};
