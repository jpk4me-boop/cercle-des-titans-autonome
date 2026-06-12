import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, RotateCcw, Trophy, Target, Clock, Wallet, Save, Check as CheckIcon, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: { value: string; label: string; score: Record<string, number> }[];
}

const questions: Question[] = [
  {
    id: 'budget',
    question: 'Quel est votre budget hebdomadaire disponible pour épargner ?',
    icon: <Wallet className="h-5 w-5" />,
    options: [
      { value: 'low', label: 'Moins de 10 000 FCFA', score: { bronze: 3, silver: 1, gold: 0, platinum: 0, diamond: 0, prestige: 0 } },
      { value: 'medium-low', label: '10 000 - 25 000 FCFA', score: { bronze: 1, silver: 3, gold: 2, platinum: 0, diamond: 0, prestige: 0 } },
      { value: 'medium', label: '25 000 - 50 000 FCFA', score: { bronze: 0, silver: 1, gold: 3, platinum: 2, diamond: 0, prestige: 0 } },
      { value: 'high', label: '50 000 - 100 000 FCFA', score: { bronze: 0, silver: 0, gold: 1, platinum: 3, diamond: 2, prestige: 1 } },
      { value: 'very-high', label: 'Plus de 100 000 FCFA', score: { bronze: 0, silver: 0, gold: 0, platinum: 1, diamond: 3, prestige: 3 } },
    ],
  },
  {
    id: 'goal',
    question: 'Quel est votre objectif principal ?',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'small-savings', label: 'Constituer une petite épargne de sécurité', score: { bronze: 3, silver: 2, gold: 1, platinum: 0, diamond: 0, prestige: 0 } },
      { value: 'project', label: 'Financer un projet personnel (équipement, voyage)', score: { bronze: 1, silver: 3, gold: 3, platinum: 2, diamond: 1, prestige: 0 } },
      { value: 'investment', label: 'Investir dans un projet important (immobilier, véhicule)', score: { bronze: 0, silver: 0, gold: 1, platinum: 3, diamond: 3, prestige: 2 } },
      { value: 'wealth', label: 'Construire un patrimoine significatif', score: { bronze: 0, silver: 0, gold: 0, platinum: 1, diamond: 2, prestige: 3 } },
    ],
  },
  {
    id: 'duration',
    question: 'Quelle durée de cycle préférez-vous ?',
    icon: <Clock className="h-5 w-5" />,
    options: [
      { value: 'short', label: 'Court (10 semaines)', score: { bronze: 3, silver: 3, gold: 0, platinum: 0, diamond: 0, prestige: 0 } },
      { value: 'medium', label: 'Moyen (12-15 semaines)', score: { bronze: 0, silver: 0, gold: 3, platinum: 3, diamond: 0, prestige: 0 } },
      { value: 'long', label: 'Long (20 semaines)', score: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 3, prestige: 3 } },
    ],
  },
  {
    id: 'experience',
    question: 'Avez-vous déjà participé à une tontine ?',
    icon: <Trophy className="h-5 w-5" />,
    options: [
      { value: 'never', label: 'Non, c\'est ma première fois', score: { bronze: 3, silver: 2, gold: 1, platinum: 0, diamond: 0, prestige: 0 } },
      { value: 'few', label: 'Oui, quelques fois', score: { bronze: 1, silver: 2, gold: 3, platinum: 2, diamond: 1, prestige: 0 } },
      { value: 'experienced', label: 'Oui, je suis un habitué', score: { bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 3, prestige: 2 } },
      { value: 'expert', label: 'Oui, je suis un expert', score: { bronze: 0, silver: 0, gold: 1, platinum: 2, diamond: 2, prestige: 3 } },
    ],
  },
];

const categories = {
  bronze: { name: 'Bronze', slug: 'bronze', color: 'text-amber-700', amount: '5 000 FCFA/semaine', gain: '50 000 FCFA' },
  silver: { name: 'Silver', slug: 'silver', color: 'text-slate-400', amount: '10 000 FCFA/semaine', gain: '100 000 FCFA' },
  gold: { name: 'Gold', slug: 'gold', color: 'text-yellow-500', amount: '25 000 FCFA/semaine', gain: '300 000 FCFA' },
  platinum: { name: 'Platinum', slug: 'platinum', color: 'text-cyan-400', amount: '50 000 FCFA/semaine', gain: '600 000 FCFA' },
  diamond: { name: 'Diamond', slug: 'diamond', color: 'text-blue-400', amount: '100 000 FCFA/semaine', gain: '2 000 000 FCFA' },
  prestige: { name: 'Prestige', slug: 'prestige', color: 'text-purple-500', amount: '200 000 FCFA/semaine', gain: '4 000 000 FCFA' },
};

export default function CategoryRecommender() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateRecommendation = () => {
    const scores: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
      prestige: 0,
    };

    questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find((opt) => opt.value === answer);
        if (option) {
          Object.entries(option.score).forEach(([category, score]) => {
            scores[category] += score;
          });
        }
      }
    });

    const bestCategory = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    setRecommendation(bestCategory);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      calculateRecommendation();
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendation(null);
    setIsSaved(false);
  };

  const handleSaveRecommendation = async () => {
    if (!user || !recommendation) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ recommended_category: recommendation })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSaved(true);
      toast.success('Recommandation sauvegardée dans votre profil !');
    } catch (error) {
      console.error('Error saving recommendation:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isAnswered = currentQuestion && answers[currentQuestion.id];

  if (recommendation) {
    const rec = categories[recommendation as keyof typeof categories];
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Notre recommandation pour vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-sm text-muted-foreground">La catégorie idéale pour votre profil</p>
            <h3 className={`text-4xl font-bold ${rec.color}`}>{rec.name}</h3>
            <div className="mt-4 space-y-1 text-muted-foreground">
              <p>{rec.amount}</p>
              <p className="text-lg font-semibold text-foreground">Gain potentiel: {rec.gain}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate(`/categories/${rec.slug}`)}
              className="flex-1 gap-2"
            >
              Découvrir cette catégorie
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Recommencer
            </Button>
          </div>

          {/* Save recommendation section */}
          <div className="border-t border-border pt-4 mt-2">
            {user ? (
              <Button
                onClick={handleSaveRecommendation}
                disabled={isSaving || isSaved}
                variant={isSaved ? "outline" : "secondary"}
                className="w-full gap-2"
              >
                {isSaved ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    Sauvegardé dans votre profil
                  </>
                ) : isSaving ? (
                  'Sauvegarde en cours...'
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sauvegarder dans mon profil
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Connectez-vous pour sauvegarder cette recommandation
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Trouvez votre catégorie idéale
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {currentQuestion.icon}
          </div>
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
        </div>

        <RadioGroup
          value={answers[currentQuestion.id] || ''}
          onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-all cursor-pointer hover:border-primary/50 ${
                answers[currentQuestion.id] === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              onClick={() => handleAnswer(currentQuestion.id, option.value)}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1"
            >
              Précédent
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex-1 gap-2"
          >
            {currentStep < questions.length - 1 ? 'Suivant' : 'Voir ma recommandation'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
