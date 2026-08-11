import type { Foerderantrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface FoerderantragDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Foerderantrag;
}

export function FoerderantragDetails({
  record,
}: FoerderantragDetailsProps) {
  return (
    <>
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
        <RecordField label={fieldLabel('foerderantrag', 'dateiupload')} className="md:col-span-2">
          {record.fields.dateiupload ? (
            <MediaThumbnail src={record.fields.dateiupload as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_vorname')} value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_nachname')} value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_telefon')} value={record.fields.ansprechpartner_telefon} format="text" />
        <RecordField label={fieldLabel('foerderantrag', 'ansprechpartner_email')} value={record.fields.ansprechpartner_email} format="email" />
        <RecordField label={fieldLabel('foerderantrag', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantrag', 'datenschutz')} value={record.fields.datenschutz} format="bool" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAG} recordId={record.record_id} />
    </>
  );
}
