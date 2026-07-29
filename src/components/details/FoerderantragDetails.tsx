import type { Foerderantrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
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
        <RecordField label="Dokumente hochladen" className="md:col-span-2">
          {record.fields.dateiupload ? (
            <MediaThumbnail src={record.fields.dateiupload as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label="Vorname der Ansprechperson" value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label="Nachname der Ansprechperson" value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label="Telefon der Ansprechperson" value={record.fields.ansprechpartner_telefon} format="text" />
        <RecordField label="E-Mail der Ansprechperson" value={record.fields.ansprechpartner_email} format="email" />
        <RecordField label="Weitere Anmerkungen" value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label="Ich habe die Datenschutzhinweise gelesen und stimme der Verarbeitung meiner Daten zu." value={record.fields.datenschutz} format="bool" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAG} recordId={record.record_id} />
    </>
  );
}
