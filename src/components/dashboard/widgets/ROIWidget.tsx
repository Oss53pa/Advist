/**
 * ROI Widget
 * Displays Return on Investment metrics and cost savings
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, TrendingUp, ArrowRight, Zap, PiggyBank, FileCheck } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';
import { analyticsService, ROIData, formatCurrency } from '../../../services/analytics';

interface ROIWidgetProps {
  config: WidgetConfig;
}

export const ROIWidget: React.FC<ROIWidgetProps> = ({ config }) => {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const roiData = await analyticsService.getROI();
        setData(roiData);
      } catch (_err) {
        // Mock data for demo
        setData({
          period: {
            start: '2024-11-01',
            end: '2024-11-30',
            days: 30,
          },
          summary: {
            headline:
              'Depuis ADVIST : -68% temps validation = 234h économisées/mois = 1,4M FCFA économisés',
            totalHoursSaved: 234,
            totalCostSaved: 1400000,
            efficiencyGain: 68,
            currency: 'XOF',
          },
          documentsProcessed: 156,
          timeSavings: {
            validation: {
              hoursSaved: 156,
              perDocument: 1.0,
              reductionPct: 68,
            },
            signature: {
              hoursSaved: 62,
              perDocument: 0.7,
              reductionPct: 45,
            },
            errorCorrection: {
              hoursSaved: 16,
              errorsPrevented: 12,
            },
            totalHours: 234,
            totalHoursPerMonth: 234,
          },
          costSavings: {
            labor: { amount: 1200000, description: "Économies main d'œuvre" },
            errors: { amount: 150000, description: 'Erreurs évitées' },
            paper: { amount: 50000, description: 'Économies papier' },
            total: 1400000,
            perDocument: 8974,
          },
          metrics: {
            costPerValidation: {
              withAdvist: 19200,
              manualEstimate: 48000,
            },
            timeToSignature: {
              withAdvistHours: 18.5,
              manualEstimateHours: 24,
            },
            errorRate: {
              withAdvist: 7.1,
              manualEstimate: 15,
              reductionPct: 52.7,
            },
          },
          comparison: {
            beforeAdvist: {
              validationTimeHours: 8,
              signatureTimeHours: 24,
              errorRatePct: 15,
            },
            withAdvist: {
              validationTimeHours: 2.56,
              signatureTimeHours: 18.5,
              errorRatePct: 7.1,
            },
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4 animate-pulse">
        <div className="h-24 bg-advist-surface-dark rounded-lg"></div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-advist-surface-dark rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.timeSavings) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <PiggyBank size={40} className="text-advist-gray900/30 mb-3" />
        <p className="text-sm text-advist-gray900/70">Pas assez de données pour calculer le ROI</p>
        <p className="text-xs text-advist-gray900/50 mt-1">
          Continuez à utiliser ADVIST pour voir vos économies
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Headline Banner */}
      <div className="bg-gradient-to-r from-advist-navy to-advist-navy/80 text-white p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-advist-gold" />
          <span className="text-sm font-medium opacity-90">Impact ADVIST</span>
        </div>
        <p className="text-sm leading-relaxed">
          <span className="text-advist-success font-bold">-{data.summary.efficiencyGain}%</span>{' '}
          temps validation ={' '}
          <span className="font-bold">{Math.round(data.summary.totalHoursSaved)}h</span> économisées
          ={' '}
          <span className="text-advist-gold font-bold">
            {formatCurrency(data.summary.totalCostSaved, data.summary.currency)}
          </span>
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Hours Saved */}
        <div className="p-3 bg-advist-gold-light rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-advist-gray900" />
            <span className="text-xs font-medium text-advist-gray900">Temps économisé</span>
          </div>
          <p className="text-2xl font-bold text-advist-gray900">
            {Math.round(data.timeSavings.totalHours)}h
          </p>
          <p className="text-xs text-advist-gray900/70">ce mois</p>
        </div>

        {/* Cost Saved */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-advist-success" />
            <span className="text-xs font-medium text-advist-success">Économies</span>
          </div>
          <p className="text-2xl font-bold text-advist-success">
            {formatCurrency(data.costSavings!.total, data.summary.currency)}
          </p>
          <p className="text-xs text-advist-success/70">ce mois</p>
        </div>

        {/* Efficiency Gain */}
        <div className="p-3 bg-advist-surface-dark rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-advist-gray900" />
            <span className="text-xs font-medium text-advist-gray900">Efficacité</span>
          </div>
          <p className="text-2xl font-bold text-advist-gray900">+{data.summary.efficiencyGain}%</p>
          <p className="text-xs text-advist-gray900/70">vs processus manuel</p>
        </div>

        {/* Documents Processed */}
        <div className="p-3 bg-advist-gold-light rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck size={16} className="text-advist-gold-dark" />
            <span className="text-xs font-medium text-advist-gold-dark">Documents</span>
          </div>
          <p className="text-2xl font-bold text-advist-gold-dark">{data.documentsProcessed}</p>
          <p className="text-xs text-advist-gold-dark/70">traités</p>
        </div>
      </div>

      {/* Savings Breakdown */}
      <div className="mt-4 pt-4 border-t border-advist-border">
        <p className="text-xs font-medium text-advist-gray900/50 mb-2 uppercase tracking-wider">
          Détail des économies
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-advist-gray900/70">Main d'œuvre</span>
            <span className="font-medium text-advist-gray900">
              {formatCurrency(data.costSavings!.labor.amount, data.summary.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-advist-gray900/70">Erreurs évitées</span>
            <span className="font-medium text-advist-gray900">
              {formatCurrency(data.costSavings!.errors.amount, data.summary.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-advist-gray900/70">Papier/impression</span>
            <span className="font-medium text-advist-gray900">
              {formatCurrency(data.costSavings!.paper.amount, data.summary.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Link */}
      <Link
        to="/user/analytics/roi"
        className="flex items-center justify-center gap-1 pt-3 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir le détail ROI <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default ROIWidget;
