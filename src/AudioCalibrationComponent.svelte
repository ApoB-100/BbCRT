<script>
    export let playCalibrationTone;
    export let shouldPlay;
    export let continueTest;
</script>

<div class="audio-calibration">
    <h2>Audio Calibration</h2>
    Click the "Start Calibration" button and make sure you can clearly hear
    the tone.
    <br /><br />
    <button
        on:click={playCalibrationTone}
        class:click-me={!shouldPlay}
        class:wait-for-it={shouldPlay}
    >
        {shouldPlay ? "Stop Calibration" : "Start Calibration"}
    </button><br />
    <button on:click={continueTest}> Continue to the test </button>
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

    .click-me {
		background-color: #5af014;
	}
</style>