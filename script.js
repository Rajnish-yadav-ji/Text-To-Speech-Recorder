document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('text');
  const speakButton = document.getElementById('speak');
  const recordButton = document.getElementById('record');
  const stopButton = document.getElementById('stop');
  const recordings = document.getElementById('recordings');
  const voiceSelect = document.getElementById('voices');

  let ttsUtterance = new SpeechSynthesisUtterance();
  let chunks = [];
  let mediaRecorder;

  function populateVoiceList() {
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voice.default) {
        option.textContent += ' -- DEFAULT';
      }
      option.setAttribute('data-lang', voice.lang);
      option.setAttribute('data-name', voice.name);
      option.value = index;
      voiceSelect.appendChild(option);
    });
  }

  populateVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }

  voiceSelect.addEventListener('change', () => {
    const selectedVoiceIndex = voiceSelect.value;
    const voices = speechSynthesis.getVoices();
    ttsUtterance.voice = voices[selectedVoiceIndex];
  });

  async function initRecorder() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

      if (audioInputDevices.length === 0) {
        throw new Error('No audio input devices found');
      }

      const constraints = {
        audio: {
          deviceId: { exact: audioInputDevices[0].deviceId }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorder = new MediaRecorder(stream);

      recordButton.onclick = () => {
        mediaRecorder.start();
        console.log("recorder started");
        recordButton.classList.remove('btn-success');
        recordButton.classList.add('btn-danger');
        stopButton.disabled = false;
        recordButton.disabled = true;

        window.speechSynthesis.speak(ttsUtterance);
      };

      stopButton.onclick = () => {
        mediaRecorder.stop();
        console.log("recorder stopped");
        recordButton.classList.remove('btn-danger');
        recordButton.classList.add('btn-success');
        stopButton.disabled = true;
        recordButton.disabled = false;

        window.speechSynthesis.cancel();
      };

      mediaRecorder.onstop = (e) => {
        console.log("data available after MediaRecorder.stop() called.");

        const clipName = prompt("Enter a name for your sound clip") || "Unnamed clip";

        const clipContainer = document.createElement("article");
        const clipLabel = document.createElement("p");
        const audio = document.createElement("audio");
        const deleteButton = document.createElement("button");
        const downloadButton = document.createElement("button");

        clipContainer.classList.add("clip");
        audio.setAttribute("controls", "");
        deleteButton.textContent = "Delete❌";
        deleteButton.classList.add("btn", "btn-danger", "delete", "mt-2");
        downloadButton.textContent = "Download⬇️";
        downloadButton.classList.add("btn", "btn-primary", "download", "mt-2", "ml-2");
        clipLabel.textContent = clipName;

        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(deleteButton);
        clipContainer.appendChild(downloadButton);
        recordings.appendChild(clipContainer);

        audio.controls = true;
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        chunks = [];
        const audioURL = URL.createObjectURL(blob);
        audio.src = audioURL;
        console.log("recorder stopped");

        downloadButton.onclick = () => {
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = audioURL;
          a.download = `${clipName}.ogg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };

        deleteButton.onclick = (e) => {
          const evtTgt = e.target;
          evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        };
      };

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
    } catch (err) {
      console.error(`The following error occurred: ${err}`);
    }
  }

  initRecorder();

  speakButton.onclick = () => {
    const text = textInput.value;
    if (text !== '') {
      ttsUtterance.text = text;
      const selectedVoiceIndex = voiceSelect.value;
      const voices = speechSynthesis.getVoices();
      ttsUtterance.voice = voices[selectedVoiceIndex];
      window.speechSynthesis.speak(ttsUtterance);
    }
  };
});
