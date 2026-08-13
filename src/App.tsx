import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BlueprintSelector } from './components/BlueprintSelector';
import { EnergyTrajectoryChart } from './components/EnergyTrajectoryChart';
import { TrackList } from './components/TrackList';
import { CamelotWheelModal } from './components/CamelotWheelModal';
import { TransitionInspectorModal } from './components/TransitionInspectorModal';
import { DualDeckPlayer } from './components/DualDeckPlayer';
import { AudioImporterModal } from './components/AudioImporterModal';
import { AddTrackModal } from './components/AddTrackModal';
import { CreateTransitionsModal } from './components/CreateTransitionsModal';
import { CreateMashupModal } from './components/CreateMashupModal';
import { AIMusicMixerModal } from './components/AIMusicMixerModal';
import { ExportModal } from './components/ExportModal';
import { ExportSetModal } from './components/ExportSetModal';
import { DJRegistrationModal } from './components/DJRegistrationModal';
import { AdminModal } from './components/AdminModal';
import { UpgradeModal } from './components/UpgradeModal';
import { Upload, Sparkles } from 'lucide-react';

import { BlueprintType, Crate, DJRegistration, SortingParameters, Track } from './types';
import { sortPlaylist, BLUEPRINTS } from './lib/sortingAlgorithm';
import { analyzeAudioFile } from './lib/audioAnalyzer';
import { parseRekordboxXml } from './lib/exporters';
import { getUserSubscriptionTier, FeaturePermission, checkPermissionGuard, hasPermission, isAdminAuthenticated as checkIsAdmin, setAdminAuthenticated } from './lib/rbac';

const INITIAL_CRATES: Crate[] = [
  {
    id: 'crate-main',
    name: 'My Mix Set',
    description: 'Upload local audio files to auto-sort and render your set mix',
    blueprint: 'PEAK_MOUNTAIN',
    createdAt: new Date().toISOString(),
    tracks: [],
  },
];

