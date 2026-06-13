'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DailyRankingPage } from '@/client/components/DailyRankingPage';

export default function TermoRankingPage() {
  const { t } = useTranslation();
  return (
    <DailyRankingPage
      endpoint="/api/termo/ranking"
      backHref="/termo"
      subtitle={t('ranking.subtitle')}
      metricHeader={t('ranking.thAttempts')}
    />
  );
}
