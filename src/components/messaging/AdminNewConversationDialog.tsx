import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  fetchAdminMembersEnriched,
  AdminMemberEnriched,
} from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';
import { Conversation } from '@/hooks/useMessaging';

interface AdminNewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Branché sur useMessaging.adminStartConversation (RPC sécurisée admin → membre).
  onCreate: (
    memberId: string,
    content: string,
    title?: string
  ) => Promise<Conversation | null>;
}

const memberDisplayName = (m: AdminMemberEnriched) => {
  const name = `${m.first_name || ''} ${m.last_name || ''}`.trim();
  if (name) return name;
  return m.email?.split('@')[0] || 'Membre';
};

const memberInitials = (m: AdminMemberEnriched) => {
  const f = m.first_name?.[0] || '';
  const l = m.last_name?.[0] || '';
  const initials = `${f}${l}`.trim();
  return initials || (m.email?.[0]?.toUpperCase() ?? 'M');
};

const AdminNewConversationDialog = ({
  open,
  onOpenChange,
  onCreate,
}: AdminNewConversationDialogProps) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<AdminMemberEnriched[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Charge la liste des membres (RPC admin-only) à l'ouverture du dialog.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingMembers(true);
    (async () => {
      try {
        const data = await fetchAdminMembersEnriched();
        if (!cancelled) setMembers(data);
      } catch (error) {
        console.error('Error loading members:', error);
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger la liste des membres.',
          });
        }
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  // Réinitialise le formulaire à chaque fermeture.
  useEffect(() => {
    if (!open) {
      setSelectedMemberId('');
      setTitle('');
      setContent('');
      setPickerOpen(false);
    }
  }, [open]);

  const selectedMember = useMemo(
    () => members.find(m => m.user_id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const canSubmit =
    !!selectedMemberId && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const conversation = await onCreate(
      selectedMemberId,
      content.trim(),
      title.trim() || undefined
    );
    setSubmitting(false);
    if (conversation) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau message officiel</DialogTitle>
          <DialogDescription>
            Adressez un message de l'administration à un membre. Le membre pourra
            uniquement répondre à l'administration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sélecteur de membre */}
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="w-full justify-between font-normal"
                  disabled={loadingMembers}
                >
                  {loadingMembers ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement des membres…
                    </span>
                  ) : selectedMember ? (
                    <span className="flex items-center gap-2 truncate">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedMember.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {memberInitials(selectedMember)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {memberDisplayName(selectedMember)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionner un membre…
                    </span>
                  )}
                  <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un membre…" />
                  <CommandList>
                    <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                    <CommandGroup>
                      {members.map(m => (
                        <CommandItem
                          key={m.user_id}
                          value={`${memberDisplayName(m)} ${m.email || ''}`}
                          onSelect={() => {
                            setSelectedMemberId(m.user_id);
                            setPickerOpen(false);
                          }}
                          className="gap-2"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={m.avatar_url || undefined} />
                            <AvatarFallback className="text-[11px]">
                              {memberInitials(m)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm">
                              {memberDisplayName(m)}
                            </span>
                            {m.email && (
                              <span className="truncate text-xs text-muted-foreground">
                                {m.email}
                              </span>
                            )}
                          </div>
                          <Check
                            className={cn(
                              'ml-auto w-4 h-4',
                              selectedMemberId === m.user_id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Sujet / titre */}
          <div className="space-y-2">
            <Label htmlFor="official-title">Sujet (optionnel)</Label>
            <Input
              id="official-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex. Rappel de cotisation"
              maxLength={120}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="official-content">Message</Label>
            <Textarea
              id="official-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Votre message officiel au membre…"
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNewConversationDialog;
