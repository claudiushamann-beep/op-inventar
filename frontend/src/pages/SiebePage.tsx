import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { siebApi, fachabteilungApi } from '@/utils/api';
import { Sieb, SiebTyp, SiebStatus, Fachabteilung, Rolle } from '@/types';

const canCreate = (rolle: Rolle) => ['OBERARZT', 'CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'].includes(rolle);

export const SiebePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [siebe, setSiebe] = useState<Sieb[]>([]);
  const [fachabteilungen, setFachabteilungen] = useState<Fachabteilung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTyp, setFilterTyp] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    beschreibung: '',
    typ: 'FACHUEBERGREIFEND' as SiebTyp,
    fachabteilungId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [siebeRes, fachRes] = await Promise.all([
        siebApi.getAll(),
        fachabteilungApi.getAll()
      ]);
      setSiebe(siebeRes.data);
      setFachabteilungen(fachRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSiebe = siebe.filter(sieb => {
    const matchesSearch = sieb.name.toLowerCase().includes(search.toLowerCase()) ||
      sieb.beschreibung?.toLowerCase().includes(search.toLowerCase());
    const matchesTyp = !filterTyp || sieb.typ === filterTyp;
    const matchesStatus = !filterStatus || sieb.status === filterStatus;
    return matchesSearch && matchesTyp && matchesStatus;
  });

  const handleCreate = async () => {
    try {
      await siebApi.create({
        ...formData,
        fachabteilungId: formData.typ === 'FACHABTEILUNGSSPEZIFISCH' ? formData.fachabteilungId : null
      });
      setDialogOpen(false);
      setFormData({ name: '', beschreibung: '', typ: 'FACHUEBERGREIFEND', fachabteilungId: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating sieb:', error);
    }
  };

  const getStatusColor = (status: SiebStatus) => {
    switch (status) {
      case 'AKTIV': return 'success';
      case 'ENTWURF': return 'warning';
      case 'INAKTIV': return 'error';
      default: return 'default';
    }
  };

  const getTypColor = (typ: SiebTyp) => {
    return typ === 'FACHUEBERGREIFEND' ? 'primary' : 'secondary';
  };

  if (loading) return <Typography>Laden...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Siebe suchen..."
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Typ</InputLabel>
            <Select
              value={filterTyp}
              label="Typ"
              onChange={(e) => setFilterTyp(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              <MenuItem value="FACHABTEILUNGSSPEZIFISCH">Fachabteilungsspezifisch</MenuItem>
              <MenuItem value="FACHUEBERGREIFEND">Fachübergreifend</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              <MenuItem value="ENTWURF">Entwurf</MenuItem>
              <MenuItem value="AKTIV">Aktiv</MenuItem>
              <MenuItem value="INAKTIV">Inaktiv</MenuItem>
            </Select>
          </FormControl>
          {user && canCreate(user.rolle) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Neues Sieb
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Fachabteilung</TableCell>
              <TableCell>Instrumente</TableCell>
              <TableCell>Version</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSiebe.map((sieb) => (
              <TableRow
                key={sieb.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/siebe/${sieb.id}`)}
              >
                <TableCell>
                  <Typography fontWeight="medium">{sieb.name}</Typography>
                  {sieb.beschreibung && (
                    <Typography variant="body2" color="text.secondary">
                      {sieb.beschreibung}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={sieb.typ === 'FACHUEBERGREIFEND' ? 'Fachübergreifend' : 'Fachabteilung'}
                    color={getTypColor(sieb.typ)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={sieb.status}
                    color={getStatusColor(sieb.status)}
                  />
                </TableCell>
                <TableCell>{sieb.fachabteilung?.name || '-'}</TableCell>
                <TableCell>{sieb.instrumente?.length || 0}</TableCell>
                <TableCell>v{sieb.version}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/siebe/${sieb.id}`); }}>
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neues Sieb erstellen</DialogTitle>
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
            label="Beschreibung"
            value={formData.beschreibung}
            onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Typ</InputLabel>
            <Select
              value={formData.typ}
              label="Typ"
              onChange={(e) => setFormData({ ...formData, typ: e.target.value as SiebTyp, fachabteilungId: '' })}
            >
              <MenuItem value="FACHUEBERGREIFEND">Fachübergreifend</MenuItem>
              <MenuItem value="FACHABTEILUNGSSPEZIFISCH">Fachabteilungsspezifisch</MenuItem>
            </Select>
          </FormControl>
          {formData.typ === 'FACHABTEILUNGSSPEZIFISCH' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Fachabteilung</InputLabel>
              <Select
                value={formData.fachabteilungId}
                label="Fachabteilung"
                onChange={(e) => setFormData({ ...formData, fachabteilungId: e.target.value })}
              >
                {fachabteilungen.map((fach) => (
                  <MenuItem key={fach.id} value={fach.id}>{fach.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formData.name}>
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
