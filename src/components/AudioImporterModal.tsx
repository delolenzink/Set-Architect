import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCode,
  FolderPlus,
  X,
  Layers,
  Sparkles,
  CheckCircle,
  Music,
} from 'lucide-react';
import { Crate, Track } from '../types';
import { DEMO_CRATES } from '../data/demoCrates';
import { parseRekordboxXml } from '../lib/exporters';
import { analyzeAudioFile } from '../lib/audioAnalyzer';

interface AudioImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTracks: (tracks: Track[], crateName?: string) => void;
}

export const AudioImporterModal: React.FC<AudioImporterModalProps> = ({
  isOpen,
  onClose,
  onAddTracks,
}) => {
  const [activeTab, setActiveTab] = useState<'FILES' | 'XML' | 'DEMO'>('FILES');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Batch Audio Upload
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
        title: analysis.title || file.name,
        artist: 'Local Artist',
        genre: 'Electronic',
        bpm: analysis.bpm || 123,
        key: analysis.key || { code: '8A', number: 8, letter: 'A', musicalKey: 'A minor' },
        des: analysis.des || 5.0,
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

    onAddTracks(newTracks, 'Uploaded Audio Crate');
    setIsProcessing(false);
    onClose();
  };

  // Rekordbox XML Upload
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
        onClose();
      }
    };
    reader.readAsText(file);
  };

  // Select Demo Crate
  const handleSelectDemoCrate = (crate: Crate) => {
    onAddTracks(crate.tracks, crate.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                AUDIO & PLAYLIST INGESTION
              </h3>
              <p className="text-xs text-slate-400">
                Import local audio files, Rekordbox XML, or select an executive crate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 my-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('FILES')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'FILES'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Batch Audio Upload
          </button>

          <button
            onClick={() => setActiveTab('XML')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'XML'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> Rekordbox XML
          </button>

          <button
            onClick={() => setActiveTab('DEMO')}
            className={`flex-1 py-2.5 border-b-2 text-center font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'DEMO'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Executive Demo Crates
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-4 flex-1 overflow-y-auto">
          {activeTab === 'FILES' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAudioFileUpload}
                multiple
                accept=".mp3,.wav,.flac,.aiff"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-cyan-950/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/80 flex items-center justify-center mx-auto text-cyan-400 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Click to select audio tracks or drag & drop
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Supported: .MP3, .WAV, .FLAC, .AIFF (Web Audio API signal processing)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'XML' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={xmlInputRef}
                onChange={handleXmlUpload}
                accept=".xml"
                className="hidden"
              />

              <div
                onClick={() => xmlInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-cyan-950/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/80 flex items-center justify-center mx-auto text-cyan-400 transition-colors">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Import Rekordbox XML Playlist
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Parses track grid, BPM, Tonality tags, hot cues, and tempo markers
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DEMO' && (
            <div className="space-y-3">
              {DEMO_CRATES.map((crate) => (
                <div
                  key={crate.id}
                  onClick={() => handleSelectDemoCrate(crate)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {crate.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {crate.tracks.length} Tracks
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{crate.description}</p>
                  </div>

                  <Sparkles className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {isProcessing && (
            <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center gap-3">
              <Sparkles className="w-4 h-4 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
