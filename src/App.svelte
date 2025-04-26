<!-- This script is not intended to be used for any purpose other than research. 
	It is not a medical device and should not be used for any medical or diagnostic purposes. 
	The authors are not responsible for any misuse of this script. 
	Please read the instructions carefully and follow the guidelines provided. 
	If you have any questions, please contact the authors.
-->
<script>
	import { onMount, onDestroy, tick } from "svelte";
	import { fade } from "svelte/transition";
	import {
		Chart, 
		BarController,
		LineController, 
		LinearScale,
		CategoryScale, 
		BarElement, 
		PointElement,
		LineElement,
	} from "chart.js";
	import SetupComponent from "./SetupComponent.svelte";
	import AudioCalibrationComponent from "./AudioCalibrationComponent.svelte";
	import ResultsComponent from "./ResultsComponent.svelte";
    import { exclude_internal_props } from "svelte/internal";

	Chart.register(
		BarController,
		LineController,
		LinearScale,
		CategoryScale, 
		BarElement,
		PointElement,
		LineElement
	);

	// Variables & constants
		// Gamepad support
		let gamepads2 = []; // Store the connected gamepads
		// let buttonPressedState = new Array(4).fill(null).map(() => []); // Store the button states for each gamepad
		let buttonPressedStates = {}; // Store the button states for each gamepad
		let animationFrameId; // Store the requestAnimationFrame ID

		const updateGamepads = () => {
		// Get all connected gamepads
		const gamepads = navigator.getGamepads();
		gamepads2 = Array.from(navigator.getGamepads()).filter(Boolean);

		for (let i = 0; i < gamepads.length; i++) { 
			const gamepad = gamepads[i];
			if (gamepad) {
			// If we haven't seen this gamepad before, initialize its buttons' states
			if (!buttonPressedStates[gamepad.index]) {
				buttonPressedStates[gamepad.index] = [];
			} 

			gamepad.buttons.forEach((button, index) => {
				// If the button is currently pressed and was not pressed before
				if (button.pressed && !buttonPressedStates[gamepad.index][index]) {
				registerResponse(); // Call the response function  
				buttonPressedStates[gamepad.index][index] = true; // Mark it as pressed
				}
				// If the button is not pressed and was pressed before
				else if (!button.pressed && buttonPressedStates[gamepad.index][index]) {
				buttonPressedStates[gamepad.index][index] = false; // Mark it as not pressed
				}
			});
			}
		}

		// Keep the loop going
		requestAnimationFrame(updateGamepads); 
		};

		// Animation-related constants and variables
			const ANIMATION_DURATION = 3000; // in milliseconds
			let stage = "enterButton"; // enterButton -> animation -> appContent
			let frameCount = 0; // Keep track of the frame count
			let lastSecond = performance.now(); // Keep track of the last second
			let fps = 0; // Keep track of the FPS value
			let isPerformanceDropped = false; // Keep track of the performance drop
			let hasBeenOutOfFocus = false; // Keep track of the focus state

		// User-related variables
			let userName = "";
			let userID = ""; // The ID of the user
			export let name; // The name of the user
			let userHasInteracted = false; // Keep track of the user interaction
			$: gamepadConnected = gamepads2.length > 0; // Check if a gamepad is connected

		// Test settings and state
			// const FREQUENCY = 500; // in Hertz
			let TOTAL_TRIALS = 150; // The total number of trials
			let trialCount = 0; // The current trial number
			let settingTrials = true; // Keep track of the setting trials state
			let testMode = "subtests"; // can be 'subtests' or 'minutes'
			let testMinutes = 5; // The duration of the test in minutes
			let minDelay = 2000; // The minimum delay for the stimulus in milliseconds
			let maxDelay = 6000; // The maximum delay for the stimulus in milliseconds
			let stimulusVisible = false; // Keep track of the stimulus visibility
			let reactionStart = null; // Keep track of the reaction start time
			let reactionTimes = []; // Keep track of the reaction times
			let metrics; // Keep track of the test metrics
			let clickedOnRed = 0; // Keep track of the number of times the user clicked without a stimulus
			let spacebarPressed = false; // Keep track of the spacebar press state
			let gamepadButtonDown = false; // Keep track of the gamepad button press state
			let testDurationTimeoutId; // Keep track of the test duration timeout ID
			let timeoutId; // Keep track of the stimulus timeout ID
			let stimulusTimeoutId; // Keep track of the stimulus timeout ID
			let missedStimulus = 0; // Keep track of the missed stimulus count

		// Audio-related variables
			let audioCueEnabled = true; 
			let visualCueEnabled = false;
			let context; 
			let oscillator;
			let audioCalibrationEnabled = true;
			let audioCalibrationMode = false;
			let shouldPlay = false;

			let baselineRMS = 0;
			let thresholdFactor = 3.5; // This variable determines the multiplication factor for the baseline
			let exceedCount = 0;
			$: exceedCount;
			let isMonitoring = false;
			let microphoneStream;
			let audioWorkletNode;
			let lastInteractionTimestamp = 0;
			let generatorType;
			let frequency;
			let usingHeadphones; 
			let wasBelowThreshold = true;
			let thresholdCrossCount = 0;
			$: halfedCrossCount = Math.ceil(thresholdCrossCount / 2)

			const setBaselineRMS = (value) => {
				baselineRMS = value;
				console.log(`Baseline RMS set to: ${baselineRMS}`);
			};

		// Chart-related variables
			let histogramChart;
			let reactionTimeChart;

	// Functions
		// 1. Event Listeners and Handlers
			function handleInteraction() {
				lastInteractionTimestamp = Date.now();
			}

			function handleUserInteraction() {
				userHasInteracted = true;
				if (!context) {
					context = new AudioContext();
				}
			}

			function handleKeydown(event) {
				if (event.key === " ") {
					if (!spacebarPressed) {
						spacebarPressed = true;
						registerResponse();
					}
				} else if (event.key === "Escape") {
					resetTest();
				} 
			}

			function handleKeyup(event) { 
				if (event.key === " ") { 
					spacebarPressed = false; 
				}
			}

			function handleBlur() {
				hasBeenOutOfFocus = true; 
			}

			function update() {
				const now = performance.now();
				const delta = now - lastSecond;

				if (delta >= 1000) {
				// Update the FPS value once every second
				fps = frameCount;
				
				// Check if FPS falls below 55
				if (fps < 30) {
					isPerformanceDropped = true;
				}

				frameCount = 0; 
				lastSecond = now; 
				}

				frameCount++;
				requestAnimationFrame(update); // Schedule the next frame
			}

			onMount(() => {
				updateGamepads();
				requestAnimationFrame(update);

				window.addEventListener("keydown", handleKeydown);
				window.addEventListener("keyup", handleKeyup);

				return () => {
					window.removeEventListener("keydown", handleKeydown);
					window.removeEventListener("keyup", handleKeyup);
				};
			});

			onDestroy(() => {
				cancelAnimationFrame(animationFrameId);
				cancelAnimationFrame(update);
				window.removeEventListener('blur', handleBlur);
			});

			$: if (trialCount === TOTAL_TRIALS) {
				metrics = getMetrics();
				stopTone();
				stopAudioMonitoring();
				tick().then(updateCharts);
			}

			// 2. Audio Functions
				// Toggle the calibration tone
				function playCalibrationTone() {
					if (shouldPlay) {
						stopTone();
					} else {
						shouldPlay = true;
						startTone();
					}
				}

				// Start the tone if shouldPlay is true
				function startTone() {
					stopExistingOscillator(); 
					if (!shouldPlay) return;
					createAndStartOscillator();
				}

				// Play the tone if settingTrials is false
				function playTone() {
					stopExistingOscillator();
					if (!settingTrials) {
						createAndStartOscillator();
					}
				}

				// Stop the currently playing tone
				function stopTone() { 
					shouldPlay = false; 
					stopExistingOscillator(); 
				}

				// Helper function to stop and nullify an existing oscillator
				function stopExistingOscillator() {
					if (oscillator) {
						oscillator.stop();
						oscillator = null;
					}
				}

				// Helper function to create and start an oscillator
				function createAndStartOscillator() {
					oscillator = context.createOscillator();
					oscillator.type = generatorType;
					oscillator.frequency.setValueAtTime(frequency, context.currentTime);
					oscillator.connect(context.destination);
					oscillator.start();
				}

		// 3. Test Flow Functions
			// Function to go back to instructions
			function backToInstructions() {
				resetTest();
				stage = "enterButton";
			}

			/**
			 * Function to continue the test.
			 * Stops the tone, disables audio calibration mode and starts the test.
			 */
			function continueTest() {
				stopTone();
				audioCalibrationMode = false;
				audioCalibrationEnabled = false;
				startTest();
			}

			/**
			 * Starts the animation and transitions the stage from "appContent" to "animation".
			 * After the animation duration, transitions the stage back to "appContent".
			 */
			function startAnimation() {
				stage = "animation";
				setTimeout(() => {
					stage = "appContent";
				}, ANIMATION_DURATION);
			}

			/**
			 * Function to show the stimulus.
			 * If settingTrials is false, the stimulus will be made visible and the reaction start time will be recorded.
			 * If no response is registered within 2 seconds, the stimulus will be hidden, the missed stimulus counter will be incremented, and the next stimulus will be shown.
			 * If audioCueEnabled is true and settingTrials is false, a tone will be played.
			 */
			function showStimulus() {
				if (!settingTrials) {
					stimulusVisible = true;
					reactionStart = new Date().getTime();

					// Set a timeout to hide the stimulus after 2 seconds if no response is registered
					stimulusTimeoutId = setTimeout(() => {
						if (stimulusVisible) {
							stimulusVisible = false;
							stopTone();
							missedStimulus++; // Increment missed stimulus counter
							console.log("Missed stimulus count:", missedStimulus);

							// Continue with the next stimulus
							trialCount++;
							if (trialCount < TOTAL_TRIALS) {
								timeoutId = setTimeout(
									showStimulus,
									Math.random() * (maxDelay - minDelay) + minDelay
								);
							}
						}
					}, 2000); // 2000 milliseconds = 2 seconds

					if (audioCueEnabled && !settingTrials) {
						playTone();
					}
				}
			}


			// Initialize a flag outside the function to track even and odd gamepad events.
			let isEvenGamepadEvent = true;

			/**
			 * Function to handle the response after registering.
			 * It cancels the timeout if it exists, stops the oscillator if it is active,
			 * and performs various actions based on the state of stimulus visibility,
			 * setting trials, and audio calibration mode.
			 * If it's a gamepad button event, it increments the clickedOnRed variable
			 * based on whether it's an even event or not.
			 * If it's not a gamepad event, it simply increments the clickedOnRed variable.
			 * If the stimulus is visible, it calculates the reaction time, updates the
			 * stimulus visibility, increments the trial count, and schedules the next stimulus
			 * if the total trial count is not reached.
			 */
			function registerResponse() {
				if (stimulusTimeoutId) {
					clearTimeout(stimulusTimeoutId); // Cancel the 2-second timeout
				}
				if (oscillator) {
					oscillator.stop();
					oscillator = null;
				}

				if (!stimulusVisible && !settingTrials && !audioCalibrationMode) {
					// Toggle the flag if it's a gamepad button event.
					if (gamepadButtonDown) {
						if (isEvenGamepadEvent) {
							// Only increment on even events.
							clickedOnRed += 1;
							console.log('clickedOnRed changed:', clickedOnRed);
						}
						// Toggle the flag each time a gamepad button event occurs.
						isEvenGamepadEvent = !isEvenGamepadEvent;
					} else {
						// If it's not a gamepad event, just increment.
						clickedOnRed += 1;
						console.log('clickedOnRed changed:', clickedOnRed);
					}
				}

				if (stimulusVisible) {
					let now = new Date().getTime();
					reactionTimes.push(now - reactionStart);
					stimulusVisible = false;
					trialCount++;
					if (trialCount < TOTAL_TRIALS) {
						timeoutId = setTimeout(
							showStimulus,
							Math.random() * (maxDelay - minDelay) + minDelay
						);
					}
				}
			}

			/**
			 * Starts the test.
			 * - Adds a blur event listener.
			 * - Starts audio monitoring if baselineRMS is not 0.
			 * - Clears the timeoutId if it exists.
			 * - Stops the oscillator if it exists.
			 * - Resets various counters and flags.
			 * - Sets audioCalibrationMode to true if audioCalibrationEnabled is true.
			 * - Sets settingTrials to false.
			 * - Sets timeoutId to showStimulus with a random delay if testMode is "subtests".
			 * - Sets TOTAL_TRIALS and trialCount if testMode is "minutes".
			 * - Sets testDurationTimeoutId to end the test after the specified duration if testMode is "minutes".
			 * - Sets timeoutId to showStimulus with a random delay if testMode is "minutes".
			 */
			function startTest() {
				window.addEventListener('blur', handleBlur);
				if (baselineRMS !== 0) {
					startAudioMonitoring();
					console.log("Audio monitoring started")
				}
				
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				if (oscillator) {
					oscillator.stop();
					oscillator = null;
				}
				clickedOnRed = 0;
				exceedCount = 0;
				wasBelowThreshold = true;
				thresholdCrossCount = 0;
				missedStimulus = 0;
				if (audioCalibrationEnabled) {
					settingTrials = false;
					audioCalibrationMode = true;
					return;
				}
				settingTrials = false;

				if (testMode === "subtests") {
					timeoutId = setTimeout(
						showStimulus,
						Math.random() * (maxDelay - minDelay) + minDelay
					);
				}
				if (testMode === "minutes") {
					const durationInMillis = testMinutes * 60 * 1000;
					const avgTrialDuration = (minDelay + maxDelay) / 2;
					TOTAL_TRIALS = Math.floor(durationInMillis / avgTrialDuration);
					trialCount = 0;

					testDurationTimeoutId = setTimeout(() => {
						if (timeoutId) {
							clearTimeout(timeoutId);
						}
						if (oscillator) {
							oscillator.stop();
						}
						trialCount = TOTAL_TRIALS;
						metrics = getMetrics();
						window.removeEventListener('blur', handleBlur);
					}, durationInMillis);

					timeoutId = setTimeout(
						showStimulus,
						Math.random() * (maxDelay - minDelay) + minDelay
					);
				}
			}

			/**
			 * Resets the test by clearing timeouts, stopping the tone, removing event listeners,
			 * resetting variables, and initializing counters.
			 */
			function resetTest() {
				if (stimulusTimeoutId) {
					clearTimeout(stimulusTimeoutId); // Cancel the 2-second timeout
				}
				if (timeoutId) {
					clearTimeout(timeoutId); // Cancel the stimulus timeout
				}
				if (oscillator) {
					oscillator.stop(); // Stop the tone
					oscillator = null; 
				} 
				window.removeEventListener('blur', handleBlur); 
				stopTone(); 
				stopAudioMonitoring(); 
				reactionTimes = []; 
				isPerformanceDropped = false; 
				hasBeenOutOfFocus = false;
				stimulusVisible = false; 
				trialCount = 0; 
				settingTrials = true; 
				clickedOnRed = 0; 
				exceedCount = 0;  
				wasBelowThreshold = true; 
				thresholdCrossCount = 0; 
				missedStimulus = 0; 
			}

		// 4. Helper Functions
			/**
			 * Calculates the percentile of a sorted array.
			 * 
			 * @param {Array} sortedArray - The sorted array of numbers.
			 * @param {number} p - The percentile value between 0 and 100.
			 * @returns {number} - The calculated percentile value.
			 * @throws {TypeError} - If the percentile value is not a number between 0 and 100.
			 */
			function percentile(sortedArray, p) {
				if (sortedArray.length === 0) return 0; 
				if (typeof p !== "number") 
					throw new TypeError("Percentile must be a number between 0 and 100"); 
				if (p <= 0) return sortedArray[0]; 
				if (p >= 100) return sortedArray[sortedArray.length - 1]; 

				let idx = ((sortedArray.length - 1) * p) / 100, 
					lower = Math.floor(idx),
					upper = Math.ceil(idx), 
					weight = idx % 1;

				if (upper >= sortedArray.length) return sortedArray[lower];
				return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
			}

			/**
			 * Calculates various metrics based on the reaction times.
			 * 
			 * @returns {Object} An object containing the calculated metrics:
			 *   - min: The minimum reaction time.
			 *   - max: The maximum reaction time.
			 *   - mean: The mean (average) reaction time.
			 *   - median: The median reaction time.
			 *   - p10: The 10th percentile reaction time.
			 *   - p25: The 25th percentile reaction time.
			 *   - p50: The 50th percentile reaction time (same as median).
			 *   - p75: The 75th percentile reaction time.
			 *   - p90: The 90th percentile reaction time.
			 *   - crtIndex: The CRT index, calculated as p50 divided by the difference between p90 and p10.
			 */
			function getMetrics() {
				let sortedTimes = [...reactionTimes].sort((a, b) => a - b); 

				let min = sortedTimes[0]; 
				let max = sortedTimes[sortedTimes.length - 1];
				let mean = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
				let median = percentile(sortedTimes, 50);
				let p10 = percentile(sortedTimes, 10);
				let p25 = percentile(sortedTimes, 25); 
				let p50 = median;
				let p75 = percentile(sortedTimes, 75);
				let p90 = percentile(sortedTimes, 90);
				let crtIndex = p90 - p10 !== 0 ? p50 / (p90 - p10) : 0;

				return { min, max, mean, median, p10, p25, p50, p75, p90, crtIndex };
			}

			/**
			 * Copies the results to the clipboard.
			 */
			async function copyToClipboard() {
				// Generate a string with the results
				let tableStr = `
					ID: ${userID}
					Number of trials: ${trialCount}
					Min Reaction Time [ms]: ${Math.round(metrics.min)}
					Max Reaction Time [ms]: ${Math.round(metrics.max)}
					Mean Reaction Time [ms]: ${Math.round(metrics.mean)}
					Median Reaction Time [ms]: ${Math.round(metrics.median)}
					10th Percentile [ms]: ${Math.round(metrics.p10)}
					25th Percentile [ms]: ${Math.round(metrics.p25)}
					50th Percentile [ms]: ${Math.round(metrics.p50)}
					75th Percentile [ms]: ${Math.round(metrics.p75)}
					90th Percentile [ms]: ${Math.round(metrics.p90)}
					CRT Index: ${metrics.crtIndex.toFixed(2)}
					Clicked without stimulus: ${clickedOnRed}
					Exceeded audio threshold duration: ${exceedCount}
					Crossed audio threshold count: ${halfedCrossCount}
					Missed stimulus count (>2 sec): ${missedStimulus}
					Function generator type: ${generatorType}
					Function generator frequency [Hz]: ${frequency}
					Used headphones: ${usingHeadphones}
					Gamepad connected: ${gamepadConnected}
				`;
				
				try {
					// Copy the results to the clipboard
					await navigator.clipboard.writeText(tableStr);
					alert("Results copied to clipboard!");
				} catch (err) {
					console.error("Failed to copy text: ", err);
					alert("Failed to copy the results. Please try again.");
				}
			}

			async function copyToClipboardForSpreadSheet() {
				// Extract only the variable values
				let values = [
					userID,
					trialCount,
					Math.round(metrics.min),
					Math.round(metrics.max),
					Math.round(metrics.mean),
					Math.round(metrics.median),
					Math.round(metrics.p10),
					Math.round(metrics.p25),
					Math.round(metrics.p50),
					Math.round(metrics.p75),
					Math.round(metrics.p90),
					metrics.crtIndex.toFixed(2),
					clickedOnRed,
					exceedCount,
					halfedCrossCount,
					missedStimulus,
					generatorType,
					frequency,
					usingHeadphones,
					gamepadConnected
				];

				let formattedStr = values.join("\t");

				try {
					await navigator.clipboard.writeText(formattedStr);
					alert("Results copied to clipboard!");
				} catch (err) {
					console.error("Failed to copy text: ", err);
					alert("Failed to copy the results. Please try again.");
				}
			}


		// 5. Chart Functions
			/**
			 * Updates the charts based on the reaction times.
			 * Calculates the bins for the histogram chart.
			 * Calculates the counts for each bin.
			 * Creates and updates the histogram chart.
			 * Creates and updates the reaction time chart.
			 */
			function updateCharts() {
				window.removeEventListener('blur', handleBlur);
				metrics = getMetrics();

				let max = Math.max(...reactionTimes);
				let min = Math.min(...reactionTimes);
				const binSize = (max - min) / 10;
				const bins = Array.from({ length: 11 }, (_, i) => min + i * binSize);

				const counts = Array(bins.length).fill(0);

				reactionTimes.forEach((time) => {
					if (time === max) {
						counts[counts.length - 1]++;
					} else {
						const binIndex = bins.findIndex(
							(_, i) => time >= bins[i] && time < bins[i + 1]
						);
						if (binIndex !== -1) counts[binIndex]++;
					}
				});

				console.log(reactionTimes);
				console.log(bins);
				console.log(counts);

				if (histogramChart) {
					histogramChart.destroy();
				}

				const ctxHistogram = document
					.getElementById("histogramChart")
					.getContext("2d");
				histogramChart = new Chart(ctxHistogram, {
					type: "bar",
					data: {
						labels: bins
							.slice(0, -1)
							.map(
								(value, i) =>
									`${value.toFixed(2)} - ${bins[i + 1].toFixed(2)}`
							),
						datasets: [
							{
								label: "Reaction Time Distribution",
								data: counts,
								backgroundColor: "rgba(75, 192, 192, 0.2)",
								borderColor: "rgba(75, 192, 192, 1)",
								borderWidth: 1,
							},
						],
					},
					options: {
						scales: {
							y: {
								ticks: {
									beginAtZero: true,
								},
							},
						},
					},
				});

				if (reactionTimeChart) {
					reactionTimeChart.destroy();
				}

				const ctxReactionTime = document
					.getElementById("reactionTimeChart")
					.getContext("2d");
				reactionTimeChart = new Chart(ctxReactionTime, {
					type: "line",
					data: {
						labels: reactionTimes.map((_, i) => i + 1), // Tone number
						datasets: [
							{
								label: "Reaction Time per Tone",
								data: reactionTimes,
								borderColor: "rgba(255, 99, 132, 1)",
								fill: false,
							},
						],
					},
					options: {
						scales: {
							y: {
								ticks: {
									beginAtZero: true,
								},
							},
						},
					},
				});
			}

		// 6. Audio Monitoring Functions
			/**
			 * Starts audio monitoring by accessing the user's microphone and creating an AudioContext.
			 * If the AudioContext is already created, it will reuse the existing one.
			 * It adds an audio worklet module for processing the audio stream and sets the threshold value.
			 * The audio worklet node receives messages indicating if the audio level has exceeded or crossed the threshold.
			 * The behavior of the audio monitoring depends on whether headphones are being used and the audio calibration mode.
			 * If headphones are being used, it tracks the number of times the audio level exceeds or crosses the threshold.
			 * If headphones are not being used and there is no active oscillator, it also tracks the number of times the audio level exceeds or crosses the threshold.
			 * @returns {Promise<void>} A promise that resolves when the audio monitoring is started successfully.
			 */
			async function startAudioMonitoring() {
				if (!context) {
					context = new AudioContext();
				}
				try {
					microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
					const source = context.createMediaStreamSource(microphoneStream);
					await context.audioWorklet.addModule('rms-processor.js');
					audioWorkletNode = new AudioWorkletNode(context, 'rms-processor');
					// Set the threshold for the audioWorkletNode
					const thresholdValue = baselineRMS * thresholdFactor; 
					audioWorkletNode.parameters.get('threshold').setValueAtTime(thresholdValue, context.currentTime);
					audioWorkletNode.port.onmessage = (event) => {
						console.log(event.data)
						if (usingHeadphones) {
							if (event.data === 'exceeded' && audioCalibrationMode === false) {
								const timeSinceLastInteraction = Date.now() - lastInteractionTimestamp;
								if (timeSinceLastInteraction > 170) {
									exceedCount++;
								}
							}
							if (event.data === 'crossed' && audioCalibrationMode === false) {
								const timeSinceLastInteraction = Date.now() - lastInteractionTimestamp;
								if (timeSinceLastInteraction > 170) {
									thresholdCrossCount++;
								}
							}
						} else {
							if (event.data === 'exceeded' && (!oscillator) && audioCalibrationMode === false) {
								const timeSinceLastInteraction = Date.now() - lastInteractionTimestamp;
								if (timeSinceLastInteraction > 170) {
									exceedCount++;
								}
							}
							if (event.data === 'crossed' && (!oscillator) && audioCalibrationMode === false) {
								const timeSinceLastInteraction = Date.now() - lastInteractionTimestamp;
								if (timeSinceLastInteraction > 170) {
									thresholdCrossCount++;
								}
							}
						}
					};
					source.connect(audioWorkletNode).connect(context.destination);
					isMonitoring = true;
				} catch (error) {
					console.error('Error accessing microphone:', error);
				}
			}

			function stopAudioMonitoring() {
				if (microphoneStream) {
					const tracks = microphoneStream.getTracks(); 
					tracks.forEach(track => track.stop());
					microphoneStream = null;
				}
				if (audioWorkletNode) {
					if (audioWorkletNode.port.onmessage) {
						audioWorkletNode.port.onmessage = null;
					}
					audioWorkletNode.disconnect();
					audioWorkletNode = null;
					console.log("Audio monitoring stopped")
				}
				if (context) {
					context.close().then(() => {
						context = null; // Close and clean up the context
						isMonitoring = false;
					});
				}
			}
