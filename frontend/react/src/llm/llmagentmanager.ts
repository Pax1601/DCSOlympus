import { getApp } from "../olympusapp";
import { TextToSpeechSource } from "../audio/texttospeechsource";
import { LLMDecisionMadeEvent, LLMStatusUpdatedEvent } from "../events";

export class LLMAgentManager {
  private ttsSource: TextToSpeechSource | null = null;
  private isActive = false;
  private ttsEnabled = true;

  constructor() {
    this.initializeTTS();
  }

  private initializeTTS() {
    try {
      const audioManager = getApp().getAudioManager();
      const sources = audioManager.getSources();
      this.ttsSource = (sources.find((s: any) => s instanceof TextToSpeechSource) as TextToSpeechSource) || null;
    } catch (e) {
      // Safe fallback in case audio is not initialized yet
      this.ttsSource = null;
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.announceStatus("LLM Agent started");
    try { LLMStatusUpdatedEvent.dispatch({ isActive: true, mode: "tactical" }); } catch {}
  }

  stop() {
    if (!this.isActive) return;
    this.isActive = false;
    this.announceStatus("LLM Agent paused");
    try { LLMStatusUpdatedEvent.dispatch({ isActive: false, mode: "tactical" }); } catch {}
  }

  announceStatus(message: string) {
    if (!this.ttsEnabled) return;
    if (!this.ttsSource) this.initializeTTS();
    try {
      this.ttsSource?.playText(message);
    } catch {
      // ignore in case backend TTS is unavailable
    }
  }

  announce(text: string) {
    if (!this.ttsEnabled) return;
    if (!this.ttsSource) this.initializeTTS();
    try {
      this.ttsSource?.playText(text);
    } catch {}
  }

  announceDecision(text: string) {
    this.announce(text);
    try {
      const ts = new Date().toISOString();
      LLMDecisionMadeEvent.dispatch({ timestamp: ts, text });
    } catch {}
  }

  getIsActive() {
    return this.isActive;
  }

  setTTSEnabled(v: boolean) {
    this.ttsEnabled = v;
  }
}

