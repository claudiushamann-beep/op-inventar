import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Psychology as PsychologyIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { instrumentApi, herstellerApi } from '@/utils/api';
import { Instrument, Hersteller, Rolle, KiInstrumentResult } from '@/types';
import { KiSearchDialog } from '@/components/KiSearchDialog';

const canManage = (rolle: Rolle) => ['OP_MANAGER', 'AEMP_MITARBEITER'].includes(rolle);

export const InstrumentePage: React.FC = () => {
  const { user } = useAuth();
  const [instrumente, setInstrumente] = useState<Instrument[]>([]);
  const [hersteller, setHersteller] = useState<Hersteller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kiDialogOpen, setKiDialogOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });
  const [formData, setFormData] = useState({
    artikelNr: '',
    bezeichnung: '',
    beschreibung: '',
    herstellerId: ''
  });
  const [bildDatei, setBildDatei] = useState<File | null>(null);
  const [bildPreview, setBildPreview] = useState<string | null>(null);
  const bildInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [instRes, herRes] = await Promise.all([
        instrumentApi.getAll(),
        herstellerApi.getAll()
      ]);
      setInstrumente(instRes.data);
      setHersteller(herRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstrumente = instrumente.filter(inst =>
    inst.bezeichnung.toLowerCase().includes(search.toLowerCase()) ||
    inst.artikelNr.toLowerCase().includes(search.toLowerCase()) ||
    inst.hersteller?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedInstrument(null);
    setFormData({ artikelNr: '', bezeichnung: '', beschreibung: '', herstellerId: '' });
    setBildDatei(null);
    setBildPreview(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (inst: Instrument) => {
    setSelectedInstrument(inst);
    setFormData({
      artikelNr: inst.artikelNr,
      bezeichnung: inst.bezeichnung,
      beschreibung: inst.beschreibung || '',
      herstellerId: inst.herstellerId
    });
    setBildDatei(null);
    setBildPreview(inst.bildPfad || null);
    setDialogOpen(true);
  };

  const handleKiApply = async (result: KiInstrumentResult) => {
    // Find or pre-fill herstellerId by matching name
    const matchedHersteller = hersteller.find(h =>
      h.name.toLowerCase() === result.hersteller.toLowerCase()
    );
    setFormData(prev => ({
      ...prev,
      artikelNr: result.artikelNr || prev.artikelNr,
      bezeichnung: result.bezeichnung || prev.bezeichnung,
      beschreibung: result.beschreibung || prev.beschreibung,
      herstellerId: matchedHersteller?.id || prev.herstellerId
    }));
    if (result.bildUrl) {
      setBildPreview(result.bildUrl);
      setBildDatei(null); // URL, kein File-Upload
    }
  };

  const handleOpenDelete = (inst: Instrument) => {
    setSelectedInstrument(inst);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Determine bildPfad: external URL from KI, or will be set via upload
      const saveData: Record<string, unknown> = { ...formData };
      const isExternalUrl = bildPreview && !bildDatei && bildPreview.startsWith('http');
      if (isExternalUrl) {
        saveData.bildPfad = bildPreview;
      }

      let instrumentId: string;
      if (selectedInstrument) {
        const res = await instrumentApi.update(selectedInstrument.id, saveData);
        instrumentId = res.data.id;
        setSnackbar({ open: true, message: 'Instrument aktualisiert', severity: 'success' });
      } else {
        const res = await instrumentApi.create(saveData);
        instrumentId = res.data.id;
        setSnackbar({ open: true, message: 'Instrument erstellt', severity: 'success' });
      }

      // Upload local image file if present
      if (bildDatei) {
        await instrumentApi.uploadBild(instrumentId, bildDatei);
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Speichern', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedInstrument) return;
    try {
      await instrumentApi.delete(selectedInstrument.id);
      setSnackbar({ open: true, message: 'Instrument gelöscht', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Löschen', severity: 'error' });
    }
  };

  if (loading) return <Typography>Laden...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Instrumente suchen..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }}
          sx={{ width: 300 }}
        />
        {user && canManage(user.rolle) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<PsychologyIcon />} onClick={() => setKiDialogOpen(true)}>
              KI-Suche
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Neues Instrument
            </Button>
          </Box>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bild</TableCell>
              <TableCell>Artikel-Nr.</TableCell>
              <TableCell>Bezeichnung</TableCell>
              <TableCell>Hersteller</TableCell>
              <TableCell>Beschreibung</TableCell>
              {user && canManage(user.rolle) && <TableCell align="right">Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInstrumente.map((inst) => (
              <TableRow key={inst.id} hover>
                <TableCell>
                  <Avatar variant="rounded" sx={{ width: 50, height: 50 }}>
                    {inst.bildPfad ? (
                      <img src={inst.bildPfad} alt={inst.bezeichnung} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon />
                    )}
                  </Avatar>
                </TableCell>
                <TableCell><Chip label={inst.artikelNr} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell><Typography fontWeight="medium">{inst.bezeichnung}</Typography></TableCell>
                <TableCell>{inst.hersteller?.name || '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inst.beschreibung || '-'}
                  </Typography>
                </TableCell>
                {user && canManage(user.rolle) && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(inst)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDelete(inst)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedInstrument ? 'Instrument bearbeiten' : 'Neues Instrument'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Hersteller</InputLabel>
            <Select value={formData.herstellerId} label="Hersteller" onChange={(e) => setFormData({ ...formData, herstellerId: e.target.value })} required>
              {hersteller.map((h) => (
                <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Artikel-Nr." value={formData.artikelNr} onChange={(e) => setFormData({ ...formData, artikelNr: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Bezeichnung" value={formData.bezeichnung} onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Beschreibung" value={formData.beschreibung} onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })} margin="normal" multiline rows={3} />

          {/* Bild-Upload */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">Produktbild</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 0.5 }}>
              {bildPreview && (
                <Box
                  component="img"
                  src={bildPreview}
                  alt="Vorschau"
                  sx={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <input
                ref={bildInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setBildDatei(f);
                    const reader = new FileReader();
                    reader.onload = (ev) => setBildPreview(ev.target?.result as string);
                    reader.readAsDataURL(f);
                  }
                }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => bildInputRef.current?.click()}
              >
                Bild hochladen
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.artikelNr || !formData.bezeichnung || !formData.herstellerId}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <KiSearchDialog
        open={kiDialogOpen}
        onClose={() => setKiDialogOpen(false)}
        onApply={(result) => {
          handleOpenCreate();
          handleKiApply(result);
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Instrument löschen?</DialogTitle>
        <DialogContent><Typography>Instrument "{selectedInstrument?.bezeichnung}" wirklich löschen?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Löschen</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
