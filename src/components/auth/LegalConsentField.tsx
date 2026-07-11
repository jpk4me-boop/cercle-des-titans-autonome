import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LEGAL_VERSIONS_LABEL } from "@/lib/legalDocuments";

interface LegalConsentFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Phase J4 — Case d'acceptation CGU / politique de confidentialité, affichée
// uniquement en mode création de compte. Jamais précochée ; l'état est piloté
// par le parent et réinitialisé à chaque changement de mode. Les liens
// s'ouvrent dans un nouvel onglet pour ne pas perdre la saisie du formulaire.
export default function LegalConsentField({ checked, onCheckedChange }: LegalConsentFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <Checkbox
          id="legalConsent"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-describedby="legalConsentVersions"
          className="mt-0.5"
        />
        <Label
          htmlFor="legalConsent"
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          J'accepte les{" "}
          <a
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Conditions générales d'utilisation
          </a>{" "}
          et la{" "}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Politique de confidentialité
          </a>
          .
        </Label>
      </div>
      <p id="legalConsentVersions" className="text-xs text-muted-foreground pl-7">
        {LEGAL_VERSIONS_LABEL}
      </p>
    </div>
  );
}
