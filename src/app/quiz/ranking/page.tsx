'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DailyRankingPage } from '@/client/components/DailyRankingPage';

export default function QuizRankingPage() {
  const { t } = useTranslation();
  return (
    <DailyRankingPage
      endpoint="/api/quiz/ranking"
      backHref="/quiz"
      subtitle={t('quiz.rankingSubtitle')}
      metricHeader={t('quiz.thCorrect')}
    />
  );
}
