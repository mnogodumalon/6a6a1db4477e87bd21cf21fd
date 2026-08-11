/**
 * FoerderantragDialog — pre-generated create/edit dialog for Foerderantrag.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * FoerderantragDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Foerderantrag['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<FoerderantragDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Foerderantrag, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, uploadFile, getUserProfile } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Foerderantrag';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode, dataUriToBlob } from '@/lib/ai';
import { lookupKey, lookupKeys } from '@/lib/formatters';

/** Widened prefill type for FoerderantragDialog.defaultValues — see file header. */
export type FoerderantragDialogDefaults = Omit<Foerderantrag['fields'], 'anrede' | 'rechtsform' | 'bundesland' | 'projektkategorie' | 'foerderart' | 'anlagen'> & {
    anrede?: LookupValue | string;
    rechtsform?: LookupValue | string;
    bundesland?: LookupValue | string;
    projektkategorie?: LookupValue | string;
    foerderart?: LookupValue | string;
    anlagen?: (LookupValue | string)[];
  };

interface FoerderantragDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Foerderantrag['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: FoerderantragDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  anrede: LOOKUP_OPTIONS['foerderantrag']?.['anrede'] ?? [],
  rechtsform: LOOKUP_OPTIONS['foerderantrag']?.['rechtsform'] ?? [],
  bundesland: LOOKUP_OPTIONS['foerderantrag']?.['bundesland'] ?? [],
  projektkategorie: LOOKUP_OPTIONS['foerderantrag']?.['projektkategorie'] ?? [],
  foerderart: LOOKUP_OPTIONS['foerderantrag']?.['foerderart'] ?? [],
  anlagen: LOOKUP_OPTIONS['foerderantrag']?.['anlagen'] ?? [],
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  return out;
}

