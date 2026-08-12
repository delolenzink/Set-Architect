import React, { useState } from 'react';
import {
  Plus,
  X,
  Upload,
  FileCode,
  Sparkles,
  Music,
  Zap,
  Check,
  Sliders,
  Layers,
} from 'lucide-react';
import { Track } from '../types';
import { parseCamelotKey } from '../lib/camelot';
import { analyzeAudioFile } from '../lib/audioAnalyzer';
import { DEMO_CRATES } from '../data/demoCrates';
import { parseRekordboxXml } from '../lib/exporters';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTracks: (tracks: Track[], crateName?: string) => void;
  onRunSortAfterAdd?: () => void;
}

const CAMELOT_KEYS = [
  '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
  '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B',
  '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B',
];

const GENRES = [
  'Melodic Techno',
  'Progressive House',
  'Techno (Peak Time)',
  'Deep House',
  'Organic House',
  'Afro House',
  'Trance / Psy',
  'Indie Dance',
  'Drum & Bass',
  'Electronic',
];

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTracks,
  onRunSortAfterAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'FILES' | 'XML' | 'DEMO'>('MANUAL');

  // Manual Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Melodic Techno');
  const [bpm, setBpm] = useState<number>(125);
  const [keyCode, setKeyCode] = useState('8A');
  const [des, setDes] = useState<number>(6.5);
  const [subBass, setSubBass] = useState<number>(5.0);

  // File Upload State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleCreateManualTrack = (shouldAutoSort = true) => {
    if (!title.trim()) return;

    const parsedKey = parseCamelotKey(keyCode);
    const newTrack: Track = {
      id: `track-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      artist: artist.trim() || 'Unknown Artist',
      genre,
      bpm: Number(bpm) || 125,
      key: parsedKey,
      des: Number(des),
      durationSeconds: 360,
      spectral: {
        subBassWeight: Number(subBass),
        midRangeDensity: 5.0,
        highFrequencyRatio: 5.0,
        dominantFrequencyHz: 80,
        percussiveDensity: 5.0,
        rmsDb: -14.0,
      },
      cuePoints: [],
      waveformPeaks: Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2),
    };

    onAddTracks([newTrack]);

    if (shouldAutoSort && onRunSortAfterAdd) {
      setTimeout(() => {
        onRunSortAfterAdd();
      }, 100);
    }

    // Reset Form
    setTitle('');
    setArtist('');
    onClose();
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`Analyzing ${files.length} audio file(s) via Web Audio API...`);

    const newTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatusMessage(`Analyzing (${i + 1}/${files.length}): ${file.name}`);
      const analysis = await analyzeAudioFile(file);

      newTracks.push({
        id: `track-upload-${Date.now()}-${i}`,
        title: analysis.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Artist',
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
      });
    }

    onAddTracks(newTracks, files.length > 1 ? 'Batch Import' : undefined);
    setIsProcessing(false);

    if (onRunSortAfterAdd) {
      setTimeout(() => {
        onRunSortAfterAdd();
      }, 100);
    }

    onClose();
  };

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(`Parsing Rekordbox XML: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlString = event.target?.result as string;
      if (xmlString) {
        const parsedTracks = parseRekordboxXml(xmlString);
        onAddTracks(parsedTracks, file.name.replace('.xml', ''));
        setIsProcessing(false);

        if (onRunSortAfterAdd) {
          setTimeout(() => {
            onRunSortAfterAdd();
          }, 100);
        }

        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0d0d0f] border border-[#2a2a2e] rounded-sm max-w-xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-[#ff4e00]/10 border border-[#ff4e00]/30 text-[#ff4e00]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                ADD TRACKS TO SET
              </h3>
              <p className="text-xs text-[#888]">
                Add custom tracks or upload files to auto-sort into optimal harmonic order
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm bg-[#1e1e22] hover:bg-[#2a2a2e] text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2a2a2e] my-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'MANUAL'
                ? 'border-[#ff4e00] text-[#ff4e00] bg-[#ff4e00]/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Quick Input
          </button>

          <button
            onClick={() => setActiveTab('FILES')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'FILES'
                ? 'border-[#ff4e00] text-[#ff4e00] bg-[#ff4e00]/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Audio File
          </button>

          <button
            onClick={() => setActiveTab('XML')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'XML'
                ? 'border-[#ff4e00] text-[#ff4e00] bg-[#ff4e00]/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> XML Import
          </button>

          <button
            onClick={() => setActiveTab('DEMO')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'DEMO'
                ? 'border-[#ff4e00] text-[#ff4e00] bg-[#ff4e00]/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Demo Crates
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-2 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'MANUAL' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateManualTrack(true);
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[#888] uppercase text-[10px]">Track Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Celestial Horizon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2a2a2e] focus:border-[#ff4e00] rounded-sm px-3 py-2 text-white outline-none transition-colors"
                  />
                </div>

                {/* Artist */}
                <div className="space-y-1">
                  <label className="text-[#888] uppercase text-[10px]">Artist / Producer</label>
                  <input
                    type="text"
                    placeholder="e.g. Astral Projection"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2a2a2e] focus:border-[#ff4e00] rounded-sm px-3 py-2 text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* BPM */}
                <div className="space-y-1">
                  <label className="text-[#888] uppercase text-[10px]">BPM</label>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value, 10) || 125)}
                    className="w-full bg-[#121214] border border-[#2a2a2e] focus:border-[#ff4e00] rounded-sm px-3 py-2 text-white outline-none font-bold text-[#ff4e00]"
                  />
                </div>

                {/* Camelot Key */}
                <div className="space-y-1">
                  <label className="text-[#888] uppercase text-[10px]">Camelot Key</label>
                  <select
                    value={keyCode}
                    onChange={(e) => setKeyCode(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2a2a2e] focus:border-[#ff4e00] rounded-sm px-3 py-2 text-[#ff4e00] font-bold outline-none cursor-pointer"
                  >
                    {CAMELOT_KEYS.map((k) => (
                      <option key={k} value={k} className="bg-[#121214] text-white">
                        {k} ({parseCamelotKey(k).musicalKey})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Genre */}
                <div className="space-y-1">
                  <label className="text-[#888] uppercase text-[10px]">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2a2a2e] focus:border-[#ff4e00] rounded-sm px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g} className="bg-[#121214] text-white">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sliders for Energy & Sub-Bass */}
              <div className="p-3 bg-[#121214] border border-[#2a2a2e] rounded-sm space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#888]">DYNAMIC ENERGY SCORE (DES):</span>
                    <span className="text-[#ff4e00] font-bold">{des} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={des}
                    onChange={(e) => setDes(parseFloat(e.target.value))}
                    className="w-full accent-[#ff4e00] bg-[#222] h-1 rounded-full cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#888]">SUB-BASS WEIGHT (&lt;100Hz):</span>
                    <span className="text-[#00ff94] font-bold">{subBass} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={subBass}
                    onChange={(e) => setSubBass(parseFloat(e.target.value))}
                    className="w-full accent-[#00ff94] bg-[#222] h-1 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono text-[#888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 text-xs font-bold font-mono bg-[#ff4e00] hover:bg-[#ff5e1a] disabled:bg-[#222] disabled:text-[#666] text-black rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ADD & AUTO-SORT SET
                </button>
              </div>
            </form>
          )}

          {activeTab === 'FILES' && (
            <div className="space-y-4">
              <input
                type="file"
                onChange={handleAudioFileUpload}
                multiple
                accept=".mp3,.wav,.flac,.aiff"
                className="hidden"
                id="modal-audio-file-input"
              />

              <label
                htmlFor="modal-audio-file-input"
                className="border-2 border-dashed border-[#2a2a2e] hover:border-[#ff4e00] bg-[#121214] hover:bg-[#ff4e00]/5 rounded-sm p-8 text-center cursor-pointer transition-all space-y-3 block group"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0b] border border-[#2a2a2e] group-hover:border-[#ff4e00] flex items-center justify-center mx-auto text-[#ff4e00] transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">
                    Click to select local audio tracks
                  </h4>
                  <p className="text-xs text-[#888] mt-1 font-mono">
                    Analyzes key, BPM, and spectral energy via Web Audio API, then auto-sorts set
                  </p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'XML' && (
            <div className="space-y-4">
              <input
                type="file"
                onChange={handleXmlUpload}
                accept=".xml"
                className="hidden"
                id="modal-xml-file-input"
              />

              <label
                htmlFor="modal-xml-file-input"
                className="border-2 border-dashed border-[#2a2a2e] hover:border-[#ff4e00] bg-[#121214] hover:bg-[#ff4e00]/5 rounded-sm p-8 text-center cursor-pointer transition-all space-y-3 block group"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0b] border border-[#2a2a2e] group-hover:border-[#ff4e00] flex items-center justify-center mx-auto text-[#ff4e00] transition-colors">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">
                    Import Rekordbox XML Playlist
                  </h4>
                  <p className="text-xs text-[#888] mt-1 font-mono">
                    Parses track grid, BPM, Tonality tags, hot cues, and auto-arranges sequence
                  </p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'DEMO' && (
            <div className="space-y-2">
              {DEMO_CRATES.map((crate) => (
                <div
                  key={crate.id}
                  onClick={() => {
                    onAddTracks(crate.tracks, crate.name);
                    if (onRunSortAfterAdd) {
                      setTimeout(() => onRunSortAfterAdd(), 100);
                    }
                    onClose();
                  }}
                  className="p-3.5 rounded-sm bg-[#121214] border border-[#2a2a2e] hover:border-[#ff4e00] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#ff4e00] transition-colors font-sans">
                        {crate.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/30">
                        {crate.tracks.length} Tracks
                      </span>
                    </div>
                    <p className="text-xs text-[#888]">{crate.description}</p>
                  </div>

                  <Sparkles className="w-4 h-4 text-[#666] group-hover:text-[#ff4e00] transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {isProcessing && (
            <div className="p-3 rounded-sm bg-[#ff4e00]/10 border border-[#ff4e00]/30 text-[#ff4e00] font-mono text-xs flex items-center gap-3">
              <Sparkles className="w-4 h-4 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
