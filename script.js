

const themeToggle = document.getElementById("themeToggle");
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

// load saved chat
window.onload = function () {
    const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
}

    const savedChat = localStorage.getItem("aichathistoryyy");

    if (savedChat) {
        chatBox.innerHTML = savedChat;
        welcomeMessage.style.display = "none";
    } else {
        addBotMessage(getTimeGreeting());
    }
};

// time based greeting 
function getTimeGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning! I am AI CHATBOT. How can I help you?";
    } else if (hour < 18) {
        return "Good afternoon! I am AI CHATBOT. How can I assist you?";
    } else {
        return "Good evening! I am AI CHATBOT. What can I do for you?";
    }
}

// send message
function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    welcomeMessage.style.display = "none";

    addUserMessage(message);
    const response = getBotResponse(message);

    setTimeout(() => {
        addBotMessage(response);
    }, 500);

    userInput.value = "";
}

// add user message
function addUserMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "user");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
}

// add bot message
function addBotMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "bot");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
}

//this is our rule based responses
let gameActive = false; // track if game is active

function getBotResponse(input) {
    input = input.toLowerCase().trim();

    // 1. Logic to START the game
   // --- ROCK PAPER SCISSORS GAME ---
    if (input.includes("play") || input === "game") {
        gameActive = true;
        return "Let's play a quick round! Choose: rock, paper, or scissors 🪨📄✂️";
    }
    if (input === "rock" || input === "paper" || input === "scissors") {
        // Only run if the user actually asked to play first
        if (!gameActive) {
            return "We aren't playing right now. Say 'play/game' to start a round!";
        }

        const choices = ["rock", "paper", "scissors"];
        const botChoice = choices[Math.floor(Math.random() * 3)];

        const emoji = {
            rock: "🪨",
            paper: "📄",
            scissors: "✂️"
        };

        let result = "";
        if (input === botChoice) {
            result = "It's a draw!";
        } else if (
            (input === "rock" && botChoice === "scissors") ||
            (input === "paper" && botChoice === "rock") ||
            (input === "scissors" && botChoice === "paper")
        ) {
            result = "You win! 🎉";
        } else {
            result = "I win! 😎";
        }

        // --- KEY CHANGE HERE ---
        gameActive = false; // This automatically turns the game off after one result
        
        return `You chose ${emoji[input]} | I chose ${emoji[botChoice]} → ${result}\nGame over! What else can I do for you?`;
    }

    // 4. NORMAL RESPONSES (These work regardless of game state)
    if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
        return "Hello! I'm AI CHATBOT";
    }

    if (input.includes("how are you")) {
        return "I'm normally good and ready to assist!";
        
    }

    if (input.includes("you know me")) {
        return "No, I'm just a simple AI CHATBOT but you can ask me what time/date is it right now!";
    }

    if (input.includes("your name")) {
        return "I am AI CHATBOT your virtual assistant.";
    }

      if (input.includes("date and time")) {
    return "Current date is " + new Date().toLocaleDateString() + " and time is " + new Date().toLocaleTimeString();
    }
      if (input.includes("time and date")) {
        return "Current time is " + new Date().toLocaleTimeString() + " and date is " + new Date().toLocaleDateString();
    }

    if (input.includes("time")) {
        return "Current time is " + new Date().toLocaleTimeString();
    }

    if (input.includes("date")) {
        return "Today's date is " + new Date().toLocaleDateString();
    }

    if (input.includes("bye")) {
        return "Goodbye! Have a great day!";
    }

    return "Sorry I don't understand that. Try asking something else.";
}


// savechat
function saveChat() {
    localStorage.setItem("aichathistoryyy", chatBox.innerHTML);
}

// scroll
function scrollToBottom() {
    chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;

}

// events
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});


// night theme
// Updated night theme logic
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    // Play the animation
    themeToggle.classList.add("rotate-animation");
    
    // Remove the class after animation finishes (500ms) 
    // so it can be played again on next click
    setTimeout(() => {
        themeToggle.classList.remove("rotate-animation");
    }, 500);

    if (document.body.classList.contains("light-mode")) {
        themeToggle.textContent = "☀️";
        localStorage.setItem("theme", "light");
    } else {
        themeToggle.textContent = "🌙";
        localStorage.setItem("theme", "dark");
    }
});