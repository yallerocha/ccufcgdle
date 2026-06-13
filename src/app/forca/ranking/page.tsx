'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DailyRankingPage } from '@/client/components/DailyRankingPage';

export default function ForcaRankingPage() {
  const { t } = useTranslation();
  return (
    <DailyRankingPage
      endpoint="/api/forca/ranking"
      backHref="/forca"
      subtitle={t('forca.rankingSubtitle')}
      metricHeader={t('forca.thErrors')}
    />
  );
}
