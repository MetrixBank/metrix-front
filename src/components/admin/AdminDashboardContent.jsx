import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import useTeamData from '@/components/sub-admin/hooks/useTeamData';
import { roles } from '@/lib/constants';

// Admin Components
const AdminOverviewDashboard = React.lazy(() => import('@/components/admin/overview/AdminOverviewDashboard'));
const AdminUsersTab = React.lazy(() => import('@/components/admin/users/AdminUsersTab'));
const AdminActivitiesTab = React.lazy(() => import('@/components/admin/activities/AdminActivitiesTab'));
const AdminCalendarTab = React.lazy(() => import('@/components/admin/calendar/AdminCalendarTab'));
const AdminCustomersTab = React.lazy(() => import('@/components/admin/customers/AdminCustomersTab'));
const AdminStockTab = React.lazy(() => import('@/components/admin/stock/AdminStockTab'));
const AdminFinancialTab = React.lazy(() => import('@/components/admin/financial/AdminFinancialTab'));
const AdminSupportTab = React.lazy(() => import('@/components/admin/support/AdminSupportTab'));
const AdminMentorshipTab = React.lazy(() => import('@/components/admin/mentorship/AdminMentorshipTab'));
const PurchaseIntelligenceTab = React.lazy(() => import('@/components/admin/intelligence/PurchaseIntelligenceTab'));
const AdminJourneyTab = React.lazy(() => import('@/components/admin/journey/AdminJourneyTab'));
const AdminFnxUnifiedTab = React.lazy(() => import('@/components/admin/fnx/AdminFnxUnifiedTab'));
const AdminGoalsTab = React.lazy(() => import('@/components/admin/goals/AdminGoalsTab'));
const AdminConsultantsReport = React.lazy(() => import('@/components/admin/reports/AdminConsultantsReport'));
const AdminBIPage = React.lazy(() => import('@/components/admin/bi/AdminBIPage'));

// Sub-Admin Components
const TeamOverviewTab = React.lazy(() => import('@/components/sub-admin/TeamOverviewTab'));
const TeamActivitiesTab = React.lazy(() => import('@/components/sub-admin/TeamActivitiesTab'));
const TeamCustomersTab = React.lazy(() => import('@/components/sub-admin/TeamCustomersTab'));
const TeamStockTab = React.lazy(() => import('@/components/sub-admin/TeamStockTab'));
const TeamGoalsTab = React.lazy(() => import('@/components/sub-admin/TeamGoalsTab'));
const TeamGenealogyTab = React.lazy(() => import('@/components/sub-admin/genealogy/TeamGenealogyTab'));

const SubAdminContentWrapper = ({ activeTab, user }) => {
    const { data: teamData, loading, error, refetch } = useTeamData(user.id);

    // Strictly limited tabs for Sub-Admin
    switch (activeTab) {
        case 'overview':
            return <TeamOverviewTab teamData={teamData} loading={loading} error={error} refetch={refetch} />;
        case 'genealogy':
            return <TeamGenealogyTab teamData={teamData} loading={loading} error={error} refetch={refetch} />;
        case 'activities':
            return <TeamActivitiesTab teamData={teamData} loading={loading} error={error} />;
        case 'customers':
            return <TeamCustomersTab teamData={teamData} loading={loading} error={error} />;
        case 'stock':
            return <TeamStockTab teamData={teamData} loading={loading} error={error} />;
        case 'goals':
            return <TeamGoalsTab teamData={teamData} loading={loading} error={error} />;
        case 'purchase_intelligence':
            return <PurchaseIntelligenceTab user={user} />;
        // Explicitly removed: fnx-unified, mentorship, support
        default:
            return <TeamOverviewTab teamData={teamData} loading={loading} error={error} refetch={refetch} />;
    }
};

const AdminDashboardContent = ({ activeTab, user }) => {
  const isSubAdmin = user.role === roles.SUB_ADMIN;

  const renderContent = () => {
    if (isSubAdmin) {
        return <SubAdminContentWrapper activeTab={activeTab} user={user} />;
    }

    switch (activeTab) {
      case 'overview':
        return <AdminOverviewDashboard user={user} distributorType="all" />;
      case 'users':
        return <AdminUsersTab user={user} />;
      case 'activities':
        return <AdminActivitiesTab user={user} />;
      case 'calendar':
        return <AdminCalendarTab user={user} />;
      case 'customers':
        return <AdminCustomersTab user={user} />;
      case 'stock':
        return <AdminStockTab user={user} />;
      case 'financial':
        return <AdminFinancialTab user={user} />;
      case 'journey':
        return <AdminJourneyTab user={user} />;
      case 'fnx-unified':
        return <AdminFnxUnifiedTab user={user} />;
      case 'intelligence':
        return <PurchaseIntelligenceTab user={user} />;
      case 'mentorship':
        return <AdminMentorshipTab user={user} />;
      case 'support':
        return <AdminSupportTab user={user} />;
      case 'goals':
        return <AdminGoalsTab distributorType="all" />;
      case 'reports':
        return <AdminConsultantsReport distributorType="all" />;
      case 'bi':
        return <AdminBIPage />;
      default:
        return <AdminOverviewDashboard user={user} distributorType="all" />;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-transparent">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-full"
      >
        <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner /></div>}>
          {renderContent()}
        </Suspense>
      </motion.div>
    </div>
  );
};

export default AdminDashboardContent;