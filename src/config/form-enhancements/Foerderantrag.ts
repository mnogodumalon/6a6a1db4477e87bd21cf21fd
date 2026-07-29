// Auto-generated. Per-entity form-enhancements config for "Förderantrag".
// The sandbox sub-agent (Step 0) may overwrite this file with a richer config.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'anrede',
    { row: ['vorname', 'nachname'] },
    'organisation_name',
    'rechtsform',
    { row: ['strasse', 'hausnummer'], cols: '2fr 1fr' },
    { row: ['postleitzahl', 'ort'], cols: '1fr 2fr' },
    'bundesland',
    'telefon',
    'email',
    'webseite',
    'projekttitel',
    'projektkategorie',
    'projektbeschreibung',
    'zielgruppe',
    'projektziele',
    { row: ['projektstart', 'projektende'] },
    'projektort',
    'anzahl_beguenstigte',
    'bereits_durchgefuehrt',
    'vorherige_foerderung',
    'vorherige_foerderung_beschreibung',
    'gesamtkosten',
    'beantragte_foerdersumme',
    'eigenanteil',
    'drittmittel',
    'drittmittel_herkunft',
    'verwendungszweck',
    'foerderart',
    'anlagen',
    { row: ['ansprechpartner_vorname', 'ansprechpartner_nachname'] },
    'ansprechpartner_telefon',
    'ansprechpartner_email',
    'bemerkungen',
    'datenschutz',
  ],
  defaults: {
    'anrede': { kind: 'lookup', key: 'herr', label: 'Herr' },
    'projektstart': { kind: 'today' },
    'projektende': { kind: 'todayOffset', days: 90 },
    'bereits_durchgefuehrt': { kind: 'literal', value: false },
    'vorherige_foerderung': { kind: 'literal', value: false },
    'foerderart': { kind: 'lookup', key: 'zuschuss', label: 'Zuschuss' },
    'datenschutz': { kind: 'literal', value: false },
  },
  computed: {
    'eigenanteil': { op: 'sub', left: { op: 'sub', left: { kind: 'field', key: 'gesamtkosten' }, right: { kind: 'field', key: 'beantragte_foerdersumme' } }, right: { kind: 'field', key: 'drittmittel' } },
    '_kostendeckung_prozent': { op: 'mul', left: { op: 'div', left: { op: 'add', left: { op: 'add', left: { kind: 'field', key: 'beantragte_foerdersumme' }, right: { kind: 'field', key: 'eigenanteil' } }, right: { kind: 'field', key: 'drittmittel' } }, right: { kind: 'field', key: 'gesamtkosten' } }, right: { kind: 'literal', value: 100 } },
    '_kostensumme_geplant': { op: 'add', left: { op: 'add', left: { kind: 'field', key: 'beantragte_foerdersumme' }, right: { kind: 'field', key: 'eigenanteil' } }, right: { kind: 'field', key: 'drittmittel' } },
  },
};

// Build-time-populated field dependencies for MODUS-2 arrow functions in
// `computed`. The sub-agent leaves this empty; scripts/parse-formulas.mjs
// fills it after Step 0 by regex-extracting ctx.* calls from each function
// body. The dialog feeds these into classifyComputed so MODUS-2 entries get
// inline anchors instead of always landing in the aggregate section.
export const computedDeps: Record<string, string[]> = {};

// Build-time-populated applookup (ownKey → lookupKey) pairs found in MODUS-2
// arrow functions. Filled by scripts/parse-formulas.mjs from regex matches
// on `ctx.applookup('x','y')` and `ctx.applookupAny('x','y')`. The dialog
// merges this with MODUS-1 refs extracted at render time, so every numeric
// field the formula pulls from a selected lookup is surfaced as an inline
// hint next to the lookup combobox.
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