</script>

<svelte:head>
	<title>{name} {Math.round((trialCount/TOTAL_TRIALS)*100)}% FPS: {fps} N: {exceedCount} CC: {halfedCrossCount}</title>
</svelte:head>
<svelte:body on:click={handleInteraction} on:keydown={handleInteraction} />
<div on:click={handleUserInteraction} on:keypress={handleUserInteraction}>
{#if stage === "enterButton"}
	<div class="parent-setup">
		<div class="setup2" out:fade={{ duration: 400 }}>
			<h1>Browser-based Continous Reaction Time Test</h1>
            <h2>RESEARCH USE ONLY</h2>
			
			<h3>About This Application</h3>
			<p>
				The Browser-based Continuous Reaction Time Test (BbCRT) is a sophisticated research tool designed to measure cognitive response speed and variability with high precision. This application enables researchers and clinicians to assess attention and psychomotor function through standardized stimulus-response paradigms. Unlike traditional reaction time tests, BbCRT provides comprehensive analysis of response patterns, including statistical distributions and threshold-crossing metrics. The application leverages modern web technologies to deliver laboratory-grade measurements across various devices while monitoring environmental factors that might affect test validity. BbCRT is particularly valuable for cognitive research, neurological assessment, and experimental psychology, offering configurable parameters to adapt to specific research protocols and participant needs.
			</p>
			
			<h3>Features</h3> 
			<ol>
				<li>Continuous Reaction Time testing with configurable stimuli</li>
				<li>Support for both audio and visual cues</li>
				<li>Customizable test parameters (number of trials, duration, delays)</li>
				<li>Audio calibration with different waveform types</li>
				<li>Background audio monitoring to detect environmental noise</li>
				<li>Native gamepad integration for response input</li>
				<li>Comprehensive statistical analysis of reaction times</li>
				<li>Visual data representation with interactive charts</li>
				<li>Easy export of results for further analysis</li>
			</ol>
			
			<h3>Technical Highlights</h3>
			<ul>
				<li><strong>Web Technology:</strong> Built with Svelte for optimal performance</li>
				<li><strong>Audio Processing:</strong> Real-time audio analysis using Web Audio API</li>
				<li><strong>Data Visualization:</strong> Interactive charts using Chart.js</li>
				<li><strong>Input Detection:</strong> Multiple input methods (keyboard, mouse, gamepad)</li>
				<li><strong>Performance Monitoring:</strong> FPS tracking to ensure test validity</li>
				<li><strong>Statistical Analysis:</strong> Comprehensive metrics including percentile calculations</li>
			</ul>
			
			<h3>User Guide</h3>
			<ol>
				<li><strong>Setup:</strong> Enter your ID and configure test parameters (audio/visual cues, test duration, delays)</li>
				<li><strong>Audio Baseline:</strong> If using audio monitoring, set the baseline RMS value in a quiet environment</li>
				<li><strong>Audio Calibration:</strong> If enabled, verify you can hear the test tone clearly</li>
				<li><strong>During Test:</strong> Respond quickly when you detect the stimulus (space bar, mouse click, or gamepad button)</li>
				<li><strong>Test Completion:</strong> Review your results including reaction time statistics and charts</li>
				<li><strong>Data Export:</strong> Use the "Copy Results" buttons to export your data for further analysis</li>
			</ol>
			
			<h3>Privacy Statement</h3>
			<p>
				This application collects data for research purposes only. By using this application, you agree to the following:
			</p>
			<ul>
				<li><strong>Data Collection:</strong> We collect your provided ID, reaction times, audio signal metrics, device performance data, and information about connected peripherals.</li>
				<li><strong>Microphone Access:</strong> This app requires microphone access to monitor audio signals and calculate baseline audio levels. No audio content is recorded or stored.</li>
				<li><strong>Local Processing:</strong> All data processing occurs locally in your browser. No data is automatically transmitted to external servers.</li>
				<li><strong>Data Sharing:</strong> Test results are only shared when you manually copy them to your clipboard.</li>
				<li><strong>Data Storage:</strong> No data persists after you close this application.</li>
				<li><strong>Research Usage:</strong> Collected data will be used for scientific research as described in the study information.</li>
			</ul>

            <h4>Acknowledgments</h4>
			<p>This application is built using open-source software:</p>
			<ul>
				<li>
					<strong>Chart.js</strong> - A JavaScript library for data visualization
					<br>
					<span class="license-text">Copyright (c) 2014-present Chart.js Contributors. 
					<a href="https://github.com/chartjs/Chart.js/blob/master/LICENSE.md" target="_blank" rel="noopener noreferrer">MIT License</a></span>
				</li>
				<li>
					<strong>Svelte</strong> - A radical new approach to building user interfaces
					<br>
					<span class="license-text">Copyright (c) 2016-present Svelte Contributors. 
					<a href="https://github.com/sveltejs/svelte/blob/master/LICENSE.md" target="_blank" rel="noopener noreferrer">MIT License</a></span>
				</li>
			</ul>
			
			<h3>Connected Gamepads</h3>
			{#if gamepads2.length > 0}
				<ul>
				{#each gamepads2 as gamepad, index}
					<li>Gamepad {index + 1}: {gamepad.id}</li>
				{/each}
				</ul>
			{:else}
				<p>No gamepads connected.</p>
			{/if}
			<p><button on:click={startAnimation}>Agree</button></p>
		</div>
	</div>
{/if}

{#if stage === "animation"}
	<div class="container2">
		<div class="logo">
			<img
				src="logo.png"
				alt="Logo"
				in:fade={{ delay: 500, duration: 1300 }}
			/>
		</div>
	</div>
{/if}

{#if stage === "appContent"}
	{#if settingTrials}
		<SetupComponent
			bind:testMode
			bind:TOTAL_TRIALS
			bind:testMinutes
			bind:minDelay
			bind:maxDelay
			bind:audioCueEnabled
			bind:visualCueEnabled
			bind:audioCalibrationEnabled
			bind:userID
			bind:baselineRMS
			bind:generatorType
			bind:frequency
			bind:usingHeadphones
			
			on:baselineSet={e => setBaselineRMS(e.detail)}
			setBaselineRMSFunction={setBaselineRMS}
			{startTest}
		/>
		<div class="button-wrapper">
			<button on:click={backToInstructions} class="instruction-button">
				Back to Instructions
			</button>
		</div>
		
	{:else if audioCalibrationMode}
		<AudioCalibrationComponent
			bind:shouldPlay
			{playCalibrationTone}
			{continueTest}
		/>
		<div class="button-wrapper">
			<button on:click={backToInstructions} class="instruction-button">
				Back to Instructions
			</button>
		</div>
	{:else if trialCount < TOTAL_TRIALS}
		<div class="container2">
			<div class="button-wrapper">
				{#if visualCueEnabled}
					<button
						on:mousedown={registerResponse}
						class="response-button"
						class:click-me={stimulusVisible}
						class:wait-for-it={!stimulusVisible}
					>
						{#if stimulusVisible}
							Click Me! (SPACE BAR)
						{:else}
							Wait for it...
						{/if}
					</button>
				{:else}
					<div class="container3">
						Press SPACE when you hear a tone
					</div>
				{/if}
			</div>
			<div class="button-wrapper">
				<button on:click={resetTest} class="response-button cancel"
					>Cancel Test (Esc)</button
				>
			</div>
		</div>
	{:else}
		<ResultsComponent
			bind:metrics
			bind:userID
			bind:trialCount
			bind:clickedOnRed
			bind:exceedCount
			bind:isPerformanceDropped
			bind:hasBeenOutOfFocus
			bind:halfedCrossCount
			bind:frequency
			bind:missedStimulus
			bind:generatorType
			bind:usingHeadphones
			bind:gamepadConnected
			{copyToClipboard}
			{copyToClipboardForSpreadSheet}
			{resetTest}
		/>
		<div class="button-wrapper">
			<button on:click={backToInstructions} class="instruction-button">
				Back to Instructions
			</button>
		</div>
	{/if}
{/if}
</div>

<style>
	/* Layout Containers */
	.parent-setup,
	.container3 {
		display: grid;
		justify-content: center;
		align-items: center;
		padding: 15px;
	}

	.container2 {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 90vh;
		padding: 15px;
	}

	/* Buttons */
	button {
		padding: 1rem 2rem;
		font-size: 1.5rem;
		cursor: pointer;
		background-color: #f03c14;
		color: #ffffff;
		border: none;
		border-radius: 4px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		outline: none;
		transition: box-shadow 0.3s ease, transform 0.3s ease;
	}

	button:hover {
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
	}

	button:active {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transform: scale(0.98);
	}

	button:focus {
		outline: 2px solid #007bff;
		box-shadow: 0 0 5px #007bff;
	}

	.click-me {
		background-color: #5af014;
	}

	.cancel {
		background-color: #14c8f0;
	}

	.response-button {
		font-size: 2rem;
		padding: 2rem 4rem;
		display: flex;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		justify-content: center;
		align-items: center;
	}

	.button-wrapper {
		padding: 15px 0;
		width: 80vw;
	}

	.button-wrapper:first-child {
		flex: 9;
	}

	.button-wrapper:last-child {
		flex: 1;
	}

	/* Other Styles */
	.container3 {
		font-size: x-large;
		font-weight: bold;
	}

	.logo {
		display: block;
		align-items: center;
		justify-content: center;
		fill: #786e64;
		fill-opacity: 1;
		fill-rule: evenodd;
		stroke: none;
		margin-bottom: 10vh;
	}
	
	.instruction-button {
		background-color: #14a7f0;
		margin-top: 20px;
		font-size: 1.2rem;
		padding: 0.8rem 1.5rem;
	}
	
	.instruction-button:hover {
		background-color: #0e86c0;
	}
</style>
