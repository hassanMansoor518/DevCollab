/**
 * agent.perf.js - Performance timer and telemetry tracker for agent operations.
 *
 * Measures:
 * - totalTime
 * - classificationTime
 * - fileDiscoveryTime
 * - contextTime
 * - llmTime
 * - patchTime
 * - validationTime
 * - counters (llmCalls, filesRead, filesWritten, cacheHits, cacheMisses)
 */

class PerfTracker {
  constructor(taskId, mode = 'fast') {
    this.taskId = taskId;
    this.mode = mode;
    this.startedAt = Date.now();
    this.timers = {};
    this.counters = {
      llmCalls: 0,
      toolCalls: 0,
      filesRead: 0,
      filesWritten: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbReads: 0,
      dbWrites: 0,
    };
    this.llmTotalMs = 0;
    this.fsTotalMs = 0;
    this.searchTotalMs = 0;
    this.terminalTotalMs = 0;
    this.dbTotalMs = 0;
    this.fileDiscoveryMs = 0;
    this.contextMs = 0;
    this.patchMs = 0;
    this.validationMs = 0;
    this.classificationMs = 0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  start(label) {
    this.timers[label] = { start: Date.now(), end: null, durationMs: null };
    return label;
  }

  end(label) {
    if (!this.timers[label]) return 0;
    const entry = this.timers[label];
    entry.end = Date.now();
    entry.durationMs = entry.end - entry.start;

    // Categorize
    if (label === 'classification')   this.classificationMs += entry.durationMs;
    if (label === 'file-discovery')   this.fileDiscoveryMs  += entry.durationMs;
    if (label === 'context')          this.contextMs        += entry.durationMs;
    if (label.startsWith('llm'))      this.llmTotalMs       += entry.durationMs;
    if (label === 'patch')            this.patchMs          += entry.durationMs;
    if (label === 'validation')       this.validationMs     += entry.durationMs;
    if (label.startsWith('fs:'))      this.fsTotalMs        += entry.durationMs;
    if (label.startsWith('search:'))  this.searchTotalMs    += entry.durationMs;
    if (label.startsWith('terminal:'))this.terminalTotalMs  += entry.durationMs;
    if (label.startsWith('db:'))      this.dbTotalMs        += entry.durationMs;

    return entry.durationMs;
  }

  inc(counter, by = 1) {
    if (this.counters[counter] !== undefined) {
      this.counters[counter] += by;
    }
  }

  report() {
    const totalMs = Date.now() - this.startedAt;
    const fmt = (ms) => (ms / 1000).toFixed(2) + 's';

    const otherMs = Math.max(
      0,
      totalMs -
        this.llmTotalMs -
        this.fsTotalMs -
        this.fileDiscoveryMs -
        this.contextMs -
        this.patchMs -
        this.validationMs -
        this.classificationMs -
        this.searchTotalMs -
        this.terminalTotalMs
    );

    return {
      taskId: this.taskId,
      mode: this.mode,
      totalMs: totalMs,
      totalFormatted: fmt(totalMs),
      telemetry: {
        totalTime: totalMs,
        classificationTime: this.classificationMs,
        fileDiscoveryTime: this.fileDiscoveryMs,
        contextTime: this.contextMs,
        llmTime: this.llmTotalMs,
        patchTime: this.patchMs,
        validationTime: this.validationMs,
      },
      categories: {
        llm:           { ms: this.llmTotalMs,       formatted: fmt(this.llmTotalMs) },
        discovery:     { ms: this.fileDiscoveryMs,  formatted: fmt(this.fileDiscoveryMs) },
        context:       { ms: this.contextMs,        formatted: fmt(this.contextMs) },
        patch:         { ms: this.patchMs,          formatted: fmt(this.patchMs) },
        validation:    { ms: this.validationMs,     formatted: fmt(this.validationMs) },
        fs:            { ms: this.fsTotalMs,        formatted: fmt(this.fsTotalMs) },
        terminal:      { ms: this.terminalTotalMs,  formatted: fmt(this.terminalTotalMs) },
        other:         { ms: otherMs,               formatted: fmt(otherMs) },
      },
      counters: this.counters,
    };
  }

  logSummary() {
    const r = this.report();
    console.log(`[AgentPerf] Task ${this.taskId} [${this.mode.toUpperCase()}]: Total ${r.totalFormatted} (LLM: ${r.categories.llm.formatted} | Disc: ${r.categories.discovery.formatted} | Patch: ${r.categories.patch.formatted})`);
  }
}

module.exports = PerfTracker;
