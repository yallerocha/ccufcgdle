'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DailyRankingPage } from '@/client/components/DailyRankingPage';

export default function RankingPage() {
  const { t } = useTranslation();
  return (
    <DailyRankingPage
      endpoint="/api/game/ranking"
      backHref="/lsdle"
      subtitle={t('ranking.subtitle')}
      metricHeader={t('ranking.thAttempts')}
    />
  );
}
