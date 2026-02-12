


const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

// load saved chat
window.onload = function () {
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
function getBotResponse(input) {
    input = input.toLowerCase();

    if (input.includes("hello") || input.includes("hi") || input.includes("hey")){
        return "Hello! I'm AI CHATBOT ";
    }

    if (input.includes("how are you")) {
        return "I'm normally good and ready to assist!";
    }

     if (input.includes("you know me")) {
        return "No, i'm just a simple CHATBOT but you can ask me what time/date it is!";
    }

    if (input.includes("your name")) {
        return "I am AI CHATBOT your virtual assistant.";
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

// Save chat
function saveChat() {
    localStorage.setItem("aichathistoryyy", chatBox.innerHTML);
}

// Scroll
function scrollToBottom() {
    chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;

}

// Events
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});




