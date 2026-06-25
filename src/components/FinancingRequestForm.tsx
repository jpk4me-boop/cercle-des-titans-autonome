import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analyticsTracker";

// Counts real words (whitespace-separated, empty tokens ignored).
const countWords = (value: string): number =>
  value.trim().split(/\s+/).filter(Boolean).length;

const MIN_DESCRIPTION_WORDS = 50;

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z.string().trim().email("Adresse email invalide").max(255, "L'email ne peut pas dépasser 255 caractères"),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(20, "Numéro de téléphone trop long"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  projectType: z.string().min(1, "Veuillez sélectionner un type de projet"),
  projectDescription: z
    .string()
    .trim()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .refine(
      (value) => countWords(value) >= MIN_DESCRIPTION_WORDS,
      "Veuillez décrire vos objectifs en au moins 50 mots."
    ),
  amountRequested: z.coerce.number().min(50000, "Le montant minimum est de 50 000 FCFA").max(5000000, "Le montant maximum est de 5 000 000 FCFA"),
});

type FormData = z.infer<typeof formSchema>;

const categories = [
  { value: "bronze", label: "Bronze - Jusqu'à 500 000 FCFA" },
  { value: "silver", label: "Silver - Jusqu'à 1 000 000 FCFA" },
  { value: "gold", label: "Gold - Jusqu'à 2 000 000 FCFA" },
  { value: "diamond", label: "Diamond - Jusqu'à 3 000 000 FCFA" },
  { value: "platinium", label: "Platinium - Jusqu'à 5 000 000 FCFA" },
];

const projectTypes = [
  { value: "commerce", label: "Commerce / Vente" },
  { value: "agriculture", label: "Agriculture / Élevage" },
  { value: "artisanat", label: "Artisanat" },
  { value: "services", label: "Services / Prestations" },
  { value: "immobilier", label: "Immobilier" },
  { value: "technologie", label: "Technologie / Digital" },
  { value: "education", label: "Éducation / Formation" },
  { value: "sante", label: "Santé" },
  { value: "autre", label: "Autre" },
];

interface FinancingRequestFormProps {
  trigger?: React.ReactNode;
}

const FinancingRequestForm = ({ trigger }: FinancingRequestFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      category: "",
      projectType: "",
      projectDescription: "",
      amountRequested: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Use the rate-limited RPC function instead of direct insert
      const { error } = await supabase.rpc("submit_financing_request", {
        _full_name: data.fullName,
        _email: data.email,
        _phone: data.phone,
        _category: data.category,
        _project_type: data.projectType,
        _project_description: data.projectDescription,
        _amount_requested: data.amountRequested,
      });

      if (error) {
        // Handle rate limiting error specifically
        if (error.message.includes("Rate limit")) {
          throw new Error("Vous avez atteint la limite de demandes. Veuillez réessayer dans 24 heures.");
        }
        throw error;
      }

      setIsSuccess(true);
      // Conversion (label fixe, aucune donnée de formulaire transmise).
      void trackEvent("conversion", { label: "financing_request_submit" });
      toast({
        title: "Demande envoyée !",
        description: "Nous avons bien reçu votre demande d'appui. Notre équipe vous contactera sous 48h.",
      });

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        form.reset();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi de votre demande.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsSuccess(false);
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gold hover:bg-gold/90 text-forest font-semibold px-8 py-6 text-lg rounded-full">
            <FileText className="w-5 h-5 mr-2" />
            Demander un appui
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-display text-forest mb-3">Demande envoyée !</h3>
            <p className="text-muted-foreground">
              Notre équipe analysera votre demande et vous contactera dans les 48 heures.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-forest">
                Demande d'appui
              </DialogTitle>
              <DialogDescription>
                Remplissez ce formulaire pour soumettre votre demande d'appui.
                Notre équipe vous recontactera sous 48h.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" aria-required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+237 6XX XXX XXX" aria-required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="votre@email.com" aria-required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie souhaitée *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de projet *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amountRequested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant demandé (FCFA) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500000" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objectifs financiers *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez vos objectifs, votre situation actuelle, vos attentes et la manière dont Cercle des Titans peut vous accompagner. Minimum 50 mots."
                          className="min-h-[120px] resize-none"
                          aria-required
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {countWords(field.value || "")} / {MIN_DESCRIPTION_WORDS} mots
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => void trackEvent("click", { label: "financing_submit_click" })}
                    className="flex-1 bg-gold hover:bg-gold/90 text-forest font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      "Envoyer ma demande"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancingRequestForm;