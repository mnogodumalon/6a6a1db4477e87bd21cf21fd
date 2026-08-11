import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Foerderantrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { FoerderantragDialog } from '@/components/dialogs/FoerderantragDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Foerderantrag';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function FoerderantragDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Foerderantrag | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const list = await LivingAppsService.getFoerderantrag();
      setRecord(list.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Foerderantrag['fields']) {
    if (!record) return;
    await LivingAppsService.updateFoerderantragEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteFoerderantragEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/foerderantrag');
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/foerderantrag')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/foerderantrag')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.vorname ?? appLabel('foerderantrag')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('foerderantrag', 'anrede')} value={record.fields.anrede} format="pill" />
        <RecordField label={fieldLabel('foerderantrag', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'organisation_name')} value={record.fields.organisation_name} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'rechtsform')} value={record.fields.rechtsform} format="pill" />
        <RecordField label={fieldLabel('foerderantrag', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'postleitzahl')} value={record.fields.postleitzahl} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'bundesland')} value={record.fields.bundesland} format="pill" />
        <RecordField label={fieldLabel('foerderantrag', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('foerderantrag', 'webseite')} value={record.fields.webseite} format="url" />
        <RecordField label={fieldLabel('foerderantrag', 'projekttitel')} value={record.fields.projekttitel} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'projektkategorie')} value={record.fields.projektkategorie} format="pill" />
        <RecordField label={fieldLabel('foerderantrag', 'projektbeschreibung')} value={record.fields.projektbeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'zielgruppe')} value={record.fields.zielgruppe} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'projektziele')} value={record.fields.projektziele} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'projektstart')} value={record.fields.projektstart} format="date" />
        <RecordField label={fieldLabel('foerderantrag', 'projektende')} value={record.fields.projektende} format="date" />
        <RecordField label={fieldLabel('foerderantrag', 'projektort')} value={record.fields.projektort} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'anzahl_beguenstigte')} value={record.fields.anzahl_beguenstigte} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'bereits_durchgefuehrt')} value={record.fields.bereits_durchgefuehrt} format="bool" />
        <RecordField label={fieldLabel('foerderantrag', 'vorherige_foerderung')} value={record.fields.vorherige_foerderung} format="bool" />
        <RecordField label={fieldLabel('foerderantrag', 'vorherige_foerderung_beschreibung')} value={record.fields.vorherige_foerderung_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'gesamtkosten')} value={record.fields.gesamtkosten} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'beantragte_foerdersumme')} value={record.fields.beantragte_foerdersumme} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'eigenanteil')} value={record.fields.eigenanteil} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'drittmittel')} value={record.fields.drittmittel} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'drittmittel_herkunft')} value={record.fields.drittmittel_herkunft} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'verwendungszweck')} value={record.fields.verwendungszweck} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'foerderart')} value={record.fields.foerderart} format="pill" />
        <RecordField label={fieldLabel('foerderantrag', 'anlagen')} value={Array.isArray(record.fields.anlagen) ? record.fields.anlagen.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_vorname')} value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_nachname')} value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_telefon')} value={record.fields.ansprechpartner_telefon} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_email')} value={record.fields.ansprechpartner_email} format="email" />
        <RecordField label={fieldLabel('foerderantrag', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'datenschutz')} value={record.fields.datenschutz} format="bool" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAG} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <FoerderantragDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Foerderantrag']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantrag']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('foerderantrag') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
