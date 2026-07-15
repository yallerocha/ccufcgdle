'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DailyRankingPage } from '@/client/components/DailyRankingPage';

export default function CodeRankingPage() {
  const { t } = useTranslation();
  return (
    <DailyRankingPage
      endpoint="/api/code/ranking"
      backHref="/code"
      subtitle={t('code.rankingSubtitle')}
      metricHeader={t('code.thSubmissions')}
    />
  );
}
