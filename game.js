const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const enclosure = document.getElementById('enclosure');
const startBtn = document.getElementById('start-btn');
const speechOutput = document.getElementById('speech-output');

let animals = ['Lion', 'Tiger', 'Elephant', 'Giraffe', 'Zebra', 'Monkey', 'Panda', 'Kangaroo', 'Koala', 'Penguin'];
let wordPills = [];

const pillWidth = 80;
const pillHeight = 30;

class WordPill {
  constructor(text) {
    this.text = text;
    this.width = pillWidth;
    this.height = pillHeight;
    this.x = Math.random() * (canvas.width - this.width);
    this.y = Math.random() * (canvas.height - this.height);
    this.vx = (Math.random() - 0.5) * 4; // Random velocity between -2 and 2
    this.vy = (Math.random() - 0.5) * 4;
  }

  draw() {
    ctx.fillStyle = 'lightblue';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;

    // Wall collision with position adjustment
    if (this.x <= 0) {
      this.x = 0;
      this.vx *= -1;
    } else if (this.x + this.width >= canvas.width) {
      this.x = canvas.width - this.width;
      this.vx *= -1;
    }
    if (this.y <= 0) {
      this.y = 0;
      this.vy *= -1;
    } else if (this.y + this.height >= canvas.height) {
      this.y = canvas.height - this.height;
      this.vy *= -1;
    }
  }

  checkCollision(otherPill) {
    if (this === otherPill) return false;

    return !(this.x > otherPill.x + otherPill.width ||
             this.x + this.width < otherPill.x ||
             this.y > otherPill.y + otherPill.height ||
             this.y + this.height < otherPill.y);
  }

  resolveCollision(otherPill) {
    // Swap velocities
    let tempVx = this.vx;
    let tempVy = this.vy;
    this.vx = otherPill.vx;
    this.vy = otherPill.vy;
    otherPill.vx = tempVx;
    otherPill.vy = tempVy;

    // Adjust positions to prevent overlap
    while (this.checkCollision(otherPill)) {
      this.x += this.vx;
      this.y += this.vy;
      otherPill.x += otherPill.vx;
      otherPill.y += otherPill.vy;
    }
  }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move and draw pills
  for (let i = 0; i < wordPills.length; i++) {
    let pill = wordPills[i];
    pill.move();

    // Check collision with other pills
    for (let j = i + 1; j < wordPills.length; j++) {
      let otherPill = wordPills[j];
      if (pill.checkCollision(otherPill)) {
        pill.resolveCollision(otherPill);
      }
    }

    pill.draw();
  }

  requestAnimationFrame(update);
}

// Initialize word pills
for (let animal of animals) {
  wordPills.push(new WordPill(animal));
}

// Start the animation
update();

// Voice recognition
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
  recognition = new SpeechRecognition();
} else {
  alert('Speech Recognition API not supported in this browser.');
}

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true; // Set to true for real-time feedback

  recognition.onresult = function(event) {
    let interim_transcript = '';
    let final_transcript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      let transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final_transcript += transcript;
      } else {
        interim_transcript += transcript;
      }
    }

    // Display interim results
    if (interim_transcript) {
      speechOutput.innerHTML = 'You said: ' + interim_transcript;
    }

    // Process final transcript
    if (final_transcript) {
      speechOutput.innerHTML = ''; // Clear interim results
      console.log('Recognized:', final_transcript);

      // Find and remove the pill with the recognized animal name
      let index = wordPills.findIndex(pill => pill.text.toLowerCase() === final_transcript.trim().toLowerCase());
      if (index !== -1) {
        let pill = wordPills.splice(index, 1)[0];

        // Add the pill to the enclosure
        let pillDiv = document.createElement('div');
        pillDiv.className = 'word-pill';
        pillDiv.textContent = pill.text;
        enclosure.appendChild(pillDiv);
      }
    }
  };

  recognition.onerror = function(event) {
    console.error('Speech recognition error', event);
  };

  startBtn.addEventListener('click', () => {
    recognition.start();
  });
}