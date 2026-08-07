import React from 'react';
import { Box } from '@mui/material';
import PartnerForm, { type BreakupContentOptions } from './PartnerForm';
import PartnerRequestsList from './PartnerRequestsList';
import { PartnerFormSkeleton } from './SettingsSkeletons';
import { useRelationship } from '../../hooks/useRelationship';
import { usePartnerRequests } from '../../hooks/usePartnerRequests';

interface PartnerSettingsTabProps {
  userId: string;
  onAddPartner: (partnerEmail: string, startDate: Date) => Promise<void>;
  onRemovePartner: (options: BreakupContentOptions) => Promise<void>;
  isActionLoading: boolean;
}

const PartnerSettingsTab: React.FC<PartnerSettingsTabProps> = ({
  userId,
  onAddPartner,
  onRemovePartner,
  isActionLoading
}) => {
  const {
    partner,
    relationshipStartDate,
    refresh: refreshRelationship,
    isLoading: isRelationshipLoading
  } = useRelationship();

  const {
    incomingRequests,
    outgoingRequests,
    isIncomingLoading,
    isOutgoingLoading,
    incomingError,
    outgoingError,
    refresh: refreshRequests
  } = usePartnerRequests();

  const handleAccepted = async () => {
    await refreshRelationship();
    await refreshRequests();
  };

  return (
    <Box>
      {isRelationshipLoading && !partner && !relationshipStartDate ? (
        <PartnerFormSkeleton />
      ) : (
        <PartnerForm
          userId={userId}
          partner={partner}
          relationshipStartDate={relationshipStartDate}
          onAddPartner={onAddPartner}
          onRemovePartner={onRemovePartner}
          isLoading={isActionLoading || isRelationshipLoading}
        />
      )}

      <PartnerRequestsList
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
        isIncomingLoading={isIncomingLoading}
        isOutgoingLoading={isOutgoingLoading}
        incomingError={incomingError}
        outgoingError={outgoingError}
        hasPartner={Boolean(partner)}
        onAccepted={handleAccepted}
      />
    </Box>
  );
};

export default PartnerSettingsTab;
