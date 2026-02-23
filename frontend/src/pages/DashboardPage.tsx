import React, { useEffect, useState } from 'react';
import {
  Grid,
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
import { CardSkeleton } from '@/components/SkeletonLoader';

interface Stats {
  siebeCount: number;
  instrumenteCount: number;
  pendingAenderungen: number;
  fachabteilungenCount: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" component="div" fontWeight={700} color="text.primary">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            bgcolor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976D2 0%, #7C4DFF 100%)',
          borderRadius: 3,
          p: 3,
          mb: 4,
          color: 'white'
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Willkommen, {user?.vorname} {user?.nachname}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85 }}>
          {today} · {user?.rolle?.replace(/_/g, ' ')} · {user?.fachabteilung?.name || 'Zentral'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          {stats ? (
            <StatCard
              title="Siebe"
              value={stats.siebeCount}
              icon={<FolderIcon sx={{ fontSize: 28 }} />}
              color="#1976D2"
              bgColor="rgba(25, 118, 210, 0.12)"
            />
          ) : (
            <CardSkeleton />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {stats ? (
            <StatCard
              title="Instrumente"
              value={stats.instrumenteCount}
              icon={<BuildIcon sx={{ fontSize: 28 }} />}
              color="#7C4DFF"
              bgColor="rgba(124, 77, 255, 0.12)"
            />
          ) : (
            <CardSkeleton />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {stats ? (
            <StatCard
              title="Offene Änderungen"
              value={stats.pendingAenderungen}
              icon={<AssignmentIcon sx={{ fontSize: 28 }} />}
              color="#FB8C00"
              bgColor="rgba(251, 140, 0, 0.12)"
            />
          ) : (
            <CardSkeleton />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {stats ? (
            <StatCard
              title="Fachabteilungen"
              value={stats.fachabteilungenCount}
              icon={<BusinessIcon sx={{ fontSize: 28 }} />}
              color="#43A047"
              bgColor="rgba(67, 160, 71, 0.12)"
            />
          ) : (
            <CardSkeleton />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
