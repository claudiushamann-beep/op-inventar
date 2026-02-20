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
  Avatar,
  Card,
  CardMedia
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { instrumentApi, herstellerApi } from '@/utils/api';
import { Instrument, Hersteller, Rolle } from '@/types';

const canManage = (rolle: Rolle) => ['OP_MANAGER', 'AEMP_MITARBEITER'].includes(rolle);

export const InstrumentePage: React.FC = () => {
  const { user } = useAuth();
  const [instrumente, setInstrumente] = useState<Instrument[]>([]);
  const [hersteller, setHersteller] = useState<Hersteller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    setDialogOpen(true);
  };

  const handleOpenDelete = (inst: Instrument) => {
    setSelectedInstrument(inst);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedInstrument) {
        await instrumentApi.update(selectedInstrument.id, formData);
        setSnackbar({ open: true, message: 'Instrument aktualisiert', severity: 'success' });
      } else {
        await instrumentApi.create(formData);
        setSnackbar({ open: true, message: 'Instrument erstellt', severity: 'success' });
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Neues Instrument
          </Button>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.artikelNr || !formData.bezeichnung || !formData.herstellerId}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

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
