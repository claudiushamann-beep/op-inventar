import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
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
  Alert,
  Divider
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { aenderungApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Aenderung, AenderungStatus, AenderungTyp, Rolle } from '@/types';

const canApprove = (rolle: Rolle, siebTyp?: string, fachabteilungId?: string, userFachabteilungId?: string) => {
  if (rolle === 'OP_MANAGER') return true;
  if (rolle === 'CHEFARZT' && siebTyp === 'FACHABTEILUNGSSPEZIFISCH' && fachabteilungId === userFachabteilungId) return true;
  return false;
};

const getAenderungTypLabel = (typ: AenderungTyp): string => {
  switch (typ) {
    case 'ADD_INSTRUMENT': return 'Instrument hinzufügen';
    case 'REMOVE_INSTRUMENT': return 'Instrument entfernen';
    case 'MODIFY_ANZAHL': return 'Anzahl ändern';
    case 'MODIFY_POSITION': return 'Position ändern';
    case 'CREATE_SIEB': return 'Sieb erstellen';
    case 'DEACTIVATE_SIEB': return 'Sieb deaktivieren';
    default: return typ;
  }
};

export const AenderungenPage: React.FC = () => {
  const { user } = useAuth();
  const [aenderungen, setAenderungen] = useState<Aenderung[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAenderung, setSelectedAenderung] = useState<Aenderung | null>(null);
  const [ablehnungsGrund, setAblehnungsGrund] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await aenderungApi.getAll();
      setAenderungen(res.data);
    } catch (error) {
      console.error('Error fetching aenderungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (aenderung: Aenderung) => {
    try {
      await aenderungApi.approve(aenderung.id);
      setMessage({ type: 'success', text: 'Änderung genehmigt' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler bei der Genehmigung' });
    }
  };

  const handleReject = async () => {
    if (!selectedAenderung || !ablehnungsGrund) return;

    try {
      await aenderungApi.reject(selectedAenderung.id, ablehnungsGrund);
      setMessage({ type: 'success', text: 'Änderung abgelehnt' });
      setRejectDialogOpen(false);
      setSelectedAenderung(null);
      setAblehnungsGrund('');
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler bei der Ablehnung' });
    }
  };

  const getStatusColor = (status: AenderungStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <Typography>Laden...</Typography>;

  const pendingAenderungen = aenderungen.filter(a => a.status === 'PENDING');
  const processedAenderungen = aenderungen.filter(a => a.status !== 'PENDING');

  return (
    <Box>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Typography variant="h5" gutterBottom>
        Offene Änderungsanträge ({pendingAenderungen.length})
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sieb</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Beantragt von</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingAenderungen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Keine offenen Anträge</Typography>
                </TableCell>
              </TableRow>
            ) : (
              pendingAenderungen.map((aenderung) => {
                const canUserApprove = user && canApprove(
                  user.rolle,
                  aenderung.sieb?.typ,
                  aenderung.sieb?.fachabteilungId,
                  user.fachabteilungId
                );

                return (
                  <TableRow key={aenderung.id}>
                    <TableCell>{aenderung.sieb?.name}</TableCell>
                    <TableCell>{getAenderungTypLabel(aenderung.typ)}</TableCell>
                    <TableCell>
                      {aenderung.beantragtVon?.vorname} {aenderung.beantragtVon?.nachname}
                    </TableCell>
                    <TableCell>
                      {new Date(aenderung.beantragtAm).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label="Offen" color="warning" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedAenderung(aenderung);
                          setDetailDialogOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      {canUserApprove && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleApprove(aenderung)}
                          >
                            Genehmigen
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => {
                              setSelectedAenderung(aenderung);
                              setRejectDialogOpen(true);
                            }}
                          >
                            Ablehnen
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom>
        Bearbeitete Anträge
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sieb</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Beantragt von</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Genehmigt von</TableCell>
              <TableCell>Datum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedAenderungen.map((aenderung) => (
              <TableRow key={aenderung.id}>
                <TableCell>{aenderung.sieb?.name}</TableCell>
                <TableCell>{getAenderungTypLabel(aenderung.typ)}</TableCell>
                <TableCell>
                  {aenderung.beantragtVon?.vorname} {aenderung.beantragtVon?.nachname}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={aenderung.status === 'APPROVED' ? 'Genehmigt' : 'Abgelehnt'}
                    color={getStatusColor(aenderung.status)}
                  />
                </TableCell>
                <TableCell>
                  {aenderung.genehmigtVon
                    ? `${aenderung.genehmigtVon.vorname} ${aenderung.genehmigtVon.nachname}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {aenderung.genehmigtAm
                    ? new Date(aenderung.genehmigtAm).toLocaleDateString('de-DE')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Änderungsdetails</DialogTitle>
        <DialogContent>
          {selectedAenderung && (
            <Box>
              <Typography variant="subtitle2">Sieb</Typography>
              <Typography>{selectedAenderung.sieb?.name}</Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Änderungstyp</Typography>
              <Typography>{getAenderungTypLabel(selectedAenderung.typ)}</Typography>
              
              {selectedAenderung.kommentar && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Kommentar</Typography>
                  <Typography>{selectedAenderung.kommentar}</Typography>
                </>
              )}
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Neue Daten</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(selectedAenderung.neuDaten, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Änderung ablehnen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ablehnungsgrund"
            value={ablehnungsGrund}
            onChange={(e) => setAblehnungsGrund(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!ablehnungsGrund}
          >
            Ablehnen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
