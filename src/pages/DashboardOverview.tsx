import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Foerderantrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { DashboardSkeleton, DashboardError } from '@/components/DashboardStates';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { StatCardRow, StatCard } from '@/components/StatCard';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { ChartWidget, type ChartRow, type ChartSegment } from '@/components/widgets/ChartWidget';
import {
  useRecordOverlayStack,
  RecordOverlayHost,
  RecordHeader,
  RecordAttachments,
} from '@/components/widgets/RecordView';
import { FoerderantragDetails } from '@/components/details/FoerderantragDetails';
import { FoerderantragDialog } from '@/components/dialogs/FoerderantragDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { IconPlus, IconFileText, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

import { makeT } from '@/i18n';

const tt = makeT({
  de: {
    noch_keine_foerderantraege_einge: 'Noch keine Förderanträge eingegangen.',
    antraege_gesamt_zuletzt_von: '{p0} Anträge gesamt — zuletzt von {p1}.',
    antrag_von_geloescht: 'Antrag von {p0} {p1} gelöscht',
    richte_deine_foerderantrags_verw: 'Richte deine Förderantrags-Verwaltung ein.',
    noch_kein_foerderantrag_erfasst: 'Noch kein Förderantrag erfasst. Erstelle den ersten Antrag und behalte alle Projekte im Überblick.',
    ersten_antrag_erstellen: 'Ersten Antrag erstellen',
    neuer_antrag: 'Neuer Antrag',
    antraege_eingegangen: 'Anträge eingegangen',
    mit_vollst_projekttitel: '{p0} mit vollst. Projekttitel',
    beantragte_foerdersumme: 'Beantragte Fördersumme',
    summe_aller_antraege: 'Summe aller Anträge',
    ohne_datenschutz_zustimmung: 'Ohne Datenschutz-Zustimmung',
    bitte_pruefen: 'Bitte prüfen',
    alle_vollstaendig: 'Alle vollständig',
    antraege: 'Anträge — {p0}',
    neueste_antraege: 'Neueste Anträge',
    unbekannt: 'Unbekannt',
    keine_antraege_in_dieser_kategor: 'Keine Anträge in dieser Kategorie',
    antraege_nach_projektkategorie: 'Anträge nach Projektkategorie',
    projektkategorie: 'Projektkategorie',
    foerdersumme: 'Fördersumme',
    stand: 'Stand:',
    antrag_aktualisiert: 'Antrag aktualisiert',
    antrag_erstellt: 'Antrag erstellt',
    foerderantrag: 'Förderantrag',
    eingegangen: 'Eingegangen:',
    projektstart: '· Projektstart:',
    bearbeiten: 'Bearbeiten',
  },
  en: {
    noch_keine_foerderantraege_einge: 'No funding applications received yet.',
    antraege_gesamt_zuletzt_von: '{p0} applications total — last from {p1}.',
    antrag_von_geloescht: 'Application from {p0} {p1} deleted',
    richte_deine_foerderantrags_verw: 'Set up your funding application management.',
    noch_kein_foerderantrag_erfasst: 'No funding application recorded yet. Create the first application and keep track of all projects.',
    ersten_antrag_erstellen: 'Create First Application',
    neuer_antrag: 'New Application',
    antraege_eingegangen: 'Applications Received',
    mit_vollst_projekttitel: '{p0} with complete project title',
    beantragte_foerdersumme: 'Requested Funding Amount',
    summe_aller_antraege: 'Total of All Applications',
    ohne_datenschutz_zustimmung: 'Without Privacy Consent',
    bitte_pruefen: 'Please Review',
    alle_vollstaendig: 'All Complete',
    antraege: 'Applications — {p0}',
    neueste_antraege: 'Latest Applications',
    unbekannt: 'Unknown',
    keine_antraege_in_dieser_kategor: 'No applications in this category',
    antraege_nach_projektkategorie: 'Applications by Project Category',
    projektkategorie: 'Project Category',
    foerdersumme: 'Funding Amount',
    stand: 'As of:',
    antrag_aktualisiert: 'Application Updated',
    antrag_erstellt: 'Application Created',
    foerderantrag: 'Funding Application',
    eingegangen: 'Received:',
    projektstart: '· Project Start:',
    bearbeiten: 'Edit',
  },
});

type OverlayItem = { type: 'foerderantrag'; record: Foerderantrag };

export default function DashboardOverview() {
  const clock = useClock();
  const {
    foerderantrag,
    setFoerderantrag,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Foerderantrag | null>(null);
  const [filterKat, setFilterKat] = useState<ChartSegment<Foerderantrag> | null>(null);

  const overlay = useRecordOverlayStack<OverlayItem>();

  // --- Hooks BEFORE early returns ---

  const chartRows = useMemo<ChartRow<Foerderantrag>[]>(
    () => foerderantrag.map(r => ({ id: `foerderantrag:${r.record_id}`, data: r })),
    [foerderantrag],
  );

  const byId = useMemo(
    () => new Map(foerderantrag.map(r => [r.record_id, r])),
    [foerderantrag],
  );

  const filteredAntraege = useMemo(
    () => foerderantrag.filter(r => !filterKat || filterKat.test({ id: `foerderantrag:${r.record_id}`, data: r })),
    [foerderantrag, filterKat],
  );

  const neuesteAntraege = useMemo(
    () => [...filteredAntraege].sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? '')).slice(0, 8),
    [filteredAntraege],
  );

  // Finanzielle Kennzahlen
  const gesamtFoerdersumme = useMemo(
    () => foerderantrag.reduce((s, r) => s + (r.fields.beantragte_foerdersumme ?? 0), 0),
    [foerderantrag],
  );

  const datenschutzOhne = useMemo(
    () => foerderantrag.filter(r => !r.fields.datenschutz),
    [foerderantrag],
  );

  const mitProjekttitel = foerderantrag.filter(r => r.fields.projekttitel).length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // --- Context line ---
  const recentNames = namen(neuesteAntraege.map(r =>
    [r.fields.vorname, r.fields.nachname].filter(Boolean).join(' ')
  ));
  const contextLine = (foerderantrag.length === 0 ? tt('noch_keine_foerderantraege_einge') : tt('antraege_gesamt_zuletzt_von', { p0: foerderantrag.length, p1: recentNames }));

  // --- Write helpers ---
  async function handleDelete(r: Foerderantrag) {
    const prev = foerderantrag;
    setFoerderantrag(foerderantrag.filter(x => x.record_id !== r.record_id));
    overlay.close();
    undoToast(
      tt('antrag_von_geloescht', { p0: r.fields.vorname ?? '', p1: r.fields.nachname ?? '' }),
      async () => {
        setFoerderantrag(prev);
      },
    );
    try {
      await LivingAppsService.deleteFoerderantragEntry(r.record_id);
      fetchAll();
    } catch {
      setFoerderantrag(prev);
    }
  }

  // --- Empty state ---
  if (foerderantrag.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{tt('richte_deine_foerderantrags_verw')}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <IconFileText size={48} className="text-muted-foreground" stroke={1.5} />
          <p className="text-muted-foreground text-sm max-w-xs">
            {tt('noch_kein_foerderantrag_erfasst')}
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <IconPlus size={16} className="shrink-0 mr-1" /> {tt('ersten_antrag_erstellen')}
          </Button>
        </div>
        <FoerderantragDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={async (fields) => {
            await LivingAppsService.createFoerderantragEntry(fields);
            fetchAll();
          }}
          enablePhotoScan={AI_PHOTO_SCAN['Foerderantrag']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantrag']}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{contextLine}</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="shrink-0 mr-1" /> {tt('neuer_antrag')}
        </Button>
      </div>

      <DashboardGrid
        variant="split"
        kpis={
          <StatCardRow>
            <StatCard
              title={tt('antraege_eingegangen')}
              value={foerderantrag.length}
              description={tt('mit_vollst_projekttitel', { p0: mitProjekttitel })}
              icon={<IconFileText size={18} className="text-muted-foreground" />}
              tone="default"
              onClick={() => setFilterKat(null)}
              active={filterKat === null}
            />
            <StatCard
              title={tt('beantragte_foerdersumme')}
              value={formatCurrency(gesamtFoerdersumme)}
              description={tt('summe_aller_antraege')}
              icon={<IconCheck size={18} className="text-muted-foreground" />}
              tone="primary"
            />
            <StatCard
              title={tt('ohne_datenschutz_zustimmung')}
              value={datenschutzOhne.length}
              description={(datenschutzOhne.length > 0 ? tt('bitte_pruefen') : tt('alle_vollstaendig'))}
              icon={<IconAlertCircle size={18} className="text-muted-foreground" />}
              tone={datenschutzOhne.length > 0 ? 'warning' : 'default'}
              onClick={() => {
                if (datenschutzOhne.length > 0) {
                  overlay.replace({ type: 'foerderantrag', record: datenschutzOhne[0] });
                }
              }}
            />
          </StatCardRow>
        }
        aside={
          <WorkList
            title={(filterKat ? tt('antraege', { p0: filterKat.label }) : tt('neueste_antraege'))}
            items={neuesteAntraege.map(r => ({
              id: r.record_id,
              title: `${r.fields.vorname ?? ''} ${r.fields.nachname ?? ''}`.trim() || r.fields.organisation_name || tt('unbekannt'),
              secondLine: (
                <>
                  <span className="text-muted-foreground truncate">
                    {r.fields.projekttitel ?? '—'}
                  </span>
                  {r.fields.projektkategorie && (
                    <span className="text-muted-foreground"> · {r.fields.projektkategorie.label}</span>
                  )}
                </>
              ),
            }))}
            onItemClick={id => {
              const rec = byId.get(id);
              if (rec) overlay.replace({ type: 'foerderantrag', record: rec });
            }}
            empty={{
              text: tt('keine_antraege_in_dieser_kategor'),
              action: { label: tt('neuer_antrag'), onClick: () => setDialogOpen(true) },
            }}
          />
        }
        primary={
          <ChartWidget<Foerderantrag>
            title={tt('antraege_nach_projektkategorie')}
            rows={chartRows}
            dimension={{
              kind: 'category',
              accessor: r => r.data.fields.projektkategorie,
              label: tt('projektkategorie'),
            }}
            measure={{
              aggregate: 'sum',
              label: tt('foerdersumme'),
              value: r => r.data.fields.beantragte_foerdersumme ?? null,
              format: 'currency',
            }}
            interaction={{
              mode: 'filter',
              selectedKey: filterKat?.key ?? null,
              onSelect: setFilterKat,
            }}
            footer={<>{tt('stand')} {format(clock, 'dd.MM.yyyy')}</>}
          />
        }
      />

      {/* Dialogs */}
      <FoerderantragDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateFoerderantragEntry(editRecord.record_id, fields);
            undoToast(tt('antrag_aktualisiert'));
          } else {
            await LivingAppsService.createFoerderantragEntry(fields);
            undoToast(tt('antrag_erstellt'));
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        recordId={editRecord?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Foerderantrag']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantrag']}
      />

      {/* Overlay stack */}
      <RecordOverlayHost
        overlay={overlay}
        render={top => {
          const rec = top.record;
          return (
            <>
              <RecordHeader
                title={`${rec.fields.vorname ?? ''} ${rec.fields.nachname ?? ''}`.trim() || rec.fields.organisation_name || tt('foerderantrag')}
                subtitle={rec.fields.projekttitel}
                badges={
                  rec.fields.projektkategorie
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{rec.fields.projektkategorie.label}</span>
                    : undefined
                }
                meta={
                  <span className="text-xs text-muted-foreground">
                    {tt('eingegangen')} {formatDate(rec.createdat)} {tt('projektstart')} {formatDate(rec.fields.projektstart)}
                    {rec.fields.projektende ? ` bis ${formatDate(rec.fields.projektende)}` : ''}
                  </span>
                }
              />
              <FoerderantragDetails record={rec} />
            </>
          );
        }}
        footer={top => ({
          label: tt('bearbeiten'),
          onClick: () => {
            setEditRecord(top.record);
            setDialogOpen(true);
          },
        })}
        onEdit={top => {
          setEditRecord(top.record);
          setDialogOpen(true);
        }}
      />
    </>
  );
}
