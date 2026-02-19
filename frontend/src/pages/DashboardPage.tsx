import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Stats {
  siebeCount: number;
  instrumenteCount: number;
  pendingAenderungen: number;
  fachabteilungenCount: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    siebeCount: 0,
    instrumenteCount: 0,
    pendingAenderungen: 0,
    fachabteilungenCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [siebeRes, instrumenteRes, aenderungenRes, fachabteilungenRes] = await Promise.all([
          api.get('/siebe'),
          api.get('/instrumente'),
          api.get('/aenderungen', { params: { status: 'PENDING' } }),
          api.get('/fachabteilungen')
        ]);
        
        setStats({
          siebeCount: siebeRes.data.length,
          instrumenteCount: instrumenteRes.data.length,
          pendingAenderungen: aenderungenRes.data.length,
          fachabteilungenCount: fachabteilungenRes.data.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Willkommen, {user?.vorname} {user?.nachname}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {user?.rolle?.replace('_', ' ')} | {user?.fachabteilung?.name || 'Zentral'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Siebe"
            value={stats.siebeCount}
            icon={<FolderIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Instrumente"
            value={stats.instrumenteCount}
            icon={<BuildIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Offene Änderungen"
            value={stats.pendingAenderungen}
            icon={<AssignmentIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fachabteilungen"
            value={stats.fachabteilungenCount}
            icon={<BusinessIcon />}
            color="info"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
