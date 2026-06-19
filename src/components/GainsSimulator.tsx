import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Wallet, Calendar, PiggyBank } from "lucide-react";
import { getSiteMaintenanceFee } from "@/lib/paymentService";
interface GainsSimulatorProps {
  weeklyAmount: number;
  cycleDuration: number;
  groupSize: number;
  categoryName: string;
}
const GainsSimulator = ({
  weeklyAmount,
  cycleDuration,
  groupSize,
  categoryName
}: GainsSimulatorProps) => {
  const [numberOfCycles, setNumberOfCycles] = useState(1);
  const calculations = useMemo(() => {
    const totalContributionsPerCycle = weeklyAmount * cycleDuration;
    const potentialGainPerCycle = weeklyAmount * groupSize;
    const netGainPerCycle = potentialGainPerCycle - totalContributionsPerCycle;
    const totalContributions = totalContributionsPerCycle * numberOfCycles;
    const totalGains = potentialGainPerCycle * numberOfCycles;
    const netProfit = netGainPerCycle * numberOfCycles;
    const totalWeeks = cycleDuration * numberOfCycles;
    const totalMonths = Math.ceil(totalWeeks / 4);
    return {
      totalContributionsPerCycle,
      potentialGainPerCycle,
      netGainPerCycle,
      totalContributions,
      totalGains,
      netProfit,
      totalWeeks,
      totalMonths
    };
  }, [weeklyAmount, cycleDuration, groupSize, numberOfCycles]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };
  const maintenanceFee = getSiteMaintenanceFee(categoryName);
  return <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
            Simulateur de montants
          </h3>
          <p className="text-sm text-muted-foreground">
            Estimez les montants de cycle pour la catégorie {categoryName}
          </p>
        </div>
      </div>

      {/* Slider for number of cycles */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-foreground">
            Nombre de cycles
          </label>
          <span className="text-lg font-bold text-primary">
            {numberOfCycles} {numberOfCycles > 1 ? 'cycles' : 'cycle'}
          </span>
        </div>
        <Slider value={[numberOfCycles]} onValueChange={value => setNumberOfCycles(value[0])} min={1} max={10} step={1} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 cycle</span>
          <span>10 cycles</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Cotisation totale</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(calculations.totalContributions)}
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Montants totaux</span>
          </div>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(calculations.totalGains)}
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <PiggyBank className="w-4 h-4" />
            <span className="text-xs">Solde net</span>
          </div>
          <p className={`text-lg font-bold ${calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {calculations.netProfit >= 0 ? '+' : ''}{formatCurrency(calculations.netProfit)}
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Durée totale</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {calculations.totalWeeks} sem. (~{calculations.totalMonths} mois)
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
        <h4 className="font-semibold text-foreground mb-3">Résumé de votre simulation</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cotisation hebdomadaire :</span>
            <span className="font-medium text-foreground">{formatCurrency(weeklyAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durée par cycle :</span>
            <span className="font-medium text-foreground">{cycleDuration} semaines</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membres par groupe :</span>
            <span className="font-medium text-foreground">{groupSize} membres</span>
          </div>
          {maintenanceFee !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais d'entretien (indicatif) :</span>
              <span className="font-medium text-foreground">+{formatCurrency(maintenanceFee)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant du cycle :</span>
            <span className="font-medium text-primary">{formatCurrency(calculations.potentialGainPerCycle)}</span>
          </div>
          <div className="border-t border-primary/20 pt-2 mt-3">
            <div className="flex justify-between text-base">
              <span className="font-semibold text-foreground">Total sur {numberOfCycles} cycle(s) :</span>
              <span className="font-bold text-primary">{formatCurrency(calculations.totalGains)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        * Cette simulation est purement indicative. Une tontine n'est pas un placement : elle redistribue les cotisations des membres. Les montants réels dépendent de la participation régulière de chacun. Les frais d'entretien du site sont affichés à titre informatif et ne sont pas inclus dans le calcul du solde net.
      </p>
    </div>;
};
export default GainsSimulator;