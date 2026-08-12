import { Track, TransitionAnalysis } from '../types';
import { parseCamelotKey } from './camelot';

/**
 * Parses Rekordbox XML file string into Track[]
 */
export function parseRekordboxXml(xmlString: string): Track[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const trackNodes = xmlDoc.querySelectorAll('TRACK');

  const tracks: Track[] = [];

  trackNodes.forEach((node, index) => {
    const id = node.getAttribute('TrackID') || `xml-${index + 1}`;
    const title = node.getAttribute('Name') || `Track ${index + 1}`;
    const artist = node.getAttribute('Artist') || 'Unknown Artist';
    const album = node.getAttribute('Album') || '';
    const genre = node.getAttribute('Genre') || 'Electronic';
    const bpmAttr = node.getAttribute('AverageBpm') || '123';
    const bpm = parseFloat(bpmAttr) || 123;
    const tonality = node.getAttribute('Tonality') || '8A';
    const durationSeconds = parseInt(node.getAttribute('TotalTime') || '300', 10);
    const comments = node.getAttribute('Comments') || '';

    const key = parseCamelotKey(tonality);

    // Calculate synthetic energy if absent in comment
    let des = 5.0;
    const desMatch = comments.match(/DES:\s*([\d.]+)/i);
    if (desMatch) {
      des = parseFloat(desMatch[1]);
    } else {
      des = Number((4.5 + (bpm - 118) * 0.25 + Math.random() * 2).toFixed(1));
      des = Math.min(10.0, Math.max(1.0, des));
    }

    // Parse Cue Points
    const cueNodes = node.querySelectorAll('POSITION_MARK');
    const cuePoints = Array.from(cueNodes).map((cue, cIdx) => ({
      id: `cue-${cIdx}`,
      name: cue.getAttribute('Name') || `Cue ${cIdx + 1}`,
      positionSeconds: parseFloat(cue.getAttribute('Start') || '0'),
      beatNumber: (cIdx + 1) * 32,
      type: (cue.getAttribute('Name')?.toUpperCase().includes('INTRO')
        ? 'INTRO'
        : cue.getAttribute('Name')?.toUpperCase().includes('OUTRO')
        ? 'OUTRO'
        : cue.getAttribute('Name')?.toUpperCase().includes('DROP')
        ? 'DROP'
        : 'HOTCUE') as 'INTRO' | 'OUTRO' | 'BREAKDOWN' | 'DROP' | 'HOTCUE',
      color: '#06b6d4',
    }));

    if (cuePoints.length === 0) {
      cuePoints.push(
        { id: 'c1', name: 'Intro Beat (32B)', positionSeconds: 0, beatNumber: 1, type: 'INTRO', color: '#06b6d4' },
        { id: 'c2', name: 'Main Breakdown', positionSeconds: Math.floor(durationSeconds * 0.35), beatNumber: 65, type: 'BREAKDOWN', color: '#8b5cf6' },
        { id: 'c3', name: 'Peak Drop', positionSeconds: Math.floor(durationSeconds * 0.48), beatNumber: 97, type: 'DROP', color: '#f59e0b' },
        { id: 'c4', name: 'Outro Mix Zone', positionSeconds: Math.floor(durationSeconds * 0.82), beatNumber: 193, type: 'OUTRO', color: '#10b981' }
      );
    }

    // Generate waveform peaks
    const waveformPeaks: number[] = [];
    for (let i = 0; i < 100; i++) {
      let val = 0.3 + Math.random() * 0.5;
      if (i > 35 && i < 45) val *= 0.4;
      if (i >= 46 && i <= 75) val = Math.min(1.0, val * 1.3);
      waveformPeaks.push(Number(val.toFixed(2)));
    }

    tracks.push({
      id,
      title,
      artist,
      album,
      genre,
      bpm,
      key,
      des,
      durationSeconds,
      spectral: {
        subBassWeight: Number((4.0 + des * 0.5).toFixed(1)),
        midRangeDensity: Number((4.0 + Math.random() * 4).toFixed(1)),
        highFrequencyRatio: Number((4.0 + Math.random() * 4).toFixed(1)),
        dominantFrequencyHz: 80,
        percussiveDensity: Number((des * 0.85).toFixed(1)),
        rmsDb: Number((-18 + des * 1.2).toFixed(1)),
      },
      cuePoints,
      waveformPeaks,
      comments,
    });
  });

  return tracks;
}

/**
 * Generates Rekordbox XML export string with reordered track indexes and cues
 */
export function generateRekordboxXml(tracks: Track[], playlistName: string = 'Set Architect Sorted Set'): string {
  let trackEntries = '';
  let playlistEntries = '';

  tracks.forEach((track, index) => {
    const trackId = index + 1;

    let cuesXml = '';
    track.cuePoints.forEach((cue) => {
      cuesXml += `\n      <POSITION_MARK Name="${escapeXml(cue.name)}" Type="0" Start="${cue.positionSeconds.toFixed(3)}" Num="${cue.beatNumber}"/>`;
    });

    trackEntries += `    <TRACK TrackID="${trackId}" Name="${escapeXml(track.title)}" Artist="${escapeXml(track.artist)}" Album="${escapeXml(track.album || '')}" Genre="${escapeXml(track.genre)}" AverageBpm="${track.bpm.toFixed(2)}" TotalTime="${track.durationSeconds}" Tonality="${track.key.code}" Comments="DES:${track.des}">\n      <TEMPO Inizio="0.000" Bpm="${track.bpm.toFixed(2)}" Metro="4/4" Battuta="1"/>${cuesXml}\n    </TRACK>\n`;

    playlistEntries += `        <TRACK Key="${trackId}"/>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <PRODUCT Name="SetArchitect" Version="1.0.0" Company="SetArchitect AI"/>
  <COLLECTION Entries="${tracks.length}">
${trackEntries}  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT">
      <NODE Type="1" Name="${escapeXml(playlistName)}">
${playlistEntries}      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;
}

/**
 * Generates standard M3U8 playlist file content
 */
export function generateM3u8Playlist(tracks: Track[]): string {
  let content = '#EXTM3U\n#PLAYLIST:Set Architect Sorted Set\n\n';
  tracks.forEach((track, idx) => {
    content += `#EXTINF:${track.durationSeconds},[${track.key.code}] [DES:${track.des}] ${track.artist} - ${track.title}\n`;
    content += `${idx + 1}_${track.artist.replace(/\s+/g, '_')}_-_${track.title.replace(/\s+/g, '_')}.mp3\n\n`;
  });
  return content;
}

/**
 * Generates DJ Transition Master Sheet text document
 */
export function generateTransitionSheet(
  tracks: Track[],
  transitions: TransitionAnalysis[],
  blueprintName: string
): string {
  let doc = `================================================================================\n`;
  doc += `                         SET ARCHITECT :: TRANSITION MASTER SHEET               \n`;
  doc += `================================================================================\n`;
  doc += `Blueprint Trajectory : ${blueprintName}\n`;
  doc += `Total Tracks          : ${tracks.length}\n`;
  doc += `Generated At          : ${new Date().toLocaleString()}\n`;
  doc += `================================================================================\n\n`;

  tracks.forEach((track, index) => {
    const num = String(index + 1).padStart(2, '0');
    doc += `[#${num}] ${track.title.toUpperCase()} - ${track.artist}\n`;
    doc += `      BPM: ${track.bpm} | Key: ${track.key.code} (${track.key.musicalKey}) | DES Energy: ${track.des}/10\n`;
    doc += `      Sub-Bass: ${track.spectral.subBassWeight}/10 | Percussive Density: ${track.spectral.percussiveDensity}/10\n`;

    const transition = transitions[index];
    if (transition) {
      doc += `      --------------------------------------------------------------------------\n`;
      doc += `      >>> TRANSITION TO TRACK #${String(index + 2).padStart(2, '0')}: [${transition.type}]\n`;
      doc += `          BPM Delta      : ${transition.bpmDelta > 0 ? `+${transition.bpmDelta}` : transition.bpmDelta} BPM (${transition.pitchBendPercent}% Pitch Shift)\n`;
      doc += `          Sub-Bass Risk  : ${transition.subBassClashRisk} (Spectral Score: ${transition.spectralClashScore}/10)\n`;
      doc += `          Suggested Zone : ${transition.suggestedMixZone}\n`;
      doc += `          DJ Advice      : ${transition.techniqueNote}\n`;
      doc += `      --------------------------------------------------------------------------\n`;
    }
    doc += `\n`;
  });

  return doc;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
