# Browser-based Continuous Reaction Time Test (BbCRT)



## Overview
<img src="logo.png" width="300" align="right">
The Browser-based Continuous Reaction Time Test (BbCRT) is a sophisticated research tool designed to measure cognitive response speed and variability with high precision. This application enables researchers and clinicians to assess attention and psychomotor function through standardized stimulus-response paradigms. 

Unlike traditional reaction time tests, BbCRT provides comprehensive analysis of response patterns, including statistical distributions and threshold-crossing metrics. The application leverages modern web technologies to deliver laboratory-grade measurements across various devices while monitoring environmental factors that might affect test validity.

**IMPORTANT: This application is intended for research purposes only. It is not a medical device and should not be used for any medical or diagnostic purposes.**

## Features

### Core Functionality
- Continuous Reaction Time testing with configurable stimuli
- Support for both audio and visual cues
- Multiple test modes (fixed number of trials or time-based duration)
- Comprehensive statistical analysis of reaction time data
- Interactive data visualization with histograms and temporal charts
- Easy export of results for further analysis
- Performance monitoring to validate test sessions

### Advanced Capabilities
- Audio calibration with different waveform types (sine, square, triangle, sawtooth)
- Customizable frequency settings (20Hz - 20000Hz)
- Background audio monitoring to detect environmental noise
- Native gamepad integration for response input
- Detailed metrics including percentile calculations and CRT Index
- Detection of missed stimuli and false responses
- Environment validity tracking (performance drops, focus changes)

### Technical Highlights
- **Web Technology:** Built with Svelte for optimal performance and reactivity
- **Audio Processing:** Real-time audio analysis using Web Audio API and AudioWorklet
- **Data Visualization:** Interactive charts using Chart.js
- **Input Detection:** Multiple input methods (keyboard, mouse, gamepad)
- **Performance Monitoring:** FPS tracking to ensure test validity
- **Statistical Analysis:** Comprehensive metrics including percentile calculations

## Installation

### Online Version

