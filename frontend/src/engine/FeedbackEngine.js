class FeedbackEngine {
    constructor() {
        this.lastMessage = "";
        this.lastSpokenAt = 0;

        this.cooldown = 1800;
    }

    speak(message) {
        if (!message || !("speechSynthesis" in window)) {
            return;
        }

        const now = Date.now();

        if (
            message === this.lastMessage &&
            now - this.lastSpokenAt < this.cooldown
        ) {
            return;
        }

        this.lastMessage = message;

        this.lastSpokenAt = now;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }

    reset() {
        this.lastMessage = "";
        this.lastSpokenAt = 0;

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }
}

export default FeedbackEngine;
