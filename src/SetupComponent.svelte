<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    
    export let testMode; 
    export let TOTAL_TRIALS;
    export let testMinutes;
    export let minDelay; 
    export let maxDelay; 
    export let audioCueEnabled; 
    export let visualCueEnabled;
    export let audioCalibrationEnabled;
    // export let backgroundMonitorEnabled; 
    export let userID; 
    export let startTest; 
    export let setBaselineRMSFunction;  
    export let generatorType = "sine"; 
    export let frequency = 500;
    export let usingHeadphones = false;

    let audioContext;
    let microphone; 
    let analyser;
    let rmsValue = 0;
    export let baselineRMS = 0;
    let audioMonitoringEnabled = true;
    let startDisabled = false;
    const dispatch = createEventDispatcher();

    // Reactive statement to watch for changes in audioMonitoringEnabled and baselineRMS
    $: startDisabled = audioMonitoringEnabled && baselineRMS === 0;
/*
    const setBaseline = () => {
        baselineRMS = rmsValue;
    };
*/
    const setBaseline = () => {
        setBaselineRMSFunction(rmsValue);
    };

    const handleSetBaselineClick = () => {
        setBaseline();
        setBaselineRMS();
    };

    onMount(() => {
        // Initialize audio context
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                processAudio();
            })
            .catch(err => {
                console.error('Error accessing microphone: ', err);
            });
    });
/*
    onDestroy(() => {
        // Disconnect and close audio resources
        microphone.disconnect();
        analyser.disconnect();
        audioContext.close();
    });
*/
    function processAudio() {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) {
            const value = (dataArray[i] - 128) / 128;
            sum += value * value;
        }
        rmsValue = Math.sqrt(sum / dataArray.length);

        // Recursively call to continuously process audio
        requestAnimationFrame(processAudio);
    }

    function setBaselineRMS() {
        dispatch('baselineSet', rmsValue);
    }

    function scaleForDisplay(value) {
        const scaleFactor = 10000; // Scale factor to convert to integer for display
        return Math.round(value * scaleFactor);
    }

    function resetBaselineRMS() {
        baselineRMS = 0;
    }
</script>
 
<div class="parent-setup">
    <div class="setup">
        <!-- <label for="name-input">Name:</label>
        <input type="text" id="name-input" bind:value={userName} /> -->

        <label for="id-input">ID:</label>
        <input type="text" id="id-input" bind:value={userID} />

        <label for="generatorType">Audio Generator Type:</label>
        <select bind:value={generatorType} id="generatorType">
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
        </select>

        <label for="frequency">Frequency (20Hz - 20000Hz):</label>
        <input type="number" id="frequency" bind:value={frequency} min="20" max="20000" step="1">

        <label for="test-mode">Choose Test Mode:</label>
        <select bind:value={testMode} id="test-mode">
            <option value="subtests">Set Number of Subtests</option>
            <option value="minutes">Set Number of Minutes</option>
        </select>

        {#if testMode === "subtests"}
            <label for="trial-input">Number of Subtests:</label>
            <input
                type="number"
                id="trial-input"
                min="1"
                step="1"
                bind:value={TOTAL_TRIALS}
            />
        {:else}
            <label for="minutes-input"
                >Test Duration (in minutes):</label
            >
            <input
                type="number"
                id="minutes-input"
                min="1"
                step="1"
                bind:value={testMinutes}
            />
        {/if}

        <label for="min-delay-input">Min Delay (ms):</label>
        <input
            type="number"
            id="min-delay-input"
            bind:value={minDelay}
        />

        <label for="max-delay-input">Max Delay (ms):</label>
        <input
            type="number"
            id="max-delay-input"
            bind:value={maxDelay}
        />
        <br />
        <label>
            <input type="checkbox" bind:checked={audioCueEnabled} />
            Enable Audio Cue
        </label>
        <br />
        <label>
            <input type="checkbox" bind:checked={visualCueEnabled} />
            Enable Visual Cue
        </label>
        <br />
        <label>
            <input
                type="checkbox"
                bind:checked={audioCalibrationEnabled}
            />
            Enable Audio Calibration
        </label>
        <br />
        <label>
            <input type="checkbox" bind:checked={audioMonitoringEnabled} />
            Enable Audio Monitoring
        </label>
        <br />
        <label>
            <input type="checkbox" bind:checked={usingHeadphones} />
            Using Headphones
        </label>
        <br />
        {#if audioMonitoringEnabled}
            <div class="baselineRMS-setup">
                <p>Current RMS value: {scaleForDisplay(rmsValue)}</p> <!-- Display up to 2 decimal points -->
                {#if rmsValue != 0}
                    <p>Set RMS value: {scaleForDisplay(baselineRMS)}</p>
                {/if}
                <button on:click={handleSetBaselineClick}>Set Current RMS as Baseline</button>
                <button on:click={resetBaselineRMS}>Reset RMS</button>
            </div>
        {/if}

        <!--
        <label>
            <input
                type="checkbox"
                bind:checked={backgroundMonitorEnabled}
            />
            Enable Background Audio Monitor
        </label>
        <br /> -->
        <button on:click={() => {
            // Disconnect and close audio resources
            microphone.disconnect();
            analyser.disconnect();
            audioContext.close();
        
            startTest();
        }}
        disabled={startDisabled}>
        <!-- <button on:click={startTest}> -->Start Test</button>
    </div>
</div>

<style>
    .parent-setup {
		display: grid;
		justify-items: center;
	}

	.setup {
		display: grid;
		grid-template-rows: auto;
		place-content: start center;
		margin-top: 20px;
		padding: 20px; /* inner space between box content and border */
		border-radius: 8px; /* rounded corners */
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Material Design shadow */
		background-color: #ffffff; /* white background */
		width: max-content; /* lets the box shrink wrap its contents */
		justify-self: center;
	}

    button {
		padding: 1rem 2rem;
		font-size: 1.5rem;
		cursor: pointer;
		background-color: #f03c14; /* Example color from Material Design palette */
		color: #ffffff; /* Text color */
		border: none;
		border-radius: 4px; /* Material Design usually has slight rounding */
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Subtle shadow */
		outline: none; /* Remove default outline */
		transition: box-shadow 0.3s ease, transform 0.3s ease; /* For a smooth feel */
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

    button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
</style>