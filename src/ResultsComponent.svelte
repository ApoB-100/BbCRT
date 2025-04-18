<script>
    export let metrics;
    export let userID;
    export let trialCount;
    export let resetTest;
    export let copyToClipboard;
    export let copyToClipboardForSpreadSheet;
    
    export let clickedOnRed;
    export let exceedCount; 
    export let isPerformanceDropped;
    export let hasBeenOutOfFocus;
    
    export let halfedCrossCount;
    export let usingHeadphones;
    export let frequency;
    export let generatorType;
    export let missedStimulus;

    export let gamepadConnected;
    
</script>

<div class="results">
    <h2>Test Finished</h2>
    {#if isPerformanceDropped}
        <p class="blink">Performance has dropped below 30 FPS at some point during the test.</p>
    {/if}
    {#if hasBeenOutOfFocus}
        <p class="blink">The window has been out of focus during the test.</p>
    {/if}
    <p>ID: {userID}</p>
    <p>Number of trials: {trialCount}</p>
    <p>Min Reaction Time: {Math.round(metrics.min)} ms</p>
    <p>Max Reaction Time: {Math.round(metrics.max)} ms</p>
    <p>Mean Reaction Time: {Math.round(metrics.mean)} ms</p>
    <p>Median Reaction Time: {Math.round(metrics.median)} ms</p>
    <p>10th Percentile: {Math.round(metrics.p10)} ms</p>
    <p>25th Percentile: {Math.round(metrics.p25)} ms</p>
    <p>50th Percentile: {Math.round(metrics.p50)} ms</p>
    <p>75th Percentile: {Math.round(metrics.p75)} ms</p>
    <p>90th Percentile: {Math.round(metrics.p90)} ms</p>
    <p>CRT Index: {metrics.crtIndex.toFixed(2)}</p>
    <p>Clicked without stimulus: {clickedOnRed}</p>
    <p>Exceeded audio threshold duration: {exceedCount}</p>
    <p>Crossed audio threshold count: {halfedCrossCount}</p>
    <p>Missed stimulus count (>2 sec): {missedStimulus}</p>
    <p>Function generator type: {generatorType}</p>
    <p>Function generator frequency: {frequency}</p>
    <p>Used headphones: {usingHeadphones}</p>
    <p>Gamepad connected: {gamepadConnected}</p>
    <button on:click={copyToClipboard}>Copy Results to 📋</button>
    <button on:click={copyToClipboardForSpreadSheet}>Copy Results to 📋 for Spreadsheet</button>
    <canvas id="histogramChart" width="400" height="200" />
    <canvas id="reactionTimeChart" width="400" height="200" />
    <button on:click={resetTest}>Start New Test</button>
</div>

<style>
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

    @keyframes blink {
        50% { opacity: 0; }
    }

    .blink {
        color: red;
        animation: blink 1s step-start 0s infinite;
    }
</style>