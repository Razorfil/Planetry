import { useCallback, useEffect, useRef, useState } from 'react';

export interface SensorReading {
  ph: number | null;
  gasDensity: number | null;
  status: string | null;
  timestamp: number | null;
}

interface SensorPanelProps {
  /** Called when the user applies the latest sensor reading into the form. */
  onApply: (reading: { ph: number; gasDensity: number }) => void;
}

const EMPTY_READING: SensorReading = { ph: null, gasDensity: null, status: null, timestamp: null };

/**
 * Connects to the "AstroAI-Forge Gezegen Test İstasyonu" Deneyap Kart over
 * the Web Serial API, parses the lines it prints every 3 seconds, and lets
 * the user push the latest pH / gas density reading into the planet form.
 *
 * Only works in Chromium-based browsers (Chrome, Edge, Opera) served over
 * https:// or http://localhost — Web Serial is unavailable on Firefox,
 * Safari, and when the page is opened directly from disk (file://).
 */
export default function SensorPanel({ onApply }: SensorPanelProps) {
  const [supported, setSupported] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [reading, setReading] = useState<SensorReading>(EMPTY_READING);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef(false);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'serial' in navigator);
  }, []);

  const appendLog = useCallback((line: string) => {
    setLog(prev => [...prev.slice(-7), line]);
  }, []);

  const applyLine = useCallback((line: string) => {
    setReading(prev => {
      const next: SensorReading = { ...prev, timestamp: Date.now() };
      if (line.includes('pH')) {
        const m = line.match(/:\s*([\d.,]+)/);
        if (m) next.ph = parseFloat(m[1].replace(',', '.'));
      } else if (line.includes('Renk Durumu')) {
        const idx = line.indexOf(':');
        if (idx !== -1) next.status = line.slice(idx + 1).trim();
      } else if (line.includes('Gaz Yo')) {
        const m = line.match(/:\s*([\d.,]+)/);
        if (m) next.gasDensity = parseFloat(m[1].replace(',', '.'));
      }
      return next;
    });
  }, []);

  const readLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) return;
    const textDecoder = new TextDecoderStream();
    const readableClosed = port.readable
      .pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>)
      .catch(() => {});
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = '';
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            appendLog(line);
            applyLine(line);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seri port okunamadı.');
    } finally {
      reader.releaseLock();
      await readableClosed;
    }
  }, [appendLog, applyLine]);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      keepReadingRef.current = true;
      setConnected(true);
      void readLoop(port);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı kurulamadı. Kartın bağlı olduğundan emin olun.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    keepReadingRef.current = false;
    try {
      await readerRef.current?.cancel();
    } catch {
      /* already closed */
    }
    try {
      await portRef.current?.close();
    } catch {
      /* already closed */
    }
    portRef.current = null;
    readerRef.current = null;
    setConnected(false);
    setReading(EMPTY_READING);
  };

  useEffect(() => {
    return () => {
      keepReadingRef.current = false;
      readerRef.current?.cancel().catch(() => {});
      portRef.current?.close().catch(() => {});
    };
  }, []);

  const canApply = reading.ph !== null && reading.gasDensity !== null;

  if (!supported) {
    return (
      <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2.5 text-xs text-amber-300">
        ⚠️ Bu tarayıcı Web Serial API'yi desteklemiyor. Deneyap Kart'tan canlı veri
        okumak için Chrome veya Edge kullanın (sayfa <code>localhost</code> veya
        <code> https://</code> üzerinden açılmalı). Değerleri aşağıdan elle de girebilirsiniz.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sky-700/40 bg-sky-950/20 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
          📡 AstroAI-Forge Test İstasyonu
        </h3>
        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-xs px-2.5 py-1 rounded-md bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-700/40 transition-colors"
          >
            Bağlantıyı Kes
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="text-xs px-2.5 py-1 rounded-md bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-700/40 transition-colors disabled:opacity-50"
          >
            {connecting ? 'Bağlanıyor…' : 'Karta Bağlan'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {connected && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded-md px-2 py-1.5">
              <span className="text-slate-500">Sıvı pH</span>
              <p className="text-slate-200 font-semibold">{reading.ph ?? '—'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-md px-2 py-1.5">
              <span className="text-slate-500">Gaz Yoğunluğu</span>
              <p className="text-slate-200 font-semibold">
                {reading.gasDensity ?? '—'} {reading.gasDensity !== null && 'kg/m³'}
              </p>
            </div>
          </div>
          {reading.status && (
            <p className="text-[11px] text-slate-400">Turnusol durumu: {reading.status}</p>
          )}

          <button
            type="button"
            onClick={() => canApply && onApply({ ph: reading.ph as number, gasDensity: reading.gasDensity as number })}
            disabled={!canApply}
            className="w-full text-xs py-1.5 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-700/40 transition-colors disabled:opacity-40"
          >
            ⬇️ Bu Değerleri Forma Aktar
          </button>

          {log.length > 0 && (
            <details className="text-[10px] text-slate-500">
              <summary className="cursor-pointer hover:text-slate-400">Son okunan satırlar</summary>
              <pre className="mt-1 whitespace-pre-wrap leading-relaxed">{log.join('\n')}</pre>
            </details>
          )}
        </>
      )}
    </div>
  );
}