export default function App() {
  const [crates, setCrates] = useState<Crate[]>(INITIAL_CRATES);
  const [activeCrateId, setActiveCrateId] = useState<string>(INITIAL_CRATES[0].id);

  // Active tracks in the current workspace
  const activeCrate = useMemo(() => {
    return crates.find((c) => c.id === activeCrateId) || crates[0] || INITIAL_CRATES[0];
  }, [crates, activeCrateId]);

  const [tracks, setTracks] = useState<Track[]>(activeCrate?.tracks || []);
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintType>(activeCrate?.blueprint || 'PEAK_MOUNTAIN');

  const [customCurve, setCustomCurve] = useState<number[]>([4, 5, 6, 7, 8, 9, 8, 7, 6, 5]);

  const [params, setParams] = useState<SortingParameters>({
    maxBpmDrift: 4,
    keyPriorityWeight: 1.0,
    avoidFrequencyClash: true,
    allowEnergyBoosts: true,
    strictMode: true,
  });

  const [lockedTrackIds, setLockedTrackIds] = useState<Set<string>>(new Set());
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [analyzingStatus, setAnalyzingStatus] = useState<string | null>(null);

  // Modals state
  const [isCamelotOpen, setIsCamelotOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isCreateTransitionsOpen, setIsCreateTransitionsOpen] = useState(false);
  const [isCreateMashupOpen, setIsCreateMashupOpen] = useState(false);
  const [selectedTrackForMashupId, setSelectedTrackForMashupId] = useState<string | null>(null);
  const [isAIMixerOpen, setIsAIMixerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDualDeckOpen, setIsDualDeckOpen] = useState(false);
  const [isDJRegistrationOpen, setIsDJRegistrationOpen] = useState(false);
  const [djModalTab, setDjModalTab] = useState<'REGISTER' | 'STATUS'>('REGISTER');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [activeDJ, setActiveDJ] = useState<DJRegistration | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(checkIsAdmin());

  const [selectedTransitionIdx, setSelectedTransitionIdx] = useState<number | null>(null);
  const [deckATrack, setDeckATrack] = useState<Track | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<Track | null>(null);

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeRequiredFeature, setUpgradeRequiredFeature] = useState<FeaturePermission | null>(null);

  // Active modal computing for seamless Back navigation
  const activeModalTitle = useMemo(() => {
    if (isAIMixerOpen) return 'AI Music Mixer';
    if (isCreateTransitionsOpen) return 'Set Audio Renderer';
    if (isImporterOpen) return 'Audio Importer';
    if (isExportOpen) return 'Export Set';
    if (isDualDeckOpen) return 'Dual Deck Player';
    if (isCamelotOpen) return 'Camelot Wheel';
    if (isDJRegistrationOpen) return 'DJ Registration';
    if (isAdminOpen) return 'Admin Studio';
    if (isUpgradeOpen) return 'Subscription Plans';
    if (selectedTransitionIdx !== null) return 'Transition Inspector';
    if (isCreateMashupOpen) return 'Mashup Creator';
    if (isAddTrackOpen) return 'Add Track';
    return null;
  }, [
    isAIMixerOpen,
    isCreateTransitionsOpen,
    isImporterOpen,
    isExportOpen,
    isDualDeckOpen,
    isCamelotOpen,
    isDJRegistrationOpen,
    isAdminOpen,
    isUpgradeOpen,
    selectedTransitionIdx,
    isCreateMashupOpen,
    isAddTrackOpen,
  ]);

  const handleBackToStudio = useCallback(() => {
    setIsAIMixerOpen(false);
    setIsCreateTransitionsOpen(false);
    setIsImporterOpen(false);
    setIsExportOpen(false);
    setIsDualDeckOpen(false);
    setIsCamelotOpen(false);
    setIsDJRegistrationOpen(false);
    setIsAdminOpen(false);
    setIsUpgradeOpen(false);
    setSelectedTransitionIdx(null);
    setIsCreateMashupOpen(false);
    setIsAddTrackOpen(false);
  }, []);

  // Keyboard Escape listener for back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModalTitle) {
        handleBackToStudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalTitle, handleBackToStudio]);

  const handleOpenUpgradeModal = (feature?: FeaturePermission) => {
    setUpgradeRequiredFeature(feature || null);
    setIsUpgradeOpen(true);
  };

  const handleOpenAIMixerWithGuard = () => {
    if (!hasPermission('AI_MIXER')) {
      handleOpenUpgradeModal('AI_MIXER');
      return;
    }
    setIsAIMixerOpen(true);
  };

  const handleOpenExportWithGuard = () => {
    if (!hasPermission('PLAYLIST_EXPORTS')) {
      handleOpenUpgradeModal('PLAYLIST_EXPORTS');
      return;
    }
    setIsExportOpen(true);
  };

  const handleOpenImporterWithGuard = () => {
    setIsImporterOpen(true);
  };

  // When active crate changes, update local tracks
  useEffect(() => {
    if (activeCrate) {
      setTracks(activeCrate.tracks);
      setSelectedBlueprint(activeCrate.blueprint);
    }
  }, [activeCrateId]);

  // Sync active tracks back to crates state
  useEffect(() => {
    setCrates((prev) =>
      prev.map((c) =>
        c.id === activeCrateId ? { ...c, tracks, blueprint: selectedBlueprint } : c
      )
    );
  }, [tracks, selectedBlueprint, activeCrateId]);

  // Run auto-sorting engine
  const handleRunSort = () => {
    if (tracks.length === 0) return;
    setIsSorting(true);

    setTimeout(() => {
      const { sortedTracks } = sortPlaylist(
        tracks,
        selectedBlueprint,
        params,
        selectedBlueprint === 'CUSTOM' ? customCurve : undefined
      );

      setTracks(sortedTracks);
      setIsSorting(false);
    }, 400);
  };

  // Compute live transitions between consecutive tracks
  const { sortedTracks, transitions } = useMemo(() => {
    return sortPlaylist(
      tracks,
      selectedBlueprint,
      params,
      selectedBlueprint === 'CUSTOM' ? customCurve : undefined
    );
  }, [tracks, selectedBlueprint, params, customCurve]);

  // Manual reordering of tracks in playlist
  const handleMoveTrack = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    const updated = [...tracks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setTracks(updated);
  };

  // Remove track
  const handleRemoveTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle lock track position
  const handleToggleLock = (id: string) => {
    setLockedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add imported tracks & auto-sort into optimal set sequence
  const handleAddTracks = useCallback((newTracks: Track[], crateName?: string) => {
    const tier = getUserSubscriptionTier();
    
    if (tier === 'FREE') {
      const currentCount = tracks.length;
      if (currentCount >= 10) {
        handleOpenUpgradeModal('UNLIMITED_TRACKS');
        return;
      }
      if (currentCount + newTracks.length > 10) {
        handleOpenUpgradeModal('UNLIMITED_TRACKS');
        // Limit to remaining capacity for Free tier
        const allowedCount = Math.max(0, 10 - currentCount);
        newTracks = newTracks.slice(0, allowedCount);
      }
    }

    if (crateName) {
      const newCrateId = `crate-${Date.now()}`;
      const { sortedTracks } = sortPlaylist(
        newTracks,
        selectedBlueprint,
        params,
        selectedBlueprint === 'CUSTOM' ? customCurve : undefined
      );

      const newCrate: Crate = {
        id: newCrateId,
        name: crateName,
        description: `Imported playlist crate with ${newTracks.length} tracks`,
        blueprint: selectedBlueprint,
        createdAt: new Date().toISOString(),
        tracks: sortedTracks,
      };
      setCrates((prev) => [newCrate, ...prev]);
      setActiveCrateId(newCrateId);
    } else {
      setTracks((prev) => {
        const combined = [...prev, ...newTracks];
        const { sortedTracks } = sortPlaylist(
          combined,
          selectedBlueprint,
          params,
          selectedBlueprint === 'CUSTOM' ? customCurve : undefined
        );
        return sortedTracks;
      });
    }
  }, [tracks.length, selectedBlueprint, params, customCurve]);

  // Process uploaded audio or XML files directly
  const handleUploadAudioFiles = useCallback(async (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    setAnalyzingStatus(`Analyzing ${files.length} track(s) via Web Audio API...`);
    const newTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setAnalyzingStatus(`Analyzing (${i + 1}/${files.length}): ${file.name}`);

      if (file.name.toLowerCase().endsWith('.xml')) {
        try {
          const text = await file.text();
          const xmlTracks = parseRekordboxXml(text);
          newTracks.push(...xmlTracks);
        } catch (err) {
          console.warn('XML parse error:', err);
        }
      } else {
        const analysis = await analyzeAudioFile(file);
        newTracks.push({
          id: `track-upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          title: analysis.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Uploaded Artist',
          genre: 'Electronic',
          bpm: analysis.bpm || 124,
          key: analysis.key || { code: '8A', number: 8, letter: 'A', musicalKey: 'A minor' },
          des: analysis.des || 5.5,
          durationSeconds: analysis.durationSeconds || 300,
          spectral: analysis.spectral || {
            subBassWeight: 5.0,
            midRangeDensity: 5.0,
            highFrequencyRatio: 5.0,
            dominantFrequencyHz: 80,
            percussiveDensity: 5.0,
            rmsDb: -16.0,
          },
          cuePoints: analysis.cuePoints || [],
          waveformPeaks: analysis.waveformPeaks || [],
          fileName: file.name,
          fileObject: file,
          audioBuffer: analysis.audioBuffer,
        });
      }
    }

    if (newTracks.length > 0) {
      handleAddTracks(newTracks);
    }
    setAnalyzingStatus(null);
  }, [handleAddTracks]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadAudioFiles(e.dataTransfer.files);
    }
  };

  // Open Audition in Dual Deck
  const handleAuditionTrack = (track: Track) => {
    setDeckATrack(track);
    const nextIdx = tracks.findIndex((t) => t.id === track.id) + 1;
    if (nextIdx < tracks.length) {
      setDeckBTrack(tracks[nextIdx]);
    } else {
      setDeckBTrack(null);
    }
    setIsDualDeckOpen(true);
  };

  const handleAuditionTransition = (fromTrack: Track, toTrack: Track) => {
    setDeckATrack(fromTrack);
    setDeckBTrack(toTrack);
    setSelectedTransitionIdx(null);
    setIsDualDeckOpen(true);
  };

  const handleOpenCreateMix = () => {
    if (tracks.length > 0) {
      handleRunSort();
    }
    setIsCreateTransitionsOpen(true);
  };

  const handleOpenMashupModal = (trackId?: string) => {
    setSelectedTrackForMashupId(trackId || null);
    setIsCreateMashupOpen(true);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative pb-16 md:pb-0"
    >
      {/* PWA Installation Banner */}
      <PWAInstallBanner />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-[#ff4e00] animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-[#ff4e00]/20 border border-[#ff4e00] text-[#ff4e00] flex items-center justify-center mb-6 shadow-2xl shadow-[#ff4e00]/30 animate-bounce">
            <Upload className="w-12 h-12 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold font-mono text-white tracking-wider mb-2">
            DROP AUDIO FILES TO ADD TO "MY MIX SET"
          </h2>
          <p className="text-sm font-mono text-[#ff4e00] bg-[#ff4e00]/10 border border-[#ff4e00]/30 px-4 py-1.5 rounded-full">
            Auto-analyzing BPM, Camelot Key & Spectral Sub-Bass
          </p>
        </div>
      )}

      {/* Processing Status Banner */}
      {analyzingStatus && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-[#ff4e00] text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-slideUp">
          <Sparkles className="w-5 h-5 text-[#ff4e00] animate-spin" />
          <div>
            <p className="font-bold text-[#ff4e00]">PROCESSING AUDIO TRACKS</p>
            <p className="text-slate-300">{analyzingStatus}</p>
          </div>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        crates={crates}
        activeCrateId={activeCrateId}
        onSelectCrate={(id) => setActiveCrateId(id)}
        onOpenImporter={handleOpenImporterWithGuard}
        onOpenAddTrackModal={() => setIsAddTrackOpen(true)}
        onOpenCamelotWheel={() => setIsCamelotOpen(true)}
        onOpenExportModal={handleOpenExportWithGuard}
        onOpenDualDeck={() => setIsDualDeckOpen(true)}
        onOpenAIMixer={handleOpenAIMixerWithGuard}
        onOpenRegister={() => {
          setDjModalTab('REGISTER');
          setIsDJRegistrationOpen(true);
        }}
        onOpenLogin={() => {
          setDjModalTab('STATUS');
          setIsDJRegistrationOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenUpgradeModal={() => handleOpenUpgradeModal()}
        activeDJName={activeDJ?.djName}
        isAdminLoggedIn={isAdminAuthenticated}
        onRunSort={handleRunSort}
        isSorting={isSorting}
        trackCount={tracks.length}
        hasActiveModal={!!activeModalTitle}
        activeModalTitle={activeModalTitle}
        onBackToStudio={handleBackToStudio}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Top Section: Blueprint Selector & Parameters */}
        <BlueprintSelector
          selectedBlueprint={selectedBlueprint}
          onSelectBlueprint={(type) => setSelectedBlueprint(type)}
          params={params}
          onChangeParams={(p) => setParams(p)}
          customCurve={customCurve}
          onChangeCustomCurve={(c) => setCustomCurve(c)}
          onRunSort={handleRunSort}
          isSorting={isSorting}
        />

        {/* Dynamic Energy Trajectory Visualizer */}
        <EnergyTrajectoryChart
          tracks={tracks}
          transitions={transitions}
          blueprintType={selectedBlueprint}
          customCurve={selectedBlueprint === 'CUSTOM' ? customCurve : undefined}
        />

        {/* Sorted Playlist Sequence Table */}
        <TrackList
          tracks={tracks}
          transitions={transitions}
          onMoveTrack={handleMoveTrack}
          onRemoveTrack={handleRemoveTrack}
          onInspectTransition={(idx) => setSelectedTransitionIdx(idx)}
          onAuditionTrack={handleAuditionTrack}
          lockedTrackIds={lockedTrackIds}
          onToggleLock={handleToggleLock}
          onOpenAddTrackModal={() => setIsAddTrackOpen(true)}
          onOpenCreateTransitionsModal={handleOpenCreateMix}
          onOpenCreateMashupModal={handleOpenMashupModal}
          onOpenAIMixer={handleOpenAIMixerWithGuard}
          onUploadAudioFiles={handleUploadAudioFiles}
        />
      </main>

      {/* Interactive Modals */}
      {isAIMixerOpen && (
        <AIMusicMixerModal
          tracks={tracks}
          transitions={transitions}
          selectedBlueprint={selectedBlueprint}
          customCurve={customCurve}
          onClose={() => setIsAIMixerOpen(false)}
          onAutoOptimizeSet={handleRunSort}
        />
      )}

      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onAddTracks={handleAddTracks}
        onRunSortAfterAdd={handleRunSort}
      />
      <CreateTransitionsModal
        isOpen={isCreateTransitionsOpen}
        onClose={() => setIsCreateTransitionsOpen(false)}
        tracks={tracks}
        transitions={transitions}
        blueprintName={BLUEPRINTS[selectedBlueprint].name}
        onOpenMashupModal={() => handleOpenMashupModal()}
      />
      {isCreateMashupOpen && (
        <CreateMashupModal
          tracks={tracks}
          initialTrackAId={selectedTrackForMashupId || undefined}
          onClose={() => {
            setIsCreateMashupOpen(false);
            setSelectedTrackForMashupId(null);
          }}
          onAddMashupTrack={(track) => handleAddTracks([track])}
        />
      )}
      <CamelotWheelModal
        isOpen={isCamelotOpen}
        onClose={() => setIsCamelotOpen(false)}
        tracks={tracks}
        transitions={transitions}
      />

      <TransitionInspectorModal
        isOpen={selectedTransitionIdx !== null}
        onClose={() => setSelectedTransitionIdx(null)}
        transitionIndex={selectedTransitionIdx}
        tracks={tracks}
        transitions={transitions}
        onAuditionTransition={handleAuditionTransition}
        onOpenCreateTransitionsModal={handleOpenCreateMix}
      />

      <DualDeckPlayer
        isOpen={isDualDeckOpen}
        onClose={() => setIsDualDeckOpen(false)}
        deckATrack={deckATrack}
        deckBTrack={deckBTrack}
        allTracks={tracks}
        onSelectDeckATrack={(t) => setDeckATrack(t)}
        onSelectDeckBTrack={(t) => setDeckBTrack(t)}
        onAddTracks={handleAddTracks}
      />

      <AudioImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onAddTracks={handleAddTracks}
        onTriggerUpgrade={(feat) => handleOpenUpgradeModal(feat)}
        currentTrackCount={tracks.length}
      />

      <ExportSetModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tracks={tracks}
        transitions={transitions}
        blueprintName={BLUEPRINTS[selectedBlueprint].name}
        onTriggerUpgrade={(feat) => handleOpenUpgradeModal(feat)}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        requiredFeature={upgradeRequiredFeature}
        onTierChanged={() => {
          // Trigger re-render / state sync
          window.dispatchEvent(new Event('subscription_tier_changed'));
        }}
      />

      <DJRegistrationModal
        isOpen={isDJRegistrationOpen}
        onClose={() => setIsDJRegistrationOpen(false)}
        onDJLoginSuccess={(dj) => setActiveDJ(dj)}
        initialTab={djModalTab}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogin={(success) => {
          setIsAdminAuthenticated(success);
          setAdminAuthenticated(success);
        }}
        onAdminLogout={() => {
          setIsAdminAuthenticated(false);
          setAdminAuthenticated(false);
        }}
        trackCount={tracks.length}
        crateCount={crates.length}
      />

      {/* Mobile PWA Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenAddTrack={() => setIsAddTrackOpen(true)}
        onOpenCamelot={() => setIsCamelotOpen(true)}
        onOpenDualDeck={() => setIsDualDeckOpen(true)}
        onOpenAIMixer={() => setIsAIMixerOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        trackCount={tracks.length}
      />
    </div>
  );
}