You can try out the application directly from your browser by visiting:
**[https://apob-100.github.io/BbCRT](https://apob-100.github.io/BbCRT)**

This link points to the latest stable version hosted via GitHub Pages. No installation required!

### Prerequisites for Local Development
- Node.js (v14 or later)
- npm (v6 or later)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/bbcrt.git
   cd bbcrt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Deploy the contents of the `public` directory to your web server.

## Usage Guide

### For Researchers and Clinicians

#### 1. Setup
- Launch the application in a modern web browser (Chrome recommended)
- Enter a unique participant ID
- Configure test parameters:
  - Audio generator type (sine, square, triangle, sawtooth)
  - Frequency (Hz)
  - Test mode (fixed trials or time-based)
  - Stimulus delays (minimum and maximum)
  - Enable/disable audio/visual cues
  - Audio monitoring settings

#### 2. Audio Calibration (if enabled)
- Ensure the testing environment is quiet
- Set a baseline RMS value by clicking "Set Current RMS as Baseline"
- If using audio cues, verify the participant can hear the test tone clearly

#### 3. Running the Test
- Instruct the participant to respond as quickly as possible when they detect the stimulus
- Response methods:
  - Press the spacebar
  - Click the on-screen button (if visual cues enabled)
  - Press a gamepad button (if connected)
- The test will automatically progress through all trials or until the time limit

#### 4. Results Analysis
- Review comprehensive statistics:
  - Min, max, mean, and median reaction times
  - Percentiles (10th, 25th, 50th, 75th, 90th)
  - CRT Index (reflects cognitive processing stability)
  - Validity indicators (false responses, audio threshold crossings, missed stimuli)
- Copy results for documentation or further analysis
- Examine visual data representations:
  - Reaction time distribution histogram
  - Temporal reaction time chart

### For Participants

1. Follow the researcher's instructions
2. When using audio cues, listen for the tone and press the spacebar as quickly as possible
3. When using visual cues, click the green button or press spacebar when it appears
4. Maintain focus throughout the test session
5. Avoid unnecessary movements or sounds when audio monitoring is enabled

## Technical Documentation

### Application Architecture

The BbCRT application is built using a component-based architecture with Svelte as the framework:

- **App.svelte**: Main application component orchestrating the entire test flow
- **SetupComponent.svelte**: Handles test configuration and audio baseline calibration
- **AudioCalibrationComponent.svelte**: Provides audio tone verification
- **ResultsComponent.svelte**: Displays and exports test results with visualizations
- **rms-processor.js**: AudioWorklet processor for real-time audio analysis

### Key Technologies

#### Svelte Framework
BbCRT utilizes Svelte for building high-performance user interfaces with minimal runtime overhead. Svelte compiles components to highly efficient imperative code that surgically updates the DOM.

#### Web Audio API
The application leverages the Web Audio API for:
- Generating various waveform types for audio stimuli
- Real-time audio analysis using AudioWorklet
- Environmental noise monitoring through RMS calculation

#### Chart.js
Data visualization is implemented using Chart.js to provide:
- Reaction time distribution histograms
- Temporal charts of reaction times across trials

#### Gamepad API
Integration with physical gamepad controllers is achieved through the Gamepad API, providing additional input methods beyond keyboard and mouse.

### Data Flow

1. **Configuration Phase**
   - User settings are collected and stored in reactive state variables
   - Audio context is initialized when user interaction occurs
   - Baseline audio levels are captured for threshold detection

2. **Test Execution Phase**
   - Stimuli are presented at random intervals within configured constraints
   - Timestamps are recorded at stimulus presentation and user response
   - Audio monitoring runs concurrently to detect environmental interference
   - Performance metrics are tracked to validate test conditions

3. **Analysis Phase**
   - Raw reaction times are processed to calculate statistical measures
   - Data is visualized through interactive charts
   - Results are formatted for export

### Audio Processing Details

The application uses an `AudioWorklet` to process audio data in a separate high-priority thread:

```javascript
// rms-processor.js
class RMSProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'threshold', defaultValue: 0 }];
  }
  
  constructor() {
    super();
    this.wasBelowThreshold = true;
    this.belowThresholdSince = 0;
  }
  
  process(inputs, outputs, parameters) {
    // Audio processing logic
    // ...
    return true;
  }
}
registerProcessor('rms-processor', RMSProcessor);
```

This processor calculates the RMS (Root Mean Square) value of the audio input and compares it against a threshold to detect environmental noise that could invalidate test results.

## Privacy and Data Handling

### Data Collection
BbCRT collects the following data during test sessions:
- User-provided ID (no personally identifiable information required)
- Reaction time measurements
- Audio signal metrics (for threshold detection only)
- Device performance data
- Information about connected peripherals

### Data Storage and Sharing
- All processing occurs locally in the browser
- No data is automatically transmitted to external servers
- Test results are only shared when manually copied to the clipboard
- No data persists after closing the application

## Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| Test Mode | "subtests" (fixed trials) or "minutes" (fixed duration) | "subtests" |
| Total Trials | Number of stimuli presentations | 150 |
| Test Minutes | Duration of test in minutes | 5 |
| Min Delay | Minimum delay between stimuli (ms) | 2000 |
| Max Delay | Maximum delay between stimuli (ms) | 6000 |
| Audio Cue | Enable/disable audio stimulus | true |
| Visual Cue | Enable/disable visual stimulus | false |
| Audio Calibration | Enable/disable audio calibration step | true |
| Generator Type | Waveform type (sine, square, triangle, sawtooth) | "sine" |
| Frequency | Audio frequency in Hz | 500 |
| Headphones | Indicate if headphones are being used | false |

## Metrics Explained

### Basic Metrics
- **Min/Max Reaction Time**: Fastest and slowest responses
- **Mean Reaction Time**: Average of all responses
- **Median Reaction Time**: Middle value of all responses (50th percentile)

### Percentile Metrics
- **10th Percentile**: 10% of reactions are faster than this value
- **25th Percentile**: First quartile (25% of reactions are faster)
- **50th Percentile**: Median value
- **75th Percentile**: Third quartile (75% of reactions are faster)
- **90th Percentile**: 90% of reactions are faster than this value

### Advanced Metrics
- **CRT Index**: Ratio of median to the difference between 90th and 10th percentiles
- **Clicked without stimulus**: Number of responses when no stimulus was present
- **Exceeded audio threshold duration**: Instances of sustained noise above threshold
- **Crossed audio threshold count**: Number of times noise level crossed threshold
- **Missed stimulus count**: Number of stimuli with no response within 2 seconds

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see [LICENSE](LICENSE) for details.

The AGPL license requires that if you modify and use this software on a network server, you must make your modified source code available to users of that server. This ensures that improvements to the software remain available to the community.

## Acknowledgments

This application is built using open-source software:

- **Chart.js** - A JavaScript library for data visualization  
  Copyright (c) 2014-present Chart.js Contributors  
  [MIT License](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md)

- **Svelte** - A radical new approach to building user interfaces  
  Copyright (c) 2016-present Svelte Contributors  
  [MIT License](https://github.com/sveltejs/svelte/blob/master/LICENSE.md)

---

*Version: 1.0.0*  
*Last Updated: April 18, 2025*  
*© 2025 BbCRT Contributors*
