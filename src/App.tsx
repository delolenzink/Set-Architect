import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BlueprintSelector } from './components/BlueprintSelector';
import { EnergyTrajectoryChart } from './components/EnergyTrajectoryChart';
import { TrackList } from './components/TrackList';
import { CamelotWheelModal } from './components/CamelotWheelModal';
import { TransitionInspectorModal } from './components/TransitionInspectorModal';
import { DualDeckPlayer } from './components/DualDeckPlayer';
import { AudioImporterModal } from './components/AudioImporterModal';
import { AddTrackModal } from './components/AddTrackModal';
import { CreateTransitionsModal } from './components/CreateTransitionsModal';
import { ExportModal } from './components/ExportModal';

import { BlueprintType, Crate, SortingParameters, Track } from './types';
import { DEMO_CRATES } from './data/demoCrates';
import { sortPlaylist, BLUEPRINTS } from './lib/sortingAlgorithm';

export default function App() {
  const [crates, setCrates] = useState<Crate[]>(DEMO_CRATES);
  const [activeCrateId, setActiveCrateId] = useState<string>(DEMO_CRATES[0].id);

  // Active tracks in the current workspace
  const activeCrate = useMemo(() => {
    return crates.find((c) => c.id === activeCrateId) || crates[0];
  }, [crates, activeCrateId]);

  const [tracks, setTracks] = useState<Track[]>(activeCrate.tracks);
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintType>(activeCrate.blueprint);

  const [customCurve, setCustomCurve] = useState<number[]>([4, 5, 6, 7, 8, 9, 8, 7, 6, 5]);

  const [params, setParams] = useState<SortingParameters>({
    maxBpmDrift: 3,
    keyPriorityWeight: 0.65,
    avoidFrequencyClash: true,
    allowEnergyBoosts: true,
    strictMode: true,
  });

  const [lockedTrackIds, setLockedTrackIds] = useState<Set<string>>(new Set());
  const [isSorting, setIsSorting] = useState<boolean>(false);

  // Modals state
  const [isCamelotOpen, setIsCamelotOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isCreateTransitionsOpen, setIsCreateTransitionsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDualDeckOpen, setIsDualDeckOpen] = useState(false);

  const [selectedTransitionIdx, setSelectedTransitionIdx] = useState<number | null>(null);
  const [deckATrack, setDeckATrack] = useState<Track | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<Track | null>(null);

  // When active crate changes, update local tracks
  useEffect(() => {
    if (activeCrate) {
      setTracks(activeCrate.tracks);
      setSelectedBlueprint(activeCrate.blueprint);
    }
  }, [activeCrateId]);

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
  const handleAddTracks = (newTracks: Track[], crateName?: string) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header Navbar */}
      <Navbar
        crates={crates}
        activeCrateId={activeCrateId}
        onSelectCrate={(id) => setActiveCrateId(id)}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenAddTrackModal={() => setIsAddTrackOpen(true)}
        onOpenCamelotWheel={() => setIsCamelotOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenDualDeck={() => setIsDualDeckOpen(true)}
        onRunSort={handleRunSort}
        isSorting={isSorting}
        trackCount={tracks.length}
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
        />
      </main>

      {/* Interactive Modals */}
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
      />
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
      />

      <AudioImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onAddTracks={handleAddTracks}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tracks={tracks}
        transitions={transitions}
        blueprintName={BLUEPRINTS[selectedBlueprint].name}
        onOpenCreateTransitionsModal={handleOpenCreateMix}
      />
    </div>
  );
}
