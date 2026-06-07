// Notification sound utility
// Provides audio feedback for all notifications

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Check user preference from localStorage
    this.enabled = localStorage.getItem('notification_sound_enabled') !== 'false';
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a short beep sound using Web Audio API
  playBeep(frequency: number = 800, duration: number = 0.15, type: OscillatorType = 'sine') {
    if (!this.enabled) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  // Different sounds for different notification types
  success() {
    // High pitched happy beep
    this.playBeep(880, 0.1, 'sine');
    setTimeout(() => this.playBeep(1100, 0.1, 'sine'), 100);
  }

  error() {
    // Low error beep
    this.playBeep(300, 0.3, 'sawtooth');
  }

  warning() {
    // Medium warning beep
    this.playBeep(600, 0.2, 'square');
  }

  info() {
    // Simple notification beep
    this.playBeep(800, 0.15, 'sine');
  }

  // Play sound for new work order assignment
  newAssignment() {
    // Distinctive double chime
    this.playBeep(523, 0.1, 'sine'); // C5
    setTimeout(() => this.playBeep(659, 0.1, 'sine'), 150); // E5
    setTimeout(() => this.playBeep(784, 0.2, 'sine'), 300); // G5
  }

  // Play sound for status change
  statusChange() {
    this.playBeep(700, 0.1, 'sine');
    setTimeout(() => this.playBeep(900, 0.15, 'sine'), 120);
  }

  // Toggle sound on/off
  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('notification_sound_enabled', this.enabled.toString());
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable() {
    this.enabled = true;
    localStorage.setItem('notification_sound_enabled', 'true');
    // Try to resume audio context (needed after user interaction)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Singleton instance
export const notificationSound = new NotificationSound();

// Hook to use in components
export function useNotificationSound() {
  return {
    playSuccess: () => notificationSound.success(),
    playError: () => notificationSound.error(),
    playWarning: () => notificationSound.warning(),
    playInfo: () => notificationSound.info(),
    playNewAssignment: () => notificationSound.newAssignment(),
    playStatusChange: () => notificationSound.statusChange(),
    toggle: () => notificationSound.toggle(),
    isEnabled: notificationSound.isEnabled(),
    enable: () => notificationSound.enable(),
  };
}
