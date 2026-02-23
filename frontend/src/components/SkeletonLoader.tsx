import React from 'react';
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent
} from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 5 }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowI) => (
          <TableRow key={rowI}>
            {Array.from({ length: cols }).map((_, colI) => (
              <TableCell key={colI}>
                <Skeleton variant="text" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const CardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" />
      <Box sx={{ mt: 1 }}>
        <Skeleton variant="rectangular" height={80} />
      </Box>
    </CardContent>
  </Card>
);
