import type { Foerderantrag } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface FoerderantragViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Foerderantrag | null;
  onEdit: (record: Foerderantrag) => void;
}

export function FoerderantragViewDialog({ open, onClose, record, onEdit }: FoerderantragViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('foerderantrag') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'anrede')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantrag', 'anrede', record.fields.anrede?.key) ?? record.fields.anrede?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'vorname')}</Label>
            <p className="text-sm">{record.fields.vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'nachname')}</Label>
            <p className="text-sm">{record.fields.nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'organisation_name')}</Label>
            <p className="text-sm">{record.fields.organisation_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'rechtsform')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantrag', 'rechtsform', record.fields.rechtsform?.key) ?? record.fields.rechtsform?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'strasse')}</Label>
            <p className="text-sm">{record.fields.strasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'hausnummer')}</Label>
            <p className="text-sm">{record.fields.hausnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'postleitzahl')}</Label>
            <p className="text-sm">{record.fields.postleitzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'ort')}</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'bundesland')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantrag', 'bundesland', record.fields.bundesland?.key) ?? record.fields.bundesland?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'telefon')}</Label>
            <p className="text-sm">{record.fields.telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'email')}</Label>
            <p className="text-sm">{record.fields.email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'webseite')}</Label>
            <p className="text-sm">{record.fields.webseite ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projekttitel')}</Label>
            <p className="text-sm">{record.fields.projekttitel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektkategorie')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantrag', 'projektkategorie', record.fields.projektkategorie?.key) ?? record.fields.projektkategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektbeschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektbeschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'zielgruppe')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zielgruppe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektziele')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektziele ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektstart')}</Label>
            <p className="text-sm">{formatDate(record.fields.projektstart)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektende')}</Label>
            <p className="text-sm">{formatDate(record.fields.projektende)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'projektort')}</Label>
            <p className="text-sm">{record.fields.projektort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'anzahl_beguenstigte')}</Label>
            <p className="text-sm">{record.fields.anzahl_beguenstigte ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'bereits_durchgefuehrt')}</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.bereits_durchgefuehrt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.bereits_durchgefuehrt ? t('yes') : t('no')}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'vorherige_foerderung')}</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.vorherige_foerderung ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.vorherige_foerderung ? t('yes') : t('no')}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'vorherige_foerderung_beschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.vorherige_foerderung_beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'gesamtkosten')}</Label>
            <p className="text-sm">{record.fields.gesamtkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'beantragte_foerdersumme')}</Label>
            <p className="text-sm">{record.fields.beantragte_foerdersumme ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'eigenanteil')}</Label>
            <p className="text-sm">{record.fields.eigenanteil ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'drittmittel')}</Label>
            <p className="text-sm">{record.fields.drittmittel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'drittmittel_herkunft')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.drittmittel_herkunft ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'verwendungszweck')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.verwendungszweck ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'foerderart')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantrag', 'foerderart', record.fields.foerderart?.key) ?? record.fields.foerderart?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'anlagen')}</Label>
            <p className="text-sm">{Array.isArray(record.fields.anlagen) ? record.fields.anlagen.map((v: any) => lookupLabel('foerderantrag', 'anlagen', v?.key) ?? v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'dateiupload')}</Label>
            {record.fields.dateiupload ? (
              <MediaThumbnail src={record.fields.dateiupload} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'ansprechpartner_vorname')}</Label>
            <p className="text-sm">{record.fields.ansprechpartner_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'ansprechpartner_nachname')}</Label>
            <p className="text-sm">{record.fields.ansprechpartner_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'ansprechpartner_telefon')}</Label>
            <p className="text-sm">{record.fields.ansprechpartner_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'ansprechpartner_email')}</Label>
            <p className="text-sm">{record.fields.ansprechpartner_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'bemerkungen')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantrag', 'datenschutz')}</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.datenschutz ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.datenschutz ? t('yes') : t('no')}
            </span>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.FOERDERANTRAG} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}