const themeToggle = document.getElementById("themeToggle");
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

// ========== INITIALIZATION ==========
// Load saved chat and theme on page load
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

// ========== GREETING & MESSAGING ==========
// Get time-based greeting message
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

// Send user message and get bot response
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

// Add user message to chat box
function addUserMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "user");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
}

// Add bot message to chat box
function addBotMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "bot");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
}

// ========== SCHEDULE MANAGEMENT ==========
// Get schedule list from localStorage
function getSchedule() {
    const saved = localStorage.getItem("chat_schedule");
    return saved ? JSON.parse(saved) : [];
}

// Save schedule list to localStorage
function saveSchedule(list) {
    localStorage.setItem("chat_schedule", JSON.stringify(list));
}

// ========== BOT RESPONSE ENGINE ==========
// Track if game is currently active
let gameActive = false; 
function getBotResponse(input) {
    input = input.toLowerCase().trim();

    // 1. SCHEDULE CREATION HELP
    if (input.includes("how do i make my own schedule") || 
        input.includes("how to create schedule") || 
        input.includes("i wanna make my own schedule") || 
        input.includes("i wanna create my own schedule") || 
        input.includes("how to make schedule") || 
        input.includes("i want to create my schedule")) { 

        return "You can manage your schedule with these commands:\n• Type \"create schedule [task/schedule]\" to add a task/schedule \n• Type \"my schedule\" to view your tasks/schedule\n• Type \"clear schedule\" to reset your tasks/schedule";
    }
    // 2. VIEW SCHEDULE
    if (input.includes("my own schedule") || input.includes("my schedule")) {
        const list = getSchedule();
        if (list.length === 0) {
            return "Your schedule is empty! Type 'create/add schedule [task/schedule]' to put something on the list📅.";
        }
        let response = "Here is your tasks/schedule📅: \n";
        list.forEach((item, index) => {
            response += `${index + 1}. ${item}\n`;
        });
        return response + "\n•You can Type \"clear schedule\" to reset\n•You can Type \"create/add schedule [task/schedule]\" to create a task/schedule";
    }

    // 3. ADD TO SCHEDULE
    if (input.includes("create schedule") || 
        input.includes("add schedule") || 
        input.includes("add this schedule")) {
        const task = input.replace("create schedule", "").replace("add schedule", "").replace("add this schedule", "").trim();
        if (task.length < 2) return "Please specify a tasks/schedule to add.";
        const list = getSchedule();
        list.push(task);
        saveSchedule(list);
        return `✅ Added to schedule: "${task}"`;
    }

    // ===== ROCK PAPER SCISSORS GAME =====
    if (input.includes("play") || input === "game") {
        gameActive = true;
        return "Let's play a quick round! Choose: rock, paper, or scissors 🪨📄✂️";
    }
    
    if (input === "rock" || input === "paper" || input === "scissors" || input === "scissor") {
        if (input === "scissor") {
            input = "scissors";
        }
        // only run if the user actually asked to play first
        if (!gameActive) {
            return "We aren't playing right now. Say \"play\" \"game\" to start a round!";
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

        gameActive = false; // Game ends after one round
        return `You chose ${emoji[input]} | I chose ${emoji[botChoice]} → ${result}\nGame over! What else can I do for you?`;
    }

    // ===== GENERAL RESPONSES ======
    if (input.includes("how are you")) {
        return "I'm normally good and ready to assist!";
    }

    if (input.includes("what can you do") || 
        input.includes("assist me") || 
        input.includes("help me")) {
        return "I can help you stay organized! Try:\n• Managing a schedule\n• Playing Rock Paper Scissors\n• Telling you the time/date\n• Giving you motivation!";
    }

    if (input.includes("quote for me") || 
        input.includes("motivate me") || 
        input.includes("give me motivation") || 
        input.includes("give me a quote") || 
        input.includes("i need motivation") || 
        input.includes("i need inspiration")) {
        const quotes = [
            "Believe you can and you're halfway there.",
            "Your limitation—it’s only your imagination.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Dream it. Wish it. Do it.",
            "Success doesn’t just find you. You have to go out and get it.",
            "The harder you work for something, the greater you’ll feel when you achieve it.",
            "Don’t stop when you’re tired. Stop when you’re done.",
            "Wake up with determination. Go to bed with satisfaction.",
            "Do something today that your future self will thank you for.",
            "Little things make big days.",
            "It’s going to be hard, but hard does not mean impossible.",
            "Don’t wait for opportunity. Create it.",
            "Sometimes we’re tested not to show our weaknesses, but to discover our strengths.",
            "The key to success is to focus on goals, not obstacles."      
        ];
        return "✨ " + quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (input.includes("you know me")) {
        return "No, I'm just a simple AI CHATBOT but you can ask me anything and I'll do my best to assist you!";
    }

    if (input.includes("your name")) {
        return "I am AI CHATBOT your virtual assistant.";
    }

    if (input.startsWith("hello") || 
        input.startsWith("hi") || 
        input.startsWith("hey")) {
        return "Hello! I'm AI CHATBOT";
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

    if (input.includes("thanks") || input.includes("thank you")) {
        return "You're welcome! If you have any more questions or need assistance, feel free to ask.";
    }

    if (input.includes("bye")) {
        return "Goodbye! Have a great day!";
    }

    // Default fallback
    return "Sorry I don't understand. Try asking something else.";
}

// ========== UTILITY FUNCTIONS ==========
// Save chat history to localStorage
function saveChat() {
    localStorage.setItem("aichathistoryyy", chatBox.innerHTML);
}

// Auto-scroll chat to bottom
function scrollToBottom() {
    chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;

}

// ========== EVENT LISTENERS ==========
// Send message on button click
sendBtn.addEventListener("click", sendMessage);

// Send message on Enter key
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Toggle between light and dark theme
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