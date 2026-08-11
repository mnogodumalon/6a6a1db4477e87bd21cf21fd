import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Foerderantrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconTrash, IconPlus, IconSearch, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconFileText } from '@tabler/icons-react';
import { FoerderantragDialog } from '@/components/dialogs/FoerderantragDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

export default function FoerderantragPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Foerderantrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Foerderantrag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Foerderantrag | null>(null);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getFoerderantrag());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Foerderantrag['fields']) {
    await LivingAppsService.createFoerderantragEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Foerderantrag['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateFoerderantragEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteFoerderantragEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title={appLabel('foerderantrag')}
      subtitle={`${records.length} ${t('in_system', { entity: appLabel('foerderantrag') })}`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0 rounded-full shadow-sm">
          <IconPlus className="h-4 w-4 mr-2" /> {t('add')}
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search_entity', { entity: appLabel('foerderantrag') })}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('anrede')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'anrede')}
                  {sortKey === 'anrede' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('vorname')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'vorname')}
                  {sortKey === 'vorname' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('nachname')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'nachname')}
                  {sortKey === 'nachname' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('organisation_name')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'organisation_name')}
                  {sortKey === 'organisation_name' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('rechtsform')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'rechtsform')}
                  {sortKey === 'rechtsform' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('strasse')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'strasse')}
                  {sortKey === 'strasse' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('hausnummer')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'hausnummer')}
                  {sortKey === 'hausnummer' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('postleitzahl')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'postleitzahl')}
                  {sortKey === 'postleitzahl' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('ort')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'ort')}
                  {sortKey === 'ort' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('bundesland')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'bundesland')}
                  {sortKey === 'bundesland' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('telefon')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'telefon')}
                  {sortKey === 'telefon' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('email')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'email')}
                  {sortKey === 'email' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('webseite')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'webseite')}
                  {sortKey === 'webseite' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projekttitel')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projekttitel')}
                  {sortKey === 'projekttitel' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektkategorie')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektkategorie')}
                  {sortKey === 'projektkategorie' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektbeschreibung')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektbeschreibung')}
                  {sortKey === 'projektbeschreibung' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zielgruppe')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'zielgruppe')}
                  {sortKey === 'zielgruppe' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektziele')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektziele')}
                  {sortKey === 'projektziele' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektstart')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektstart')}
                  {sortKey === 'projektstart' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektende')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektende')}
                  {sortKey === 'projektende' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('projektort')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'projektort')}
                  {sortKey === 'projektort' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('anzahl_beguenstigte')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'anzahl_beguenstigte')}
                  {sortKey === 'anzahl_beguenstigte' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('bereits_durchgefuehrt')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'bereits_durchgefuehrt')}
                  {sortKey === 'bereits_durchgefuehrt' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('vorherige_foerderung')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'vorherige_foerderung')}
                  {sortKey === 'vorherige_foerderung' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('vorherige_foerderung_beschreibung')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'vorherige_foerderung_beschreibung')}
                  {sortKey === 'vorherige_foerderung_beschreibung' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('gesamtkosten')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'gesamtkosten')}
                  {sortKey === 'gesamtkosten' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('beantragte_foerdersumme')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'beantragte_foerdersumme')}
                  {sortKey === 'beantragte_foerdersumme' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('eigenanteil')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'eigenanteil')}
                  {sortKey === 'eigenanteil' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('drittmittel')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'drittmittel')}
                  {sortKey === 'drittmittel' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('drittmittel_herkunft')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'drittmittel_herkunft')}
                  {sortKey === 'drittmittel_herkunft' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('verwendungszweck')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'verwendungszweck')}
                  {sortKey === 'verwendungszweck' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('foerderart')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'foerderart')}
                  {sortKey === 'foerderart' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('anlagen')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'anlagen')}
                  {sortKey === 'anlagen' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('dateiupload')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'dateiupload')}
                  {sortKey === 'dateiupload' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('ansprechpartner_vorname')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'ansprechpartner_vorname')}
                  {sortKey === 'ansprechpartner_vorname' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('ansprechpartner_nachname')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'ansprechpartner_nachname')}
                  {sortKey === 'ansprechpartner_nachname' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('ansprechpartner_telefon')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'ansprechpartner_telefon')}
                  {sortKey === 'ansprechpartner_telefon' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('ansprechpartner_email')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'ansprechpartner_email')}
                  {sortKey === 'ansprechpartner_email' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('bemerkungen')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'bemerkungen')}
                  {sortKey === 'bemerkungen' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('datenschutz')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('foerderantrag', 'datenschutz')}
                  {sortKey === 'datenschutz' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; navigate(`/foerderantrag/${record.record_id}`); }}>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{lookupLabel('foerderantrag', 'anrede', record.fields.anrede?.key) ?? record.fields.anrede?.label ?? '—'}</span></TableCell>
                <TableCell className="font-medium">{record.fields.vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.organisation_name ?? '—'}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{lookupLabel('foerderantrag', 'rechtsform', record.fields.rechtsform?.key) ?? record.fields.rechtsform?.label ?? '—'}</span></TableCell>
                <TableCell>{record.fields.strasse ?? '—'}</TableCell>
                <TableCell>{record.fields.hausnummer ?? '—'}</TableCell>
                <TableCell>{record.fields.postleitzahl ?? '—'}</TableCell>
                <TableCell>{record.fields.ort ?? '—'}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{lookupLabel('foerderantrag', 'bundesland', record.fields.bundesland?.key) ?? record.fields.bundesland?.label ?? '—'}</span></TableCell>
                <TableCell>{record.fields.telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.email ?? '—'}</TableCell>
                <TableCell>{record.fields.webseite ?? '—'}</TableCell>
                <TableCell>{record.fields.projekttitel ?? '—'}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{lookupLabel('foerderantrag', 'projektkategorie', record.fields.projektkategorie?.key) ?? record.fields.projektkategorie?.label ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.projektbeschreibung ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.zielgruppe ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.projektziele ?? '—'}</span></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.projektstart)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.projektende)}</TableCell>
                <TableCell>{record.fields.projektort ?? '—'}</TableCell>
                <TableCell>{record.fields.anzahl_beguenstigte ?? '—'}</TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.bereits_durchgefuehrt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.bereits_durchgefuehrt ? t('yes') : t('no')}</span></TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.vorherige_foerderung ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.vorherige_foerderung ? t('yes') : t('no')}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.vorherige_foerderung_beschreibung ?? '—'}</span></TableCell>
                <TableCell>{record.fields.gesamtkosten ?? '—'}</TableCell>
                <TableCell>{record.fields.beantragte_foerdersumme ?? '—'}</TableCell>
                <TableCell>{record.fields.eigenanteil ?? '—'}</TableCell>
                <TableCell>{record.fields.drittmittel ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.drittmittel_herkunft ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.verwendungszweck ?? '—'}</span></TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{lookupLabel('foerderantrag', 'foerderart', record.fields.foerderart?.key) ?? record.fields.foerderart?.label ?? '—'}</span></TableCell>
                <TableCell>{Array.isArray(record.fields.anlagen) ? record.fields.anlagen.map((v: any) => lookupLabel('foerderantrag', 'anlagen', v?.key) ?? v?.label ?? v).join(', ') : '—'}</TableCell>
                <TableCell>{record.fields.dateiupload ? <div className="relative h-8 w-8 rounded bg-muted overflow-hidden"><div className="absolute inset-0 flex items-center justify-center"><IconFileText size={14} className="text-muted-foreground" /></div><img src={record.fields.dateiupload} alt="" className="relative h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /></div> : '—'}</TableCell>
                <TableCell>{record.fields.ansprechpartner_vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.ansprechpartner_nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.ansprechpartner_telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.ansprechpartner_email ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.bemerkungen ?? '—'}</span></TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.datenschutz ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.datenschutz ? t('yes') : t('no')}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={41} className="text-center py-16 text-muted-foreground">
                  {search ? t('no_results') : t('no_data_yet', { entity: appLabel('foerderantrag') })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FoerderantragDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        recordId={editingRecord?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Foerderantrag']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantrag']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('foerderantrag') })}
        description={t('confirm_delete_desc')}
      />

    </PageShell>
  );
}