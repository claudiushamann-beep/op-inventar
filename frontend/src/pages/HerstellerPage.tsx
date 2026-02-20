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
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { herstellerApi } from '@/utils/api';
import { Hersteller, Rolle } from '@/types';

const canManage = (rolle: Rolle) => ['OP_MANAGER', 'AEMP_MITARBEITER'].includes(rolle);

export const HerstellerPage: React.FC = () => {
  const { user } = useAuth();
  const [hersteller, setHersteller] = useState<Hersteller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHersteller, setSelectedHersteller] = useState<Hersteller | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    kontaktEmail: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await herstellerApi.getAll();
      setHersteller(res.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHersteller = hersteller.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedHersteller(null);
    setFormData({ name: '', website: '', kontaktEmail: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (h: Hersteller) => {
    setSelectedHersteller(h);
    setFormData({
      name: h.name,
      website: h.website || '',
      kontaktEmail: h.kontaktEmail || ''
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (h: Hersteller) => {
    setSelectedHersteller(h);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedHersteller) {
        await herstellerApi.update(selectedHersteller.id, formData);
        setSnackbar({ open: true, message: 'Hersteller aktualisiert', severity: 'success' });
      } else {
        await herstellerApi.create(formData);
        setSnackbar({ open: true, message: 'Hersteller erstellt', severity: 'success' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Speichern', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedHersteller) return;
    try {
      await herstellerApi.delete(selectedHersteller.id);
      setSnackbar({ open: true, message: 'Hersteller gelöscht', severity: 'success' });
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
          placeholder="Hersteller suchen..."
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
            Neuer Hersteller
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Kontakt-E-Mail</TableCell>
              <TableCell>Instrumente</TableCell>
              {user && canManage(user.rolle) && <TableCell align="right">Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHersteller.map((h) => (
              <TableRow key={h.id} hover>
                <TableCell><Typography fontWeight="medium">{h.name}</Typography></TableCell>
                <TableCell>
                  {h.website ? (
                    <a href={h.website} target="_blank" rel="noopener noreferrer">{h.website}</a>
                  ) : '-'}
                </TableCell>
                <TableCell>{h.kontaktEmail || '-'}</TableCell>
                <TableCell>{h._count?.instrumente || 0}</TableCell>
                {user && canManage(user.rolle) && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(h)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDelete(h)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedHersteller ? 'Hersteller bearbeiten' : 'Neuer Hersteller'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} margin="normal" />
          <TextField fullWidth label="Kontakt-E-Mail" value={formData.kontaktEmail} onChange={(e) => setFormData({ ...formData, kontaktEmail: e.target.value })} margin="normal" type="email" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name}>Speichern</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Hersteller löschen?</DialogTitle>
        <DialogContent><Typography>Hersteller "{selectedHersteller?.name}" wirklich löschen?</Typography></DialogContent>
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
