import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ems.logs.v1';
const MAX = 500;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  t: number;
  level: LogLevel;
  tag?: string;
  msg: string;
  data?: any;
};

type Listener = (logs: LogEntry[]) => void;
const listeners = new Set<Listener>();

let mem: LogEntry[] = [];
let hydrated = false;

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeStringify(x: any) {
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    // ignore
  }
}

function emit() {
  for (const l of listeners) l(mem);
}

export async function initLogs() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) mem = (JSON.parse(raw) as LogEntry[]).slice(-MAX);
  } catch {
    mem = [];
  }
  emit();
}

export function subscribeLogs(listener: Listener) {
  listeners.add(listener);
  listener(mem);
  return () => {
    listeners.delete(listener);
  };
}

export function clearLogs() {
  mem = [];
  emit();
  AsyncStorage.removeItem(KEY).catch(() => {});
}

export function log(level: LogLevel, msg: string, data?: any, tag?: string) {
  const entry: LogEntry = {
    id: newId(),
    t: Date.now(),
    level,
    tag,
    msg,
    data,
  };
  mem = [...mem, entry].slice(-MAX);
  emit();
  persist();

  // Also forward to console for Metro.
  const line = tag ? `[${tag}] ${msg}` : msg;
  if (level === 'error') console.error(line, data ?? '');
  else if (level === 'warn') console.warn(line, data ?? '');
  else console.log(line, data ?? '');
}

export const logger = {
  debug: (msg: string, data?: any, tag?: string) => log('debug', msg, data, tag),
  info: (msg: string, data?: any, tag?: string) => log('info', msg, data, tag),
  warn: (msg: string, data?: any, tag?: string) => log('warn', msg, data, tag),
  error: (msg: string, data?: any, tag?: string) => log('error', msg, data, tag),
  stringify: safeStringify,
};

