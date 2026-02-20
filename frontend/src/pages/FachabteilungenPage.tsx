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
import { fachabteilungApi, userApi } from '@/utils/api';
import { Fachabteilung, Rolle, User } from '@/types';

const canManage = (rolle: Rolle) => rolle === 'OP_MANAGER';

export const FachabteilungenPage: React.FC = () => {
  const { user } = useAuth();
  const [fachabteilungen, setFachabteilungen] = useState<Fachabteilung[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFach, setSelectedFach] = useState<Fachabteilung | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    kuerzel: '',
    beschreibung: '',
    chefArztId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fachRes, usersRes] = await Promise.all([
        fachabteilungApi.getAll(),
        userApi.getAll()
      ]);
      setFachabteilungen(fachRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFachabteilungen = fachabteilungen.filter(fach =>
    fach.name.toLowerCase().includes(search.toLowerCase()) ||
    fach.kuerzel.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedFach(null);
    setFormData({ name: '', kuerzel: '', beschreibung: '', chefArztId: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (fach: Fachabteilung) => {
    setSelectedFach(fach);
    setFormData({
      name: fach.name,
      kuerzel: fach.kuerzel,
      beschreibung: fach.beschreibung || '',
      chefArztId: fach.chefArzt?.id || ''
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (fach: Fachabteilung) => {
    setSelectedFach(fach);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedFach) {
        await fachabteilungApi.update(selectedFach.id, {
          ...formData,
          chefArztId: formData.chefArztId || null
        });
        setSnackbar({ open: true, message: 'Fachabteilung aktualisiert', severity: 'success' });
      } else {
        await fachabteilungApi.create({
          ...formData,
          chefArztId: formData.chefArztId || null
        });
        setSnackbar({ open: true, message: 'Fachabteilung erstellt', severity: 'success' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Fehler beim Speichern',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedFach) return;
    try {
      await fachabteilungApi.delete(selectedFach.id);
      setSnackbar({ open: true, message: 'Fachabteilung gelöscht', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Fehler beim Löschen',
        severity: 'error'
      });
    }
  };

  const aerzte = users.filter(u => u.rolle === 'CHEFARZT' || u.rolle === 'OBERARZT');

  if (loading) return <Typography>Laden...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Fachabteilungen suchen..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ width: 300 }}
        />
        {user && canManage(user.rolle) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Neue Fachabteilung
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Kürzel</TableCell>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Chefarzt</TableCell>
              <TableCell>Siebe</TableCell>
              <TableCell>Mitarbeiter</TableCell>
              {user && canManage(user.rolle) && <TableCell align="right">Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFachabteilungen.map((fach) => (
              <TableRow key={fach.id} hover>
                <TableCell>
                  <Typography fontWeight="medium">{fach.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={fach.kuerzel} size="small" color="primary" />
                </TableCell>
                <TableCell>{fach.beschreibung || '-'}</TableCell>
                <TableCell>
                  {fach.chefArzt
                    ? `${fach.chefArzt.vorname} ${fach.chefArzt.nachname}`
                    : '-'}
                </TableCell>
                <TableCell>{fach._count?.siebe || 0}</TableCell>
                <TableCell>{fach._count?.user || 0}</TableCell>
                {user && canManage(user.rolle) && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(fach)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDelete(fach)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedFach ? 'Fachabteilung bearbeiten' : 'Neue Fachabteilung'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Kürzel"
            value={formData.kuerzel}
            onChange={(e) => setFormData({ ...formData, kuerzel: e.target.value.toUpperCase() })}
            margin="normal"
            required
            inputProps={{ maxLength: 10 }}
          />
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.beschreibung}
            onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Chefarzt"
            value={formData.chefArztId}
            onChange={(e) => setFormData({ ...formData, chefArztId: e.target.value })}
            margin="normal"
          >
            <option value="">Kein Chefarzt zugewiesen</option>
            {aerzte.map((arzt) => (
              <option key={arzt.id} value={arzt.id}>
                {arzt.vorname} {arzt.nachname} ({arzt.rolle})
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name || !formData.kuerzel}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Fachabteilung löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die Fachabteilung "{selectedFach?.name}" wirklich löschen?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

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
