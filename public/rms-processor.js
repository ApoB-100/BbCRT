/**
 * Represents an audio worklet processor for calculating the Root Mean Square (RMS) value of audio samples.
 * The processor checks if the maximum RMS value exceeds the threshold and sends messages via the port accordingly.
 */
class RMSProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
      return [{ name: 'threshold', defaultValue: 0 }];
  }

  constructor() {
      super();
      this.wasBelowThreshold = true;
      this.belowThresholdSince = 0; // Initialize with 0
  }

/**
 * Processes the input audio samples and checks if the maximum RMS value exceeds the threshold.
 * If the threshold is exceeded, a message is sent via the port.
 *
 * @param {Array<Array<number>>} inputs - The input audio samples.
 * @param {Array<Array<number>>} outputs - The output audio samples.
 * @param {Object} parameters - The processing parameters.
 * @returns {boolean} - Indicates whether the process was successful.
 */
  process(inputs, outputs, parameters) {
      const input = inputs[0];
      let isCurrentlyExceeding = false;
      let maxRms = 0; // To track the maximum RMS in this process block

      for (let channel = 0; channel < input.length; ++channel) {
          const samples = input[channel];
          let sum = 0;
          for (let i = 0; i < samples.length; i++) {
              sum += samples[i] * samples[i];
          }
          let rms = Math.sqrt(sum / samples.length);
          maxRms = Math.max(maxRms, rms); // Update max RMS value
      }

      // Check if the max RMS value exceeds the threshold
      if (maxRms > parameters.threshold[0]) {
          isCurrentlyExceeding = true;
          if (this.wasBelowThreshold && (currentTime - this.belowThresholdSince) >= 1.0) {
              this.port.postMessage('crossed');
              this.wasBelowThreshold = false;
          }
      } else {
          if (!this.wasBelowThreshold) {
              this.wasBelowThreshold = true;
              this.belowThresholdSince = currentTime;
          }
      }

      if (isCurrentlyExceeding) {
          this.port.postMessage('exceeded');
      }

      return true;
  }
}

registerProcessor('rms-processor', RMSProcessor); 
