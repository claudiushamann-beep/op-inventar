import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  Edit,
  CloudUpload,
  Assignment
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { siebApi, instrumentApi, aenderungApi } from '@/utils/api';
import { Sieb, Instrument, SiebStatus, Rolle } from '@/types';

const canEdit = (rolle: Rolle) => ['OBERARZT', 'CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'].includes(rolle);
const canRequestChange = () => true;

export const SiebDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sieb, setSieb] = useState<Sieb | null>(null);
  const [instrumente, setInstrumente] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [anzahl, setAnzahl] = useState(1);
  const [position, setPosition] = useState('');
  const [changeComment, setChangeComment] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [siebRes, instRes] = await Promise.all([
        siebApi.getById(id!),
        instrumentApi.getAll()
      ]);
      setSieb(siebRes.data);
      setInstrumente(instRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstrument = async () => {
    if (!sieb || !selectedInstrument) return;

    try {
      if (sieb.status === 'AKTIV') {
        await aenderungApi.create({
          siebId: sieb.id,
          typ: 'ADD_INSTRUMENT',
          neuDaten: { instrumentId: selectedInstrument, anzahl, position },
          kommentar: changeComment
        });
        setMessage({ type: 'success', text: 'Änderungsantrag erstellt - wartet auf Freigabe' });
      } else {
        await siebApi.addInstrument(sieb.id, { instrumentId: selectedInstrument, anzahl, position });
        setMessage({ type: 'success', text: 'Instrument hinzugefügt' });
        fetchData();
      }
      setAddDialogOpen(false);
      setSelectedInstrument('');
      setAnzahl(1);
      setPosition('');
      setChangeComment('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Hinzufügen' });
    }
  };

  const handleRemoveInstrument = async (instrumentId: string) => {
    if (!sieb) return;

    if (!confirm('Instrument wirklich entfernen?')) return;

    try {
      if (sieb.status === 'AKTIV') {
        await aenderungApi.create({
          siebId: sieb.id,
          typ: 'REMOVE_INSTRUMENT',
          neuDaten: { instrumentId },
          kommentar: 'Instrument entfernt'
        });
        setMessage({ type: 'success', text: 'Änderungsantrag erstellt' });
      } else {
        await siebApi.removeInstrument(sieb.id, instrumentId);
        setMessage({ type: 'success', text: 'Instrument entfernt' });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Entfernen' });
    }
  };

  const handleUploadBild = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sieb) return;

    try {
      await siebApi.uploadBild(sieb.id, file);
      setMessage({ type: 'success', text: 'Bild hochgeladen' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Upload' });
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

  if (loading) return <Typography>Laden...</Typography>;
  if (!sieb) return <Typography>Sieb nicht gefunden</Typography>;

  return (
    <Box>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Button startIcon={<ArrowBack />} onClick={() => navigate('/siebe')} sx={{ mb: 2 }}>
        Zurück zur Liste
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">{sieb.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={sieb.typ === 'FACHUEBERGREIFEND' ? 'Fachübergreifend' : 'Fachabteilungsspezifisch'}
              color={sieb.typ === 'FACHUEBERGREIFEND' ? 'primary' : 'secondary'}
            />
            <Chip label={sieb.status} color={getStatusColor(sieb.status)} />
            <Chip label={`Version ${sieb.version}`} variant="outlined" />
          </Box>
          {sieb.beschreibung && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {sieb.beschreibung}
            </Typography>
          )}
        </Box>
        {user && canEdit(user.rolle) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
              Bild hochladen
              <input type="file" hidden accept="image/*" onChange={handleUploadBild} />
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
            >
              Instrument hinzufügen
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {sieb.bildGepacktPfad && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                image={sieb.bildGepacktPfad}
                alt="Sieb gepackt"
                sx={{ maxHeight: 300, objectFit: 'contain' }}
              />
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={sieb.bildGepacktPfad ? 8 : 12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Artikel-Nr.</TableCell>
                  <TableCell>Bezeichnung</TableCell>
                  <TableCell>Hersteller</TableCell>
                  <TableCell align="center">Anzahl</TableCell>
                  {user && canEdit(user.rolle) && <TableCell align="right">Aktionen</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {sieb.instrumente?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.position || '-'}</TableCell>
                    <TableCell>{item.instrument.artikelNr}</TableCell>
                    <TableCell>{item.instrument.bezeichnung}</TableCell>
                    <TableCell>{item.instrument.hersteller?.name}</TableCell>
                    <TableCell align="center">{item.anzahl}</TableCell>
                    {user && canEdit(user.rolle) && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveInstrument(item.instrumentId)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Instrument hinzufügen</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Instrument</InputLabel>
            <Select
              value={selectedInstrument}
              label="Instrument"
              onChange={(e) => setSelectedInstrument(e.target.value)}
            >
              {instrumente.map((inst) => (
                <MenuItem key={inst.id} value={inst.id}>
                  {inst.artikelNr} - {inst.bezeichnung}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Anzahl"
            value={anzahl}
            onChange={(e) => setAnzahl(parseInt(e.target.value))}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="Position (z.B. A1, B2)"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            margin="normal"
          />
          {sieb.status === 'AKTIV' && (
            <TextField
              fullWidth
              label="Kommentar für Änderungsantrag"
              value={changeComment}
              onChange={(e) => setChangeComment(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddInstrument} disabled={!selectedInstrument}>
            {sieb.status === 'AKTIV' ? 'Antrag erstellen' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
