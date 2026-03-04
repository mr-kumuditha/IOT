import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { DashboardPage } from '../views/Dashboard/DashboardPage';
import { WorkersPage } from '../views/Workers/WorkersPage';
import { WorkerDetailsPage } from '../views/WorkerDetails/WorkerDetailsPage';
import { IncidentsPage } from '../views/Incidents/IncidentsPage';
import { SettingsPage } from '../views/Settings/SettingsPage';
import { CardRegistryPage } from '../views/Settings/CardRegistryPage';
import { MonitorPage } from '../views/Monitor/MonitorPage';
import { ZonePage } from '../views/Zone/ZonePage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="workers" element={<WorkersPage />} />
                <Route path="workers/:workerId" element={<WorkerDetailsPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="monitor" element={<MonitorPage />} />
                <Route path="zones" element={<ZonePage />} />
                <Route path="registry" element={<CardRegistryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};