export function FoerderantragDialog({ open, onClose, onSubmit, defaultValues, recordId, enablePhotoScan = true, enablePhotoLocation = true }: FoerderantragDialogProps) {
  const [fields, setFields] = useState<Partial<Foerderantrag['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorname', 'nachname', 'strasse', 'hausnummer', 'postleitzahl', 'ort', 'email', 'projekttitel', 'projektkategorie', 'projektbeschreibung', 'zielgruppe', 'projektziele', 'projektstart', 'projektende', 'gesamtkosten', 'beantragte_foerdersumme', 'verwendungszweck', 'datenschutz'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
    },
  }), []);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Foerderantrag['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'foerderantrag');
      await onSubmit(clean as Foerderantrag['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "anrede": LookupValue | null, // Anrede (select one key: "herr" | "frau" | "divers" | "organisation") mapping: herr=Herr, frau=Frau, divers=Divers, organisation=Organisation\n  "vorname": string | null, // Vorname\n  "nachname": string | null, // Nachname\n  "organisation_name": string | null, // Name der Organisation / Institution\n  "rechtsform": LookupValue | null, // Rechtsform (select one key: "einzelperson" | "verein" | "gmbh" | "ag" | "stiftung" | "koerperschaft" | "sonstige") mapping: einzelperson=Einzelperson, verein=Verein (e. V.), gmbh=GmbH, ag=AG, stiftung=Stiftung, koerperschaft=Körperschaft des öffentlichen Rechts, sonstige=Sonstige\n  "strasse": string | null, // Straße\n  "hausnummer": string | null, // Hausnummer\n  "postleitzahl": string | null, // Postleitzahl\n  "ort": string | null, // Ort\n  "bundesland": LookupValue | null, // Bundesland (select one key: "bw" | "by" | "be" | "bb" | "hb" | "hh" | "he" | "mv" | "ni" | "nw" | "rp" | "sl" | "sn" | "st" | "sh" | "th") mapping: bw=Baden-Württemberg, by=Bayern, be=Berlin, bb=Brandenburg, hb=Bremen, hh=Hamburg, he=Hessen, mv=Mecklenburg-Vorpommern, ni=Niedersachsen, nw=Nordrhein-Westfalen, rp=Rheinland-Pfalz, sl=Saarland, sn=Sachsen, st=Sachsen-Anhalt, sh=Schleswig-Holstein, th=Thüringen\n  "telefon": string | null, // Telefonnummer\n  "email": string | null, // E-Mail-Adresse\n  "webseite": string | null, // Webseite\n  "projekttitel": string | null, // Projekttitel\n  "projektkategorie": LookupValue | null, // Projektkategorie (select one key: "bildung" | "soziales" | "umwelt" | "kultur" | "digitalisierung" | "gesundheit" | "wirtschaft" | "sonstiges") mapping: bildung=Bildung & Forschung, soziales=Soziales & Integration, umwelt=Umwelt & Nachhaltigkeit, kultur=Kultur & Kunst, digitalisierung=Digitalisierung & Innovation, gesundheit=Gesundheit & Sport, wirtschaft=Wirtschaft & Beschäftigung, sonstiges=Sonstiges\n  "projektbeschreibung": string | null, // Projektbeschreibung\n  "zielgruppe": string | null, // Zielgruppe\n  "projektziele": string | null, // Projektziele\n  "projektstart": string | null, // YYYY-MM-DD\n  "projektende": string | null, // YYYY-MM-DD\n  "projektort": string | null, // Durchführungsort\n  "anzahl_beguenstigte": number | null, // Voraussichtliche Anzahl der Begünstigten\n  "bereits_durchgefuehrt": boolean | null, // Wurde das Projekt bereits begonnen?\n  "vorherige_foerderung": boolean | null, // Wurde das Projekt bereits gefördert?\n  "vorherige_foerderung_beschreibung": string | null, // Angaben zur bisherigen Förderung\n  "gesamtkosten": number | null, // Gesamtkosten des Projekts (€)\n  "beantragte_foerdersumme": number | null, // Beantragte Fördersumme (€)\n  "eigenanteil": number | null, // Eigenanteil (€)\n  "drittmittel": number | null, // Drittmittel / weitere Fördermittel (€)\n  "drittmittel_herkunft": string | null, // Herkunft der Drittmittel\n  "verwendungszweck": string | null, // Geplante Mittelverwendung\n  "foerderart": LookupValue | null, // Art der Förderung (select one key: "zuschuss" | "darlehen" | "sachleistung" | "sonstiges_foerderart") mapping: zuschuss=Zuschuss, darlehen=Darlehen, sachleistung=Sachleistung, sonstiges_foerderart=Sonstiges\n  "anlagen": LookupValue[] | null, // Beizufügende Unterlagen (select one or more keys: "projektplan" | "kostenaufstellung" | "vereinsregister" | "handelsregister" | "satzung" | "jahresabschluss" | "referenzen" | "sonstige_unterlagen") mapping: projektplan=Projektplan, kostenaufstellung=Kostenaufstellung, vereinsregister=Vereinsregisterauszug, handelsregister=Handelsregisterauszug, satzung=Satzung, jahresabschluss=Jahresabschluss / Bilanz, referenzen=Referenzen / Nachweise, sonstige_unterlagen=Sonstige Unterlagen\n  "ansprechpartner_vorname": string | null, // Vorname der Ansprechperson\n  "ansprechpartner_nachname": string | null, // Nachname der Ansprechperson\n  "ansprechpartner_telefon": string | null, // Telefon der Ansprechperson\n  "ansprechpartner_email": string | null, // E-Mail der Ansprechperson\n  "bemerkungen": string | null, // Weitere Anmerkungen\n  "datenschutz": boolean | null, // Ich habe die Datenschutzhinweise gelesen und stimme der Verarbeitung meiner Daten zu.\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null) merged[k] = v;
        }
        return merged as Partial<Foerderantrag['fields']>;
      });
      // Upload scanned file to file fields
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        try {
          const blob = dataUriToBlob(uri!);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, dateiupload: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('foerderantrag') })
    : t('new_entity', { entity: appLabel('foerderantrag') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'anrede': (
      <div key="anrede" className="space-y-1.5">
        <Label htmlFor="anrede">{fieldLabel('foerderantrag', 'anrede')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'herr'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'herr' ? undefined : 'herr') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'herr'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'anrede', 'herr') ?? 'Herr'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'frau'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'frau' ? undefined : 'frau') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'frau'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'anrede', 'frau') ?? 'Frau'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'divers'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'divers' ? undefined : 'divers') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'divers'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'anrede', 'divers') ?? 'Divers'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'organisation'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'organisation' ? undefined : 'organisation') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'organisation'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'anrede', 'organisation') ?? 'Organisation'}
          </button>
        </div>
      </div>
    ),
    'vorname': (
      <div key="vorname" className="space-y-1.5">
        <Label htmlFor="vorname">{fieldLabel('foerderantrag', 'vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="vorname"
          placeholder=""
          value={fields.vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.vorname && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'nachname': (
      <div key="nachname" className="space-y-1.5">
        <Label htmlFor="nachname">{fieldLabel('foerderantrag', 'nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="nachname"
          placeholder=""
          value={fields.nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.nachname && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'organisation_name': (
      <div key="organisation_name" className="space-y-1.5">
        <Label htmlFor="organisation_name">{fieldLabel('foerderantrag', 'organisation_name')}</Label>
        <Input
          id="organisation_name"
          placeholder=""
          value={fields.organisation_name ?? ''}
          onChange={e => setFields(f => ({ ...f, organisation_name: e.target.value }))}
        />
      </div>
    ),
    'rechtsform': (
      <div key="rechtsform" className="space-y-1.5">
        <Label htmlFor="rechtsform">{fieldLabel('foerderantrag', 'rechtsform')}</Label>
        <Select
          value={lookupKey(fields.rechtsform) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, rechtsform: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="rechtsform" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="einzelperson">{lookupLabel('foerderantrag', 'rechtsform', 'einzelperson') ?? 'Einzelperson'}</SelectItem>
            <SelectItem value="verein">{lookupLabel('foerderantrag', 'rechtsform', 'verein') ?? 'Verein (e. V.)'}</SelectItem>
            <SelectItem value="gmbh">{lookupLabel('foerderantrag', 'rechtsform', 'gmbh') ?? 'GmbH'}</SelectItem>
            <SelectItem value="ag">{lookupLabel('foerderantrag', 'rechtsform', 'ag') ?? 'AG'}</SelectItem>
            <SelectItem value="stiftung">{lookupLabel('foerderantrag', 'rechtsform', 'stiftung') ?? 'Stiftung'}</SelectItem>
            <SelectItem value="koerperschaft">{lookupLabel('foerderantrag', 'rechtsform', 'koerperschaft') ?? 'Körperschaft des öffentlichen Rechts'}</SelectItem>
            <SelectItem value="sonstige">{lookupLabel('foerderantrag', 'rechtsform', 'sonstige') ?? 'Sonstige'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'strasse': (
      <div key="strasse" className="space-y-1.5">
        <Label htmlFor="strasse">{fieldLabel('foerderantrag', 'strasse')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="strasse"
          placeholder=""
          value={fields.strasse ?? ''}
          onChange={e => setFields(f => ({ ...f, strasse: e.target.value }))}
          required
        />
        {showErrors && !fields.strasse && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'hausnummer': (
      <div key="hausnummer" className="space-y-1.5">
        <Label htmlFor="hausnummer">{fieldLabel('foerderantrag', 'hausnummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="hausnummer"
          placeholder=""
          value={fields.hausnummer ?? ''}
          onChange={e => setFields(f => ({ ...f, hausnummer: e.target.value }))}
          required
        />
        {showErrors && !fields.hausnummer && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'postleitzahl': (
      <div key="postleitzahl" className="space-y-1.5">
        <Label htmlFor="postleitzahl">{fieldLabel('foerderantrag', 'postleitzahl')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="postleitzahl"
          placeholder=""
          value={fields.postleitzahl ?? ''}
          onChange={e => setFields(f => ({ ...f, postleitzahl: e.target.value }))}
          required
        />
        {showErrors && !fields.postleitzahl && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'ort': (
      <div key="ort" className="space-y-1.5">
        <Label htmlFor="ort">{fieldLabel('foerderantrag', 'ort')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="ort"
          placeholder=""
          value={fields.ort ?? ''}
          onChange={e => setFields(f => ({ ...f, ort: e.target.value }))}
          required
        />
        {showErrors && !fields.ort && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'bundesland': (
      <div key="bundesland" className="space-y-1.5">
        <Label htmlFor="bundesland">{fieldLabel('foerderantrag', 'bundesland')}</Label>
        <Select
          value={lookupKey(fields.bundesland) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, bundesland: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="bundesland" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="bw">{lookupLabel('foerderantrag', 'bundesland', 'bw') ?? 'Baden-Württemberg'}</SelectItem>
            <SelectItem value="by">{lookupLabel('foerderantrag', 'bundesland', 'by') ?? 'Bayern'}</SelectItem>
            <SelectItem value="be">{lookupLabel('foerderantrag', 'bundesland', 'be') ?? 'Berlin'}</SelectItem>
            <SelectItem value="bb">{lookupLabel('foerderantrag', 'bundesland', 'bb') ?? 'Brandenburg'}</SelectItem>
            <SelectItem value="hb">{lookupLabel('foerderantrag', 'bundesland', 'hb') ?? 'Bremen'}</SelectItem>
            <SelectItem value="hh">{lookupLabel('foerderantrag', 'bundesland', 'hh') ?? 'Hamburg'}</SelectItem>
            <SelectItem value="he">{lookupLabel('foerderantrag', 'bundesland', 'he') ?? 'Hessen'}</SelectItem>
            <SelectItem value="mv">{lookupLabel('foerderantrag', 'bundesland', 'mv') ?? 'Mecklenburg-Vorpommern'}</SelectItem>
            <SelectItem value="ni">{lookupLabel('foerderantrag', 'bundesland', 'ni') ?? 'Niedersachsen'}</SelectItem>
            <SelectItem value="nw">{lookupLabel('foerderantrag', 'bundesland', 'nw') ?? 'Nordrhein-Westfalen'}</SelectItem>
            <SelectItem value="rp">{lookupLabel('foerderantrag', 'bundesland', 'rp') ?? 'Rheinland-Pfalz'}</SelectItem>
            <SelectItem value="sl">{lookupLabel('foerderantrag', 'bundesland', 'sl') ?? 'Saarland'}</SelectItem>
            <SelectItem value="sn">{lookupLabel('foerderantrag', 'bundesland', 'sn') ?? 'Sachsen'}</SelectItem>
            <SelectItem value="st">{lookupLabel('foerderantrag', 'bundesland', 'st') ?? 'Sachsen-Anhalt'}</SelectItem>
            <SelectItem value="sh">{lookupLabel('foerderantrag', 'bundesland', 'sh') ?? 'Schleswig-Holstein'}</SelectItem>
            <SelectItem value="th">{lookupLabel('foerderantrag', 'bundesland', 'th') ?? 'Thüringen'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'telefon': (
      <div key="telefon" className="space-y-1.5">
        <Label htmlFor="telefon">{fieldLabel('foerderantrag', 'telefon')}</Label>
        <Input
          id="telefon"
          value={fields.telefon ?? ''}
          onChange={e => setFields(f => ({ ...f, telefon: e.target.value }))}
        />
      </div>
    ),
    'email': (
      <div key="email" className="space-y-1.5">
        <Label htmlFor="email">{fieldLabel('foerderantrag', 'email')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="email"
          type="email"
          placeholder=""
          value={fields.email ?? ''}
          onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
        />
        {showErrors && !fields.email && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'webseite': (
      <div key="webseite" className="space-y-1.5">
        <Label htmlFor="webseite">{fieldLabel('foerderantrag', 'webseite')}</Label>
        <Input
          id="webseite"
          value={fields.webseite ?? ''}
          onChange={e => setFields(f => ({ ...f, webseite: e.target.value }))}
        />
      </div>
    ),
    'projekttitel': (
      <div key="projekttitel" className="space-y-1.5">
        <Label htmlFor="projekttitel">{fieldLabel('foerderantrag', 'projekttitel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="projekttitel"
          placeholder=""
          value={fields.projekttitel ?? ''}
          onChange={e => setFields(f => ({ ...f, projekttitel: e.target.value }))}
          required
        />
        {showErrors && !fields.projekttitel && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektkategorie': (
      <div key="projektkategorie" className="space-y-1.5">
        <Label htmlFor="projektkategorie">{fieldLabel('foerderantrag', 'projektkategorie')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.projektkategorie) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, projektkategorie: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="projektkategorie" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="bildung">{lookupLabel('foerderantrag', 'projektkategorie', 'bildung') ?? 'Bildung & Forschung'}</SelectItem>
            <SelectItem value="soziales">{lookupLabel('foerderantrag', 'projektkategorie', 'soziales') ?? 'Soziales & Integration'}</SelectItem>
            <SelectItem value="umwelt">{lookupLabel('foerderantrag', 'projektkategorie', 'umwelt') ?? 'Umwelt & Nachhaltigkeit'}</SelectItem>
            <SelectItem value="kultur">{lookupLabel('foerderantrag', 'projektkategorie', 'kultur') ?? 'Kultur & Kunst'}</SelectItem>
            <SelectItem value="digitalisierung">{lookupLabel('foerderantrag', 'projektkategorie', 'digitalisierung') ?? 'Digitalisierung & Innovation'}</SelectItem>
            <SelectItem value="gesundheit">{lookupLabel('foerderantrag', 'projektkategorie', 'gesundheit') ?? 'Gesundheit & Sport'}</SelectItem>
            <SelectItem value="wirtschaft">{lookupLabel('foerderantrag', 'projektkategorie', 'wirtschaft') ?? 'Wirtschaft & Beschäftigung'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('foerderantrag', 'projektkategorie', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.projektkategorie && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektbeschreibung': (
      <div key="projektbeschreibung" className="space-y-1.5">
        <Label htmlFor="projektbeschreibung">{fieldLabel('foerderantrag', 'projektbeschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="projektbeschreibung"
          placeholder=""
          value={fields.projektbeschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, projektbeschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.projektbeschreibung && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'zielgruppe': (
      <div key="zielgruppe" className="space-y-1.5">
        <Label htmlFor="zielgruppe">{fieldLabel('foerderantrag', 'zielgruppe')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="zielgruppe"
          placeholder=""
          value={fields.zielgruppe ?? ''}
          onChange={e => setFields(f => ({ ...f, zielgruppe: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.zielgruppe && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektziele': (
      <div key="projektziele" className="space-y-1.5">
        <Label htmlFor="projektziele">{fieldLabel('foerderantrag', 'projektziele')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="projektziele"
          placeholder=""
          value={fields.projektziele ?? ''}
          onChange={e => setFields(f => ({ ...f, projektziele: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.projektziele && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektstart': (
      <div key="projektstart" className="space-y-1.5">
        <Label htmlFor="projektstart">{fieldLabel('foerderantrag', 'projektstart')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="projektstart"
          placeholder=""
          mode="date"
          value={fields.projektstart ?? null}
          onChange={v => setFields(f => ({ ...f, projektstart: v ?? undefined }))}
          required
        />
        {showErrors && !fields.projektstart && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektende': (
      <div key="projektende" className="space-y-1.5">
        <Label htmlFor="projektende">{fieldLabel('foerderantrag', 'projektende')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="projektende"
          placeholder=""
          mode="date"
          value={fields.projektende ?? null}
          onChange={v => setFields(f => ({ ...f, projektende: v ?? undefined }))}
          required
        />
        {showErrors && !fields.projektende && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektort': (
      <div key="projektort" className="space-y-1.5">
        <Label htmlFor="projektort">{fieldLabel('foerderantrag', 'projektort')}</Label>
        <Input
          id="projektort"
          placeholder=""
          value={fields.projektort ?? ''}
          onChange={e => setFields(f => ({ ...f, projektort: e.target.value }))}
        />
      </div>
    ),
    'anzahl_beguenstigte': (
      <div key="anzahl_beguenstigte" className="space-y-1.5">
        <Label htmlFor="anzahl_beguenstigte">{fieldLabel('foerderantrag', 'anzahl_beguenstigte')}</Label>
        <Input
          id="anzahl_beguenstigte"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'anzahl_beguenstigte')}
          placeholder=""
          value={fields.anzahl_beguenstigte !== undefined ? fields.anzahl_beguenstigte : (computedValues['anzahl_beguenstigte'] ?? '')}
          onChange={e => setFields(f => ({ ...f, anzahl_beguenstigte: clampNumberValue(formEnhancements, 'anzahl_beguenstigte', e.target.value) }))}
        />
      </div>
    ),
    'bereits_durchgefuehrt': (
      <div key="bereits_durchgefuehrt" className="space-y-1.5">
        <Label htmlFor="bereits_durchgefuehrt">{fieldLabel('foerderantrag', 'bereits_durchgefuehrt')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="bereits_durchgefuehrt"
            checked={!!fields.bereits_durchgefuehrt}
            onCheckedChange={(v) => setFields(f => ({ ...f, bereits_durchgefuehrt: !!v }))}
          />
          <Label htmlFor="bereits_durchgefuehrt" className="font-normal">{fieldLabel('foerderantrag', 'bereits_durchgefuehrt')}</Label>
        </div>
      </div>
    ),
    'vorherige_foerderung': (
      <div key="vorherige_foerderung" className="space-y-1.5">
        <Label htmlFor="vorherige_foerderung">{fieldLabel('foerderantrag', 'vorherige_foerderung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="vorherige_foerderung"
            checked={!!fields.vorherige_foerderung}
            onCheckedChange={(v) => setFields(f => ({ ...f, vorherige_foerderung: !!v }))}
          />
          <Label htmlFor="vorherige_foerderung" className="font-normal">{fieldLabel('foerderantrag', 'vorherige_foerderung')}</Label>
        </div>
      </div>
    ),
    'vorherige_foerderung_beschreibung': (
      <div key="vorherige_foerderung_beschreibung" className="space-y-1.5">
        <Label htmlFor="vorherige_foerderung_beschreibung">{fieldLabel('foerderantrag', 'vorherige_foerderung_beschreibung')}</Label>
        <Textarea
          id="vorherige_foerderung_beschreibung"
          placeholder=""
          value={fields.vorherige_foerderung_beschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, vorherige_foerderung_beschreibung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'gesamtkosten': (
      <div key="gesamtkosten" className="space-y-1.5">
        <Label htmlFor="gesamtkosten">{fieldLabel('foerderantrag', 'gesamtkosten')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="gesamtkosten"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'gesamtkosten')}
          placeholder=""
          value={fields.gesamtkosten !== undefined ? fields.gesamtkosten : (computedValues['gesamtkosten'] ?? '')}
          onChange={e => setFields(f => ({ ...f, gesamtkosten: clampNumberValue(formEnhancements, 'gesamtkosten', e.target.value) }))}
        />
        {showErrors && !fields.gesamtkosten && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'beantragte_foerdersumme': (
      <div key="beantragte_foerdersumme" className="space-y-1.5">
        <Label htmlFor="beantragte_foerdersumme">{fieldLabel('foerderantrag', 'beantragte_foerdersumme')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="beantragte_foerdersumme"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'beantragte_foerdersumme')}
          placeholder=""
          value={fields.beantragte_foerdersumme !== undefined ? fields.beantragte_foerdersumme : (computedValues['beantragte_foerdersumme'] ?? '')}
          onChange={e => setFields(f => ({ ...f, beantragte_foerdersumme: clampNumberValue(formEnhancements, 'beantragte_foerdersumme', e.target.value) }))}
        />
        {showErrors && !fields.beantragte_foerdersumme && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'eigenanteil': (
      <div key="eigenanteil" className="space-y-1.5">
        <Label htmlFor="eigenanteil">{fieldLabel('foerderantrag', 'eigenanteil')}</Label>
        <Input
          id="eigenanteil"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'eigenanteil')}
          placeholder=""
          value={fields.eigenanteil !== undefined ? fields.eigenanteil : (computedValues['eigenanteil'] ?? '')}
          onChange={e => setFields(f => ({ ...f, eigenanteil: clampNumberValue(formEnhancements, 'eigenanteil', e.target.value) }))}
        />
      </div>
    ),
    'drittmittel': (
      <div key="drittmittel" className="space-y-1.5">
        <Label htmlFor="drittmittel">{fieldLabel('foerderantrag', 'drittmittel')}</Label>
        <Input
          id="drittmittel"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'drittmittel')}
          placeholder=""
          value={fields.drittmittel !== undefined ? fields.drittmittel : (computedValues['drittmittel'] ?? '')}
          onChange={e => setFields(f => ({ ...f, drittmittel: clampNumberValue(formEnhancements, 'drittmittel', e.target.value) }))}
        />
      </div>
    ),
    'drittmittel_herkunft': (
      <div key="drittmittel_herkunft" className="space-y-1.5">
        <Label htmlFor="drittmittel_herkunft">{fieldLabel('foerderantrag', 'drittmittel_herkunft')}</Label>
        <Textarea
          id="drittmittel_herkunft"
          placeholder=""
          value={fields.drittmittel_herkunft ?? ''}
          onChange={e => setFields(f => ({ ...f, drittmittel_herkunft: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'verwendungszweck': (
      <div key="verwendungszweck" className="space-y-1.5">
        <Label htmlFor="verwendungszweck">{fieldLabel('foerderantrag', 'verwendungszweck')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="verwendungszweck"
          placeholder=""
          value={fields.verwendungszweck ?? ''}
          onChange={e => setFields(f => ({ ...f, verwendungszweck: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.verwendungszweck && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'foerderart': (
      <div key="foerderart" className="space-y-1.5">
        <Label htmlFor="foerderart">{fieldLabel('foerderantrag', 'foerderart')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.foerderart) === 'zuschuss'}
            onClick={() => setFields(f => ({ ...f, foerderart: (lookupKey(f.foerderart) === 'zuschuss' ? undefined : 'zuschuss') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.foerderart) === 'zuschuss'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'foerderart', 'zuschuss') ?? 'Zuschuss'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.foerderart) === 'darlehen'}
            onClick={() => setFields(f => ({ ...f, foerderart: (lookupKey(f.foerderart) === 'darlehen' ? undefined : 'darlehen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.foerderart) === 'darlehen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'foerderart', 'darlehen') ?? 'Darlehen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.foerderart) === 'sachleistung'}
            onClick={() => setFields(f => ({ ...f, foerderart: (lookupKey(f.foerderart) === 'sachleistung' ? undefined : 'sachleistung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.foerderart) === 'sachleistung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'foerderart', 'sachleistung') ?? 'Sachleistung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.foerderart) === 'sonstiges_foerderart'}
            onClick={() => setFields(f => ({ ...f, foerderart: (lookupKey(f.foerderart) === 'sonstiges_foerderart' ? undefined : 'sonstiges_foerderart') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.foerderart) === 'sonstiges_foerderart'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantrag', 'foerderart', 'sonstiges_foerderart') ?? 'Sonstiges'}
          </button>
        </div>
      </div>
    ),
    'anlagen': (
      <div key="anlagen" className="space-y-1.5">
        <Label htmlFor="anlagen">{fieldLabel('foerderantrag', 'anlagen')}</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_projektplan"
              checked={lookupKeys(fields.anlagen).includes('projektplan')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'projektplan'] : current.filter(k => k !== 'projektplan');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_projektplan" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'projektplan') ?? 'Projektplan'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_kostenaufstellung"
              checked={lookupKeys(fields.anlagen).includes('kostenaufstellung')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'kostenaufstellung'] : current.filter(k => k !== 'kostenaufstellung');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_kostenaufstellung" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'kostenaufstellung') ?? 'Kostenaufstellung'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_vereinsregister"
              checked={lookupKeys(fields.anlagen).includes('vereinsregister')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'vereinsregister'] : current.filter(k => k !== 'vereinsregister');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_vereinsregister" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'vereinsregister') ?? 'Vereinsregisterauszug'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_handelsregister"
              checked={lookupKeys(fields.anlagen).includes('handelsregister')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'handelsregister'] : current.filter(k => k !== 'handelsregister');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_handelsregister" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'handelsregister') ?? 'Handelsregisterauszug'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_satzung"
              checked={lookupKeys(fields.anlagen).includes('satzung')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'satzung'] : current.filter(k => k !== 'satzung');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_satzung" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'satzung') ?? 'Satzung'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_jahresabschluss"
              checked={lookupKeys(fields.anlagen).includes('jahresabschluss')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'jahresabschluss'] : current.filter(k => k !== 'jahresabschluss');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_jahresabschluss" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'jahresabschluss') ?? 'Jahresabschluss / Bilanz'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_referenzen"
              checked={lookupKeys(fields.anlagen).includes('referenzen')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'referenzen'] : current.filter(k => k !== 'referenzen');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_referenzen" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'referenzen') ?? 'Referenzen / Nachweise'}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anlagen_sonstige_unterlagen"
              checked={lookupKeys(fields.anlagen).includes('sonstige_unterlagen')}
              onCheckedChange={(checked) => {
                setFields(f => {
                  const current = lookupKeys(f.anlagen);
                  const next = checked ? [...current, 'sonstige_unterlagen'] : current.filter(k => k !== 'sonstige_unterlagen');
                  return { ...f, anlagen: next.length ? next as any : undefined };
                });
              }}
            />
            <Label htmlFor="anlagen_sonstige_unterlagen" className="font-normal">{lookupLabel('foerderantrag', 'anlagen', 'sonstige_unterlagen') ?? 'Sonstige Unterlagen'}</Label>
          </div>
        </div>
      </div>
    ),
    'dateiupload': (
      <div key="dateiupload" className="space-y-1.5">
        <Label htmlFor="dateiupload">{fieldLabel('foerderantrag', 'dateiupload')}</Label>
        {fields.dateiupload ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.dateiupload}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.dateiupload.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, dateiupload: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, dateiupload: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, dateiupload: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'ansprechpartner_vorname': (
      <div key="ansprechpartner_vorname" className="space-y-1.5">
        <Label htmlFor="ansprechpartner_vorname">{fieldLabel('foerderantrag', 'ansprechpartner_vorname')}</Label>
        <Input
          id="ansprechpartner_vorname"
          placeholder=""
          value={fields.ansprechpartner_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, ansprechpartner_vorname: e.target.value }))}
        />
      </div>
    ),
    'ansprechpartner_nachname': (
      <div key="ansprechpartner_nachname" className="space-y-1.5">
        <Label htmlFor="ansprechpartner_nachname">{fieldLabel('foerderantrag', 'ansprechpartner_nachname')}</Label>
        <Input
          id="ansprechpartner_nachname"
          placeholder=""
          value={fields.ansprechpartner_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, ansprechpartner_nachname: e.target.value }))}
        />
      </div>
    ),
    'ansprechpartner_telefon': (
      <div key="ansprechpartner_telefon" className="space-y-1.5">
        <Label htmlFor="ansprechpartner_telefon">{fieldLabel('foerderantrag', 'ansprechpartner_telefon')}</Label>
        <Input
          id="ansprechpartner_telefon"
          value={fields.ansprechpartner_telefon ?? ''}
          onChange={e => setFields(f => ({ ...f, ansprechpartner_telefon: e.target.value }))}
        />
      </div>
    ),
    'ansprechpartner_email': (
      <div key="ansprechpartner_email" className="space-y-1.5">
        <Label htmlFor="ansprechpartner_email">{fieldLabel('foerderantrag', 'ansprechpartner_email')}</Label>
        <Input
          id="ansprechpartner_email"
          type="email"
          placeholder=""
          value={fields.ansprechpartner_email ?? ''}
          onChange={e => setFields(f => ({ ...f, ansprechpartner_email: e.target.value }))}
        />
      </div>
    ),
    'bemerkungen': (
      <div key="bemerkungen" className="space-y-1.5">
        <Label htmlFor="bemerkungen">{fieldLabel('foerderantrag', 'bemerkungen')}</Label>
        <Textarea
          id="bemerkungen"
          placeholder=""
          value={fields.bemerkungen ?? ''}
          onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'datenschutz': (
      <div key="datenschutz" className="space-y-1.5">
        <Label htmlFor="datenschutz">{fieldLabel('foerderantrag', 'datenschutz')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="datenschutz"
            checked={!!fields.datenschutz}
            onCheckedChange={(v) => setFields(f => ({ ...f, datenschutz: !!v }))}
          />
          <Label htmlFor="datenschutz" className="font-normal">{fieldLabel('foerderantrag', 'datenschutz')}</Label>
        </div>
        {showErrors && !fields.datenschutz && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"anrede": "Anrede", "vorname": "Vorname", "nachname": "Nachname", "organisation_name": "Name der Organisation / Institution", "rechtsform": "Rechtsform", "strasse": "Straße", "hausnummer": "Hausnummer", "postleitzahl": "Postleitzahl", "ort": "Ort", "bundesland": "Bundesland", "telefon": "Telefonnummer", "email": "E-Mail-Adresse", "webseite": "Webseite", "projekttitel": "Projekttitel", "projektkategorie": "Projektkategorie", "projektbeschreibung": "Projektbeschreibung", "zielgruppe": "Zielgruppe", "projektziele": "Projektziele", "projektstart": "Geplanter Projektbeginn", "projektende": "Geplantes Projektende", "projektort": "Durchführungsort", "anzahl_beguenstigte": "Voraussichtliche Anzahl der Begünstigten", "bereits_durchgefuehrt": "Wurde das Projekt bereits begonnen?", "vorherige_foerderung": "Wurde das Projekt bereits gefördert?", "vorherige_foerderung_beschreibung": "Angaben zur bisherigen Förderung", "gesamtkosten": "Gesamtkosten des Projekts (€)", "beantragte_foerdersumme": "Beantragte Fördersumme (€)", "eigenanteil": "Eigenanteil (€)", "drittmittel": "Drittmittel / weitere Fördermittel (€)", "drittmittel_herkunft": "Herkunft der Drittmittel", "verwendungszweck": "Geplante Mittelverwendung", "foerderart": "Art der Förderung", "anlagen": "Beizufügende Unterlagen", "dateiupload": "Dokumente hochladen", "ansprechpartner_vorname": "Vorname der Ansprechperson", "ansprechpartner_nachname": "Nachname der Ansprechperson", "ansprechpartner_telefon": "Telefon der Ansprechperson", "ansprechpartner_email": "E-Mail der Ansprechperson", "bemerkungen": "Weitere Anmerkungen", "datenschutz": "Ich habe die Datenschutzhinweise gelesen und stimme der Verarbeitung meiner Daten zu."};
  const CURRENCY_KEYS = new Set<string>(["gesamtkosten", "beantragte_foerdersumme", "eigenanteil", "drittmittel"]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.FOERDERANTRAG} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}