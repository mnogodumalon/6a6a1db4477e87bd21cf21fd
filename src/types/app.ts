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
    anrede: [{ key: "herr", label: "Herr" }, { key: "frau", label: "Frau" }, { key: "divers", label: "Divers" }, { key: "organisation", label: "Organisation" }],
    rechtsform: [{ key: "einzelperson", label: "Einzelperson" }, { key: "verein", label: "Verein (e. V.)" }, { key: "gmbh", label: "GmbH" }, { key: "ag", label: "AG" }, { key: "stiftung", label: "Stiftung" }, { key: "koerperschaft", label: "Körperschaft des öffentlichen Rechts" }, { key: "sonstige", label: "Sonstige" }],
    bundesland: [{ key: "bw", label: "Baden-Württemberg" }, { key: "by", label: "Bayern" }, { key: "be", label: "Berlin" }, { key: "bb", label: "Brandenburg" }, { key: "hb", label: "Bremen" }, { key: "hh", label: "Hamburg" }, { key: "he", label: "Hessen" }, { key: "mv", label: "Mecklenburg-Vorpommern" }, { key: "ni", label: "Niedersachsen" }, { key: "nw", label: "Nordrhein-Westfalen" }, { key: "rp", label: "Rheinland-Pfalz" }, { key: "sl", label: "Saarland" }, { key: "sn", label: "Sachsen" }, { key: "st", label: "Sachsen-Anhalt" }, { key: "sh", label: "Schleswig-Holstein" }, { key: "th", label: "Thüringen" }],
    projektkategorie: [{ key: "bildung", label: "Bildung & Forschung" }, { key: "soziales", label: "Soziales & Integration" }, { key: "umwelt", label: "Umwelt & Nachhaltigkeit" }, { key: "kultur", label: "Kultur & Kunst" }, { key: "digitalisierung", label: "Digitalisierung & Innovation" }, { key: "gesundheit", label: "Gesundheit & Sport" }, { key: "wirtschaft", label: "Wirtschaft & Beschäftigung" }, { key: "sonstiges", label: "Sonstiges" }],
    foerderart: [{ key: "zuschuss", label: "Zuschuss" }, { key: "darlehen", label: "Darlehen" }, { key: "sachleistung", label: "Sachleistung" }, { key: "sonstiges_foerderart", label: "Sonstiges" }],
    anlagen: [{ key: "projektplan", label: "Projektplan" }, { key: "kostenaufstellung", label: "Kostenaufstellung" }, { key: "vereinsregister", label: "Vereinsregisterauszug" }, { key: "handelsregister", label: "Handelsregisterauszug" }, { key: "satzung", label: "Satzung" }, { key: "jahresabschluss", label: "Jahresabschluss / Bilanz" }, { key: "referenzen", label: "Referenzen / Nachweise" }, { key: "sonstige_unterlagen", label: "Sonstige Unterlagen" }],
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