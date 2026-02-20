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
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { userApi, fachabteilungApi } from '@/utils/api';
import { User, Rolle, Fachabteilung } from '@/types';

const rollenLabels: Record<Rolle, string> = {
  OP_PFLEGE: 'OP-Pflege',
  OBERARZT: 'Oberarzt',
  CHEFARZT: 'Chefarzt',
  OP_MANAGER: 'OP-Manager',
  AEMP_MITARBEITER: 'AEMP-Mitarbeiter'
};

const canManage = (rolle: Rolle) => rolle === 'OP_MANAGER';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [fachabteilungen, setFachabteilungen] = useState<Fachabteilung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    vorname: '',
    nachname: '',
    rolle: 'OP_PFLEGE' as Rolle,
    fachabteilungId: '',
    passwort: ''
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, fachRes] = await Promise.all([
        userApi.getAll(),
        fachabteilungApi.getAll()
      ]);
      setUsers(usersRes.data);
      setFachabteilungen(fachRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    `${u.vorname} ${u.nachname}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      username: '', email: '', vorname: '', nachname: '',
      rolle: 'OP_PFLEGE', fachabteilungId: '', passwort: ''
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      vorname: u.vorname,
      nachname: u.nachname,
      rolle: u.rolle,
      fachabteilungId: u.fachabteilung?.id || '',
      passwort: ''
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (u: User) => {
    setSelectedUser(u);
    setDeleteDialogOpen(true);
  };

  const handleOpenReset = (u: User) => {
    setSelectedUser(u);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        await userApi.update(selectedUser.id, {
          vorname: formData.vorname,
          nachname: formData.nachname,
          email: formData.email,
          rolle: formData.rolle,
          fachabteilungId: formData.fachabteilungId || null
        });
        setSnackbar({ open: true, message: 'Benutzer aktualisiert', severity: 'success' });
      } else {
        await userApi.create({
          username: formData.username,
          email: formData.email,
          vorname: formData.vorname,
          nachname: formData.nachname,
          rolle: formData.rolle,
          fachabteilungId: formData.fachabteilungId || null,
          passwort: formData.passwort
        });
        setSnackbar({ open: true, message: 'Benutzer erstellt', severity: 'success' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Speichern', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userApi.delete(selectedUser.id);
      setSnackbar({ open: true, message: 'Benutzer gelöscht', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Löschen', severity: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      await userApi.resetPassword(selectedUser.id, newPassword);
      setSnackbar({ open: true, message: 'Passwort zurückgesetzt', severity: 'success' });
      setResetDialogOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: err.response?.data?.error || 'Fehler beim Zurücksetzen', severity: 'error' });
    }
  };

  const getRolleColor = (rolle: Rolle) => {
    switch (rolle) {
      case 'OP_MANAGER': return 'error';
      case 'CHEFARZT': return 'primary';
      case 'OBERARZT': return 'secondary';
      case 'AEMP_MITARBEITER': return 'warning';
      default: return 'default';
    }
  };

  if (loading) return <Typography>Laden...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Benutzer suchen..."
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
            Neuer Benutzer
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Benutzername</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell>Fachabteilung</TableCell>
              <TableCell>Status</TableCell>
              {user && canManage(user.rolle) && <TableCell align="right">Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.vorname} {u.nachname}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={rollenLabels[u.rolle]} size="small" color={getRolleColor(u.rolle)} />
                </TableCell>
                <TableCell>{u.fachabteilung?.name || '-'}</TableCell>
                <TableCell>
                  <Chip label={u.active !== false ? 'Aktiv' : 'Inaktiv'} size="small" color={u.active !== false ? 'success' : 'default'} />
                </TableCell>
                {user && canManage(user.rolle) && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(u)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenReset(u)} title="Passwort zurücksetzen"><LockIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDelete(u)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Benutzername" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} margin="normal" required disabled={!!selectedUser} />
          <TextField fullWidth label="E-Mail" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" required type="email" />
          <TextField fullWidth label="Vorname" value={formData.vorname} onChange={(e) => setFormData({ ...formData, vorname: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Nachname" value={formData.nachname} onChange={(e) => setFormData({ ...formData, nachname: e.target.value })} margin="normal" required />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rolle</InputLabel>
            <Select value={formData.rolle} label="Rolle" onChange={(e) => setFormData({ ...formData, rolle: e.target.value as Rolle })}>
              {Object.entries(rollenLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Fachabteilung</InputLabel>
            <Select value={formData.fachabteilungId} label="Fachabteilung" onChange={(e) => setFormData({ ...formData, fachabteilungId: e.target.value })}>
              <MenuItem value="">Keine Zuordnung</MenuItem>
              {fachabteilungen.map((fach) => (
                <MenuItem key={fach.id} value={fach.id}>{fach.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!selectedUser && (
            <TextField fullWidth label="Passwort" value={formData.passwort} onChange={(e) => setFormData({ ...formData, passwort: e.target.value })} margin="normal" required type="password" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.username || !formData.email || !formData.vorname || !formData.nachname || (!selectedUser && !formData.passwort)}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Benutzer löschen?</DialogTitle>
        <DialogContent><Typography>Benutzer "{selectedUser?.username}" wirklich löschen?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Löschen</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Passwort zurücksetzen</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Neues Passwort für "{selectedUser?.username}":</Typography>
          <TextField fullWidth label="Neues Passwort" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={!newPassword}>Zurücksetzen</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
