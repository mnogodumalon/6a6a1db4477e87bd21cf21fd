import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Foerderantrag {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anrede?: LookupValue;
    vorname?: string;
    nachname?: string;
    organisation_name?: string;
    rechtsform?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    ort?: string;
    bundesland?: LookupValue;
    telefon?: string;
    email?: string;
    webseite?: string;
    projekttitel?: string;
    projektkategorie?: LookupValue;
    projektbeschreibung?: string;
    zielgruppe?: string;
    projektziele?: string;
    projektstart?: string; // Format: YYYY-MM-DD oder ISO String
    projektende?: string; // Format: YYYY-MM-DD oder ISO String
    projektort?: string;
    anzahl_beguenstigte?: number;
    bereits_durchgefuehrt?: boolean;
    vorherige_foerderung?: boolean;
    vorherige_foerderung_beschreibung?: string;
    gesamtkosten?: number;
    beantragte_foerdersumme?: number;
    eigenanteil?: number;
    drittmittel?: number;
    drittmittel_herkunft?: string;
    verwendungszweck?: string;
    foerderart?: LookupValue;
    anlagen?: LookupValue[];
    dateiupload?: string;
    ansprechpartner_vorname?: string;
    ansprechpartner_nachname?: string;
    ansprechpartner_telefon?: string;
    ansprechpartner_email?: string;
    bemerkungen?: string;
    datenschutz?: boolean;
  };
}

