import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import {
  submitWaitlist,
  WAITLIST_PLANS,
  type WaitlistPlan,
} from "@/services/bourseWaitlistService";

const SUCCESS_TEXT =
  "Votre intérêt a bien été enregistré. L'équipe vous contactera avant l'ouverture officielle des inscriptions.";
const DUPLICATE_TEXT = "Votre intérêt est déjà enregistré pour cette formule.";

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  planInterest: WaitlistPlan | "";
  message: string;
  consent: boolean;
}

const EMPTY: FormState = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  planInterest: "",
  message: "",
  consent: false,
};

/** Liseré or décoratif réutilisé sur les cartes premium. */
const GoldHairline = () => (
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
);

export default function BourseWaitlistForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Validation minimale côté client (le serveur reste la source de vérité).
  const canSubmit =
    form.fullName.trim().length >= 2 &&
    form.phone.trim().length >= 6 &&
    form.planInterest !== "" &&
    form.consent &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || form.planInterest === "") return;

    setSubmitting(true);
    try {
      const result = await submitWaitlist({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        city: form.city,
        planInterest: form.planInterest,
        message: form.message,
        consent: form.consent,
      });

      if (result.ok && "duplicate" in result && result.duplicate) {
        toast.success(DUPLICATE_TEXT);
        setForm(EMPTY);
        setDone(true);
        return;
      }
      if (result.ok) {
        toast.success(SUCCESS_TEXT);
        setForm(EMPTY);
        setDone(true);
        return;
      }
      toast.error(result.message);
    } catch {
      // Filet de sécurité : aucun détail technique affiché au visiteur.
      toast.error(
        "Une difficulté est survenue lors de l'enregistrement. Veuillez réessayer dans un instant.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-card/60 p-8 text-center backdrop-blur-sm">
        <GoldHairline />
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-gold" />
        <h3 className="font-display text-2xl text-foreground">
          Merci pour votre intérêt
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{SUCCESS_TEXT}</p>
        <Button
          variant="outline"
          className="mt-6 rounded-full border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => setDone(false)}
        >
          Envoyer une autre demande
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm md:p-8">
      <GoldHairline />
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="wl-fullname">
              Nom complet <span className="text-gold">*</span>
            </Label>
            <Input
              id="wl-fullname"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Votre nom et prénom"
              autoComplete="name"
              required
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="wl-phone">
              Téléphone (WhatsApp / Mobile Money) <span className="text-gold">*</span>
            </Label>
            <Input
              id="wl-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+237 6XX XXX XXX"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>

          {/* Email (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="wl-email">Email (optionnel)</Label>
            <Input
              id="wl-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </div>

          {/* Ville (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="wl-city">Ville (optionnel)</Label>
            <Input
              id="wl-city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Douala, Yaoundé…"
              autoComplete="address-level2"
            />
          </div>
        </div>

        {/* Formule souhaitée */}
        <div className="space-y-2">
          <Label htmlFor="wl-plan">
            Formule souhaitée <span className="text-gold">*</span>
          </Label>
          <Select
            value={form.planInterest}
            onValueChange={(v) => set("planInterest", v as WaitlistPlan)}
          >
            <SelectTrigger id="wl-plan">
              <SelectValue placeholder="Choisissez une formule" />
            </SelectTrigger>
            <SelectContent>
              {WAITLIST_PLANS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="wl-message">Message (optionnel)</Label>
          <Textarea
            id="wl-message"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Une question ou une précision ?"
            rows={3}
          />
        </div>

        {/* Consentement obligatoire */}
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
          <Checkbox
            id="wl-consent"
            checked={form.consent}
            onCheckedChange={(checked) => set("consent", checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="wl-consent"
            className="text-sm font-normal leading-relaxed text-muted-foreground"
          >
            J'accepte d'être contacté(e) par l'équipe du Cercle des Titans au sujet
            du programme « Bourse Rentrée Titans 2026 ». Mes coordonnées ne seront
            utilisées que dans ce cadre. <span className="text-gold">*</span>
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="w-full rounded-full py-6 text-base font-semibold shadow-lg sm:w-auto sm:px-10"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Rejoindre la liste d'attente
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Aucune inscription officielle ni paiement à cette étape. Vous laissez
          simplement vos coordonnées pour être informé(e) en priorité.
        </p>
      </form>
    </div>
  );
}
