import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { kiApi } from '@/utils/api';
import { KiInstrumentResult } from '@/types';

interface KiSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: KiInstrumentResult) => void;
}

const QUICK_CHIPS = ['Aesculap Skalpell', 'Karl Storz Trokar', 'Stryker Klemme', 'B. Braun Nadelhalter'];

export const KiSearchDialog: React.FC<KiSearchDialogProps> = ({ open, onClose, onApply }) => {
  const [tab, setTab] = useState(0);

  // Tab 0: Textsuche
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KiInstrumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Bild hochladen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<KiInstrumentResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await kiApi.search(query.trim());
      setResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Fehler bei der KI-Suche');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setImageResult(null);
    setImageError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  }, [handleImageSelect]);

  const handleIdentify = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError(null);
    setImageResult(null);
    try {
      const res = await kiApi.identify(imageFile);
      setImageResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setImageError(e.response?.data?.error || 'Fehler bei der Bild-Erkennung');
    } finally {
      setImageLoading(false);
    }
  };

  const handleApply = (r: KiInstrumentResult) => {
    onApply(r);
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
    setImageError(null);
    onClose();
  };

  const ResultCard = ({ r }: { r: KiInstrumentResult }) => (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        {r.bildUrl && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Box
              component="img"
              src={r.bildUrl}
              alt={r.bezeichnung}
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </Box>
        )}
        <Typography variant="h6" gutterBottom>{r.bezeichnung}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip label={r.artikelNr} size="small" color="primary" variant="outlined" />
          <Chip label={r.hersteller} size="small" color="secondary" variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary">{r.beschreibung}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PsychologyIcon color="primary" />
        KI-Instrumentensuche
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Textsuche" />
        <Tab label="Bild hochladen" />
      </Tabs>

      <DialogContent>
        {/* Tab 0: Textsuche */}
        {tab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Instrument suchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              margin="normal"
              InputProps={{
                endAdornment: loading ? <CircularProgress size={20} /> : null
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {QUICK_CHIPS.map(chip => (
                <Chip
                  key={chip}
                  label={chip}
                  size="small"
                  clickable
                  onClick={() => setQuery(chip)}
                  variant="outlined"
                />
              ))}
            </Box>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? 'Suche läuft...' : 'KI-Suche starten'}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {result && <ResultCard r={result} />}
          </Box>
        )}

        {/* Tab 1: Bild hochladen */}
        {tab === 1 && (
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageSelect(f);
              }}
            />
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                mt: 2,
                p: 3,
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.400',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'primary.50' : 'grey.50',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
              }}
            >
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Vorschau"
                  sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }}
                />
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body1">Bild hier ablegen oder klicken</Typography>
                  <Typography variant="caption" color="text.secondary">JPEG, PNG, WebP · max. 10 MB</Typography>
                </>
              )}
            </Box>
            {imageFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {imageFile.name}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={imageLoading ? <CircularProgress size={18} color="inherit" /> : <PsychologyIcon />}
              onClick={handleIdentify}
              disabled={imageLoading || !imageFile}
              sx={{ mt: 2 }}
              fullWidth
            >
              {imageLoading ? 'KI analysiert...' : 'Instrument erkennen'}
            </Button>
            {imageError && <Alert severity="error" sx={{ mt: 2 }}>{imageError}</Alert>}
            {imageResult && <ResultCard r={imageResult} />}
          </Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!(tab === 0 ? result : imageResult)}
          onClick={() => handleApply((tab === 0 ? result : imageResult)!)}
        >
          In Formular übernehmen
        </Button>
      </DialogActions>
    </Dialog>
  );
};
