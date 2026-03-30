import React from 'react';
import AdminDashboardMaster from '@/components/admin/AdminDashboard.jsx';

// This component acts as a redirect/wrapper to ensure we use the updated Admin structure
// If there are any props specific to the old implementation, they are passed through
const AdminDashboard = (props) => {
  return <AdminDashboardMaster {...props} />;
};

export default AdminDashboard;