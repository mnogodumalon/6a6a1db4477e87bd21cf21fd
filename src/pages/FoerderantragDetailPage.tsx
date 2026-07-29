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
        title="Eintrag nicht gefunden"
        action={
          <Button variant="ghost" onClick={() => navigate('/foerderantrag')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            Zurück
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/foerderantrag')}
      onEdit={() => setEditing(true)}
      backLabel="Zurück"
      editLabel="Bearbeiten"
    >
      <RecordHeader title={record.fields.vorname ?? 'Förderantrag'} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
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

      <RecordSection title="Details" cols={2}>
        <RecordField label="Anrede" value={record.fields.anrede} format="pill" />
        <RecordField label="Vorname" value={record.fields.vorname} format="text" />
        <RecordField label="Nachname" value={record.fields.nachname} format="text" />
        <RecordField label="Name der Organisation / Institution" value={record.fields.organisation_name} format="text" />
        <RecordField label="Rechtsform" value={record.fields.rechtsform} format="pill" />
        <RecordField label="Straße" value={record.fields.strasse} format="text" />
        <RecordField label="Hausnummer" value={record.fields.hausnummer} format="text" />
        <RecordField label="Postleitzahl" value={record.fields.postleitzahl} format="text" />
        <RecordField label="Ort" value={record.fields.ort} format="text" />
        <RecordField label="Bundesland" value={record.fields.bundesland} format="pill" />
        <RecordField label="Telefonnummer" value={record.fields.telefon} format="text" />
        <RecordField label="E-Mail-Adresse" value={record.fields.email} format="email" />
        <RecordField label="Webseite" value={record.fields.webseite} format="url" />
        <RecordField label="Projekttitel" value={record.fields.projekttitel} format="text" />
        <RecordField label="Projektkategorie" value={record.fields.projektkategorie} format="pill" />
        <RecordField label="Projektbeschreibung" value={record.fields.projektbeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label="Zielgruppe" value={record.fields.zielgruppe} format="longtext" className="md:col-span-2" />
        <RecordField label="Projektziele" value={record.fields.projektziele} format="longtext" className="md:col-span-2" />
        <RecordField label="Geplanter Projektbeginn" value={record.fields.projektstart} format="date" />
        <RecordField label="Geplantes Projektende" value={record.fields.projektende} format="date" />
        <RecordField label="Durchführungsort" value={record.fields.projektort} format="text" />
        <RecordField label="Voraussichtliche Anzahl der Begünstigten" value={record.fields.anzahl_beguenstigte} format="text" />
        <RecordField label="Wurde das Projekt bereits begonnen?" value={record.fields.bereits_durchgefuehrt} format="bool" />
        <RecordField label="Wurde das Projekt bereits gefördert?" value={record.fields.vorherige_foerderung} format="bool" />
        <RecordField label="Angaben zur bisherigen Förderung" value={record.fields.vorherige_foerderung_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label="Gesamtkosten des Projekts (€)" value={record.fields.gesamtkosten} format="text" />
        <RecordField label="Beantragte Fördersumme (€)" value={record.fields.beantragte_foerdersumme} format="text" />
        <RecordField label="Eigenanteil (€)" value={record.fields.eigenanteil} format="text" />
        <RecordField label="Drittmittel / weitere Fördermittel (€)" value={record.fields.drittmittel} format="text" />
        <RecordField label="Herkunft der Drittmittel" value={record.fields.drittmittel_herkunft} format="longtext" className="md:col-span-2" />
        <RecordField label="Geplante Mittelverwendung" value={record.fields.verwendungszweck} format="longtext" className="md:col-span-2" />
        <RecordField label="Art der Förderung" value={record.fields.foerderart} format="pill" />
        <RecordField label="Beizufügende Unterlagen" value={Array.isArray(record.fields.anlagen) ? record.fields.anlagen.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label="Vorname der Ansprechperson" value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label="Nachname der Ansprechperson" value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label="Telefon der Ansprechperson" value={record.fields.ansprechpartner_telefon} format="text" />
        <RecordField label="E-Mail der Ansprechperson" value={record.fields.ansprechpartner_email} format="email" />
        <RecordField label="Weitere Anmerkungen" value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label="Ich habe die Datenschutzhinweise gelesen und stimme der Verarbeitung meiner Daten zu." value={record.fields.datenschutz} format="bool" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAG} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          Löschen
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
        title="Förderantrag löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </RecordView>
  );
}