export const APP_IDS = {
  FOERDERANTRAG: '6a6a1d915f60f3c9b2a99819',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'foerderantrag': {
    anrede: [{ key: "herr", get label() { return lookupLabel('foerderantrag', 'anrede', "herr") ?? "Herr"; } }, { key: "frau", get label() { return lookupLabel('foerderantrag', 'anrede', "frau") ?? "Frau"; } }, { key: "divers", get label() { return lookupLabel('foerderantrag', 'anrede', "divers") ?? "Divers"; } }, { key: "organisation", get label() { return lookupLabel('foerderantrag', 'anrede', "organisation") ?? "Organisation"; } }],
    rechtsform: [{ key: "einzelperson", get label() { return lookupLabel('foerderantrag', 'rechtsform', "einzelperson") ?? "Einzelperson"; } }, { key: "verein", get label() { return lookupLabel('foerderantrag', 'rechtsform', "verein") ?? "Verein (e. V.)"; } }, { key: "gmbh", get label() { return lookupLabel('foerderantrag', 'rechtsform', "gmbh") ?? "GmbH"; } }, { key: "ag", get label() { return lookupLabel('foerderantrag', 'rechtsform', "ag") ?? "AG"; } }, { key: "stiftung", get label() { return lookupLabel('foerderantrag', 'rechtsform', "stiftung") ?? "Stiftung"; } }, { key: "koerperschaft", get label() { return lookupLabel('foerderantrag', 'rechtsform', "koerperschaft") ?? "Körperschaft des öffentlichen Rechts"; } }, { key: "sonstige", get label() { return lookupLabel('foerderantrag', 'rechtsform', "sonstige") ?? "Sonstige"; } }],
    bundesland: [{ key: "bw", get label() { return lookupLabel('foerderantrag', 'bundesland', "bw") ?? "Baden-Württemberg"; } }, { key: "by", get label() { return lookupLabel('foerderantrag', 'bundesland', "by") ?? "Bayern"; } }, { key: "be", get label() { return lookupLabel('foerderantrag', 'bundesland', "be") ?? "Berlin"; } }, { key: "bb", get label() { return lookupLabel('foerderantrag', 'bundesland', "bb") ?? "Brandenburg"; } }, { key: "hb", get label() { return lookupLabel('foerderantrag', 'bundesland', "hb") ?? "Bremen"; } }, { key: "hh", get label() { return lookupLabel('foerderantrag', 'bundesland', "hh") ?? "Hamburg"; } }, { key: "he", get label() { return lookupLabel('foerderantrag', 'bundesland', "he") ?? "Hessen"; } }, { key: "mv", get label() { return lookupLabel('foerderantrag', 'bundesland', "mv") ?? "Mecklenburg-Vorpommern"; } }, { key: "ni", get label() { return lookupLabel('foerderantrag', 'bundesland', "ni") ?? "Niedersachsen"; } }, { key: "nw", get label() { return lookupLabel('foerderantrag', 'bundesland', "nw") ?? "Nordrhein-Westfalen"; } }, { key: "rp", get label() { return lookupLabel('foerderantrag', 'bundesland', "rp") ?? "Rheinland-Pfalz"; } }, { key: "sl", get label() { return lookupLabel('foerderantrag', 'bundesland', "sl") ?? "Saarland"; } }, { key: "sn", get label() { return lookupLabel('foerderantrag', 'bundesland', "sn") ?? "Sachsen"; } }, { key: "st", get label() { return lookupLabel('foerderantrag', 'bundesland', "st") ?? "Sachsen-Anhalt"; } }, { key: "sh", get label() { return lookupLabel('foerderantrag', 'bundesland', "sh") ?? "Schleswig-Holstein"; } }, { key: "th", get label() { return lookupLabel('foerderantrag', 'bundesland', "th") ?? "Thüringen"; } }],
    projektkategorie: [{ key: "bildung", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "bildung") ?? "Bildung & Forschung"; } }, { key: "soziales", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "soziales") ?? "Soziales & Integration"; } }, { key: "umwelt", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "umwelt") ?? "Umwelt & Nachhaltigkeit"; } }, { key: "kultur", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "kultur") ?? "Kultur & Kunst"; } }, { key: "digitalisierung", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "digitalisierung") ?? "Digitalisierung & Innovation"; } }, { key: "gesundheit", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "gesundheit") ?? "Gesundheit & Sport"; } }, { key: "wirtschaft", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "wirtschaft") ?? "Wirtschaft & Beschäftigung"; } }, { key: "sonstiges", get label() { return lookupLabel('foerderantrag', 'projektkategorie', "sonstiges") ?? "Sonstiges"; } }],
    foerderart: [{ key: "zuschuss", get label() { return lookupLabel('foerderantrag', 'foerderart', "zuschuss") ?? "Zuschuss"; } }, { key: "darlehen", get label() { return lookupLabel('foerderantrag', 'foerderart', "darlehen") ?? "Darlehen"; } }, { key: "sachleistung", get label() { return lookupLabel('foerderantrag', 'foerderart', "sachleistung") ?? "Sachleistung"; } }, { key: "sonstiges_foerderart", get label() { return lookupLabel('foerderantrag', 'foerderart', "sonstiges_foerderart") ?? "Sonstiges"; } }],
    anlagen: [{ key: "projektplan", get label() { return lookupLabel('foerderantrag', 'anlagen', "projektplan") ?? "Projektplan"; } }, { key: "kostenaufstellung", get label() { return lookupLabel('foerderantrag', 'anlagen', "kostenaufstellung") ?? "Kostenaufstellung"; } }, { key: "vereinsregister", get label() { return lookupLabel('foerderantrag', 'anlagen', "vereinsregister") ?? "Vereinsregisterauszug"; } }, { key: "handelsregister", get label() { return lookupLabel('foerderantrag', 'anlagen', "handelsregister") ?? "Handelsregisterauszug"; } }, { key: "satzung", get label() { return lookupLabel('foerderantrag', 'anlagen', "satzung") ?? "Satzung"; } }, { key: "jahresabschluss", get label() { return lookupLabel('foerderantrag', 'anlagen', "jahresabschluss") ?? "Jahresabschluss / Bilanz"; } }, { key: "referenzen", get label() { return lookupLabel('foerderantrag', 'anlagen', "referenzen") ?? "Referenzen / Nachweise"; } }, { key: "sonstige_unterlagen", get label() { return lookupLabel('foerderantrag', 'anlagen', "sonstige_unterlagen") ?? "Sonstige Unterlagen"; } }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'foerderantrag': {
    'anrede': 'lookup/radio',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'organisation_name': 'string/text',
    'rechtsform': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'ort': 'string/text',
    'bundesland': 'lookup/select',
    'telefon': 'string/tel',
    'email': 'string/email',
    'webseite': 'string/url',
    'projekttitel': 'string/text',
    'projektkategorie': 'lookup/select',
    'projektbeschreibung': 'string/textarea',
    'zielgruppe': 'string/textarea',
    'projektziele': 'string/textarea',
    'projektstart': 'date/date',
    'projektende': 'date/date',
    'projektort': 'string/text',
    'anzahl_beguenstigte': 'number',
    'bereits_durchgefuehrt': 'bool',
    'vorherige_foerderung': 'bool',
    'vorherige_foerderung_beschreibung': 'string/textarea',
    'gesamtkosten': 'number',
    'beantragte_foerdersumme': 'number',
    'eigenanteil': 'number',
    'drittmittel': 'number',
    'drittmittel_herkunft': 'string/textarea',
    'verwendungszweck': 'string/textarea',
    'foerderart': 'lookup/radio',
    'anlagen': 'multiplelookup/checkbox',
    'dateiupload': 'file',
    'ansprechpartner_vorname': 'string/text',
    'ansprechpartner_nachname': 'string/text',
    'ansprechpartner_telefon': 'string/tel',
    'ansprechpartner_email': 'string/email',
    'bemerkungen': 'string/textarea',
    'datenschutz': 'bool',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateFoerderantrag = StripLookup<Foerderantrag['fields']>;