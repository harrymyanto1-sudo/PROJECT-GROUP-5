// ========== ai chatbot for group 5 ==========
// ========== dom elements ==========
const themeToggle = document.getElementById("themeToggle");
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeMessage = document.getElementById("welcomeMessage");
const micBtn = document.getElementById("micBtn");
const speakerBtn = document.getElementById("speakerBtn");

// ========== state variables ==========
let currentUserEmail = null;
let currentUserName = null;
let scheduleList = [];
let gameActive = false;
let isTextToSpeechEnabled = false;

// ========== initialization ==========
// load saved chat and theme on page load
window.onload = function () {
    // clear any leftover localstorage keys except account records
    clearOtherLocalStorage();

    // show auth page initially (will be hidden on skip or successful login)
    const authPage = document.getElementById("authPage");
    if (authPage) authPage.classList.remove("hidden");

    // initialize auth ui (accounts preserved)
    initAuth();
    chatBox.innerHTML = "";
    welcomeMessage.style.display = "none";
    // allow interaction without account by default
    disableChatInteraction(false);
};

// ========== authentication logic (backend simulation) ==========
function getAccounts() {
    const saved = localStorage.getItem("chat_accounts");
    return saved ? JSON.parse(saved) : [];
}

function saveAccounts(list) {
    localStorage.setItem("chat_accounts", JSON.stringify(list));
}

function findAccount(email) {
    if (!email) return null;
    const list = getAccounts();
    return list.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
}
// returns {ok: bool, message: string} for success or failure with reason
function createAccount(email, password, username) {
    if (!validateEmail(email)) return { ok: false, message: "Invalid email" };
    if (!password || password.length < 8) return { ok: false, message: "Password must be at least 8 characters" };
    if (!username || username.length < 10) return { ok: false, message: "Username must be at least 10 characters" };
    if (findAccount(email)) return { ok: false, message: "An account with that email already exists" };

    const list = getAccounts();
    list.push({ email: email.trim(), password: password, username: username.trim() });
    saveAccounts(list);
    return { ok: true };
}

function authenticate(email, password) {
    const acc = findAccount(email);
    if (!acc) return { ok: false, message: "No account found for that email" };
    if (acc.password !== password) return { ok: false, message: "Incorrect password or email." };
    return { ok: true };
}

// ========== data management (local storage) ==========
// load per-user persisted data (chat, schedule, theme) when available
function loadUserData(email) {
    try {
        const chatKey = `aichathistory_${email}`;
        const savedChat = localStorage.getItem(chatKey);
        if (savedChat) {
            chatBox.innerHTML = savedChat;
            welcomeMessage.style.display = "none";
        } else {
            // show greeting if no saved chat
            addBotMessage(getTimeGreeting());
        }

        const scheduleKey = `chat_schedule_${email}`;
        const savedSchedule = localStorage.getItem(scheduleKey);
        if (savedSchedule) {
            try {
                scheduleList = JSON.parse(savedSchedule);
            } catch (e) {
                scheduleList = [];
            }
        } else {
            scheduleList = [];
        }

        const themeKey = `theme_${email}`;
        const savedTheme = localStorage.getItem(themeKey);
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.textContent = "☀️";
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-mode');
            themeToggle.textContent = "🌙";
        }
    } catch (e) {
        console.warn('loadUserData failed', e);
    }
}

// remove all localstorage entries except chat account records and user data
function clearOtherLocalStorage() {
    try {
        const keep = ["chat_accounts", "last_auth_email"];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            // keep: accounts, last email, and all per-user data (chat, schedule, theme)
            if (keep.includes(key) || 
                key.startsWith("aichathistory_") || 
                key.startsWith("chat_schedule_") || 
                key.startsWith("theme_")) {
                continue;
            }
            localStorage.removeItem(key);
            // adjust index safely by restarting scan
            i = -1;
        }
    } catch (e) {
        // ignore security errors
        console.warn('clearOtherLocalStorage failed', e);
    }
}

function saveChat() {
    // persist chat only for signed-in user (per-user key)
    if (!currentUserEmail) return;
    try {
        localStorage.setItem(`aichathistory_${currentUserEmail}`, chatBox.innerHTML);
    } catch (e) {
        console.warn('saveChat failed', e);
    }
}

function saveSchedule(list) {
    scheduleList = Array.isArray(list) ? list.slice() : [];
    // persist per-user schedule only when signed in
    if (!currentUserEmail) return;
    try {
        localStorage.setItem(`chat_schedule_${currentUserEmail}`, JSON.stringify(scheduleList));
    } catch (e) {
        console.warn('saveSchedule failed', e);
    }
}

function getSchedule() {
    return scheduleList.slice();
}

// ========== greeting & messaging ==========
// get time-based greeting message
function getTimeGreeting() {
    const hour = new Date().getHours();
    const name = currentUserName ? ` ${currentUserName}` : "";

    if (hour < 12) {
        return `Good morning${name}! I am AI CHATBOT. How can I help you?`;
    } else if (hour < 18) {
        return `Good afternoon${name}! I am AI CHATBOT. How can I assist you?`;
    } else {
        return `Good evening${name}! I am AI CHATBOT. What can I do for you?`;
    }
}

// send user message and get bot response
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

// add user message to chat box
function addUserMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "user");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
}

// add bot message to chat box
function addBotMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "bot");
    div.textContent = text;

    chatBox.appendChild(div);
    saveChat();
    scrollToBottom();
    speakText(text);
}

// ========== bot response engine ==========
function getBotResponse(input) {
    input = input.toLowerCase().trim();

    // 1. schedule creation help
    if (input.includes("how do i make my own schedule") || 
        input.includes("how to create schedule") || 
        input.includes("i wanna make my own schedule") || 
        input.includes("i wanna create my own schedule") || 
        input.includes("how to make schedule") || 
        input.includes("i want to create my schedule")) { 

        return "You can manage your schedule with these commands:\n• Type \"create schedule [task/schedule]\" to add a task/schedule \n• Type \"my schedule\" to view your tasks/schedule\n• Type \"clear schedule\" to reset your tasks/schedule";
    }
    
    // 2. view schedule
    if (input.includes("my own schedule") || input.includes("my schedule")) {
        const list = getSchedule();
        if (list.length === 0) {
            return "Your schedule is empty! Type 'create/add schedule [task/schedule]' to put something on the list📅.";
        }
        let response = `Here is your tasks/schedule${currentUserName ? " " + currentUserName : ""}: \n`;
        list.forEach((item, index) => {
            response += `${index + 1}. ${item}\n`;
        });
        return response + "\n•You can Type \"clear schedule\" to reset\n•You can Type \"create/add schedule [task/schedule]\" to create a task/schedule";
    }

    // 3. add to schedule
    if (input.includes("create schedule") || 
        input.includes("add schedule") || 
        input.includes("add this schedule")) {
        const task = input.replace("create schedule", "").replace("add schedule", "").replace("add this schedule", "").trim();
        if (task.length < 2) return "Please specify a tasks/schedule to add.";
        const list = getSchedule();
        list.push(task);
        saveSchedule(list);
        return ` Added to schedule: "${task}"`;
    }

    // 4. clear schedule
    if (input.includes("clear schedule") || input.includes("reset schedule")) {
        saveSchedule([]); // clears both in-memory and localstorage schedule
        return " Your schedule has been cleared.";
    }

    // ===== rock paper scissors gameeee =====
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

        gameActive = false; // game ends after one round
        return `You chose ${emoji[input]} | I chose ${emoji[botChoice]} → ${result}\nGame over! What else can I do for you?`;
    }

    // ===== general responses ======
    if (input.includes("how are you")) {
        return "I'm normally good and ready to assist!";
    }

    if (input.includes("what can you do") || 
        input.includes("assist me") || 
        input.includes("help me") ||
        input === "help" ||
        input.includes("commands")) {
        return "I can help you with several things! You can Type:\n\n" +
               "• Type 'create schedule [task]' to manage a schedule\n" +
               "• Type 'play game' to play Rock Paper Scissors\n" +
               "• Type 'what time is it?' to check time/date\n" +
               "• Type 'give me a quote' for motivation\n" +
               "• Type 'tell me a joke' for a laugh\n" +
               "• Type 'calculate 5 + 10' for simple math\n";
        }
        

    if (input.includes("tell me a joke")) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "I told my wife she was drawing her eyebrows too high. She looked surprised.",
            "What do you call a fake noodle? An Impasta!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "Why don't skeletons fight each other? They don't have the guts."
        ];
        return "😂 " + jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (input.startsWith("calculate ") || input.startsWith("what is ")) {
        // WARNING: Using new Function() can be a security risk if not handled carefully.
        // This is a simplified example for a controlled environment.
        let expression = input.replace("calculate ", "").replace("what is ", "").replace("?", "").trim();
        try {
            const validChars = /^[0-9\.\+\-\*\/\(\) ]+$/;
            if (!validChars.test(expression) || expression === "") throw new Error("Invalid expression");
            const result = new Function('return ' + expression)();
            if (isNaN(result) || !isFinite(result)) throw new Error("Invalid calculation result");
            return `The answer is ${result}.`;
        } catch (e) {
            return "I can only do simple math. Please ask something like 'calculate 5 + 5'.";
        }
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
        if (currentUserName) {
            return `Yes, you are ${currentUserName}! How can I help you today?`;
        }
        return "No, you're in Anonymous mode Sign in or create an account to save your name and chat history!";
    }

    if (input.includes("your name")) {
        return "I am AI CHATBOT your virtual assistant.";
    }

    if (input.startsWith("hello") || 
        input.startsWith("hi") || 
        input.startsWith("hey")) {
        return `Hello ${currentUserName ? currentUserName + "! " : ""}I'm AI CHATBOT`;
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

    // default fallback
    return `Sorry I don't understand${currentUserName ? " " + currentUserName : ""}. Try asking something else.`;
}

// ========== auth ui setup ==========
function initAuth() {
    const authPage = document.getElementById("authPage");
    const authBar = document.getElementById("authBar");
    
    // auth page elements
    const authEmail = document.getElementById("authEmail");
    const authUsername = document.getElementById("authUsername");
    const authPassword = document.getElementById("authPassword");
    const authSignInBtn = document.getElementById("authSignInBtn");
    const authCreateBtn = document.getElementById("authCreateBtn");
    const authSkipBtn = document.getElementById("authSkipBtn");
    const authToggleLink = document.getElementById("authToggleLink");
    const authPageTitle = document.getElementById("authPageTitle");
    const authPageSubtitle = document.getElementById("authPageSubtitle");
    const showPasswordToggle = document.getElementById("showPasswordToggle");

    // restore saved email from localstorage
    if (authEmail) {
        const savedEmail = localStorage.getItem("last_auth_email");
        if (savedEmail) {
            authEmail.value = savedEmail;
        }
    }

    // header logout button
    const logoutBtn = document.getElementById("logoutBtn");
    const userStatus = document.getElementById("userStatus");

    if (!authPage) return;

    let isSignUpMode = false; // true = create account, false = sign in

    function setMode(signUp, clearInputs = true) {
        isSignUpMode = !!signUp;
        const authWarning = document.getElementById("authWarning");
        if (authWarning) authWarning.style.display = "none";
        // clears input  when switching between sign in and create account modes
        if (clearInputs) {
            if (authEmail) authEmail.value = "";
            if (authPassword) {
                authPassword.value = "";
                authPassword.type = "password";
            }
            if (authUsername) authUsername.value = "";
            if (showPasswordToggle) {
                const eyeOpen = showPasswordToggle.querySelector('.eye-icon-open');
                const eyeClosed = showPasswordToggle.querySelector('.eye-icon-closed');
                if(eyeOpen) eyeOpen.style.display = "block";
                if(eyeClosed) eyeClosed.style.display = "none";
            }
        }

        if (isSignUpMode) {
            authPageTitle.textContent = "Create Account";
            authPageSubtitle.textContent = "Sign up to save your chat and to remember your name";
            authSignInBtn.style.display = "none";
            authCreateBtn.style.display = "flex";
            authToggleLink.textContent = "Already have an account? Sign in";
            if (authUsername) authUsername.style.display = "block";
        } else {
            authPageTitle.textContent = "Welcome To AI CHATBOT\n(Group 5)";
            authPageSubtitle.textContent = "Sign in to your account";
            authSignInBtn.style.display = "flex";
            authCreateBtn.style.display = "none";
            authToggleLink.textContent = "Don't have an account? Create one";
            if (authUsername) authUsername.style.display = "none";
        }
    }

    // toggle between sign-in and sign-up
    if (authToggleLink) {
        authToggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            setMode(!isSignUpMode);
        });
    }

    // skip to anonymous chat
    if (authSkipBtn) {
        authSkipBtn.addEventListener("click", () => {
            currentUserEmail = null;
            currentUserName = null;
            if (authPage) authPage.classList.add("hidden");
            if (authBar) authBar.style.display = "none";
            const headerSignInBtn = document.getElementById("headerSignInBtn");
            if (headerSignInBtn) headerSignInBtn.style.display = "inline-block";
        });
    }

    // sign in or create account from auth page
    function handleAuthSubmit() {
        const email = (authEmail ? authEmail.value : "").trim();
        const pwd = (authPassword ? authPassword.value : "").trim();
        const username = (authUsername ? authUsername.value : "").trim();

        if (!validateEmail(email)) {
            const authWarning = document.getElementById("authWarning");
            if (authWarning) {
                authWarning.textContent = " Please enter a valid email address (example@email.com)";
                authWarning.style.display = "block";
            }
            return;
        }

        if (isSignUpMode) {
            // create account
            const res = createAccount(email, pwd, username);
            if (!res.ok) {
                const authWarning = document.getElementById("authWarning");
                if (authWarning) {
                    authWarning.textContent = " " + res.message;
                    authWarning.style.display = "block";
                }
                return;
            
            }
            currentUserEmail = email;
            currentUserName = username;
            if (authPage) authPage.classList.add("hidden");
            if (authBar) {
                authBar.style.display = "flex";
                userStatus.textContent = `Logged in as ${currentUserName}`;
            }
            const headerSignInBtn = document.getElementById("headerSignInBtn");
            if (headerSignInBtn) headerSignInBtn.style.display = "none";

            loadUserData(email);
            //saving email to local storage
            try { localStorage.setItem("last_auth_email", email); } catch (e) {}
            showSuccessNotification(`Account created and signed in as ${email}`);
            // clear inputs after successful sign-up
            if (authEmail) authEmail.value = "";
            if (authPassword) authPassword.value = "";
            if (authUsername) authUsername.value = "";
        } else {
            // sign in
            const acc = findAccount(email);
            if (acc) {
                const res = authenticate(email, pwd);
                if (!res.ok) {
                    const authWarning = document.getElementById("authWarning");
                    if (authWarning) {
                        authWarning.textContent = " " + res.message;
                        authWarning.style.display = "block";
                    }
                    return;
                }
                currentUserEmail = email;
                currentUserName = acc.username || null;
                if (authPage) authPage.classList.add("hidden");
                if (authBar) {
                    authBar.style.display = "flex";
                    userStatus.textContent = `Logged in as ${currentUserName || email}`;
                }
                const headerSignInBtn = document.getElementById("headerSignInBtn");
                if (headerSignInBtn) headerSignInBtn.style.display = "none";
                loadUserData(email);
                try { localStorage.setItem("last_auth_email", email); } catch (e) {}
                showSuccessNotification(`Signed in as ${email}`);

                // clear inputs
                if (authEmail) authEmail.value = "";
                if (authPassword) authPassword.value = "";
                if (authUsername) authUsername.value = "";
            } else {
                // no account: show warning (prevent anonymous sign-in)
                const authWarning = document.getElementById("authWarning");
                if (authWarning) {
                    authWarning.textContent = " No account found for that email";
                    authWarning.style.display = "block";
                }
                return;
            }
        }
    }

    if (authSignInBtn) {
        authSignInBtn.addEventListener("click", handleAuthSubmit);
    }

    if (authCreateBtn) {
        authCreateBtn.addEventListener("click", handleAuthSubmit);
    }

    // toggle password visibility
    if (showPasswordToggle && authPassword) {
        showPasswordToggle.addEventListener("click", (e) => {
            e.preventDefault();
            const isPassword = authPassword.type === "password";
            authPassword.type = isPassword ? "text" : "password";
            
            const eyeOpen = showPasswordToggle.querySelector('.eye-icon-open');
            const eyeClosed = showPasswordToggle.querySelector('.eye-icon-closed');
            
            if (isPassword) {
                if(eyeOpen) eyeOpen.style.display = "none";
                if(eyeClosed) eyeClosed.style.display = "block";
            } else {
                if(eyeOpen) eyeOpen.style.display = "block";
                if(eyeClosed) eyeClosed.style.display = "none";
            }
        });
    }

    // enter key to submit
    [authEmail, authPassword, authUsername].forEach(el => {
        if (!el) return;
        el.addEventListener("keypress", function (e) {
            if (e.key === "Enter") handleAuthSubmit();
        });
    });

    // clear warning when user starts typing in email field + save email to localstorage
    if (authEmail) {
        authEmail.addEventListener("input", () => {
            const authWarning = document.getElementById("authWarning");
            if (authWarning) authWarning.style.display = "none";
            // save email to localstorage
            if (authEmail.value.trim()) {
                localStorage.setItem("last_auth_email", authEmail.value.trim());
            }
        });
    }

    // header logout button
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            currentUserEmail = null;
            currentUserName = null;
            if (authPage) authPage.classList.remove("hidden");
            if (authBar) authBar.style.display = "none";
            chatBox.innerHTML = "";
            showLogoutNotification("You have been logged out.");

         
    }); }

    // header sign-in button for anonymous users
    const headerSignInBtn = document.getElementById("headerSignInBtn");
    if (headerSignInBtn) {
        headerSignInBtn.addEventListener("click", () => {
            // restore saved email and clear password
            const savedEmail = localStorage.getItem("last_auth_email");
            authEmail.value = savedEmail || "";
            if (authPassword) {
                authPassword.value = "";
                authPassword.type = "password";
            }
            if (showPasswordToggle) {
                const eyeOpen = showPasswordToggle.querySelector('.eye-icon-open');
                const eyeClosed = showPasswordToggle.querySelector('.eye-icon-closed');
                if(eyeOpen) eyeOpen.style.display = "block";
                if(eyeClosed) eyeClosed.style.display = "none";
            }
            if (authUsername) authUsername.value = "";
            setMode(false, false); // default to sign-in mode
            if (authPage) authPage.classList.remove("hidden");
        });
    }

    // default to sign-in mode
    setMode(false, false);
}

// ========== dtility functions ==========
// auto-scroll chat to bottom
function scrollToBottom() {
    chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
}

// show success notification
function showSuccessNotification(message) {
    const existingLogoutNotification = document.querySelector('.logout-notification');
    if (existingLogoutNotification) {
        existingLogoutNotification.remove();
    }

    const notificationsuccess = document.createElement('div');
    notificationsuccess.className = 'success-notification';
    notificationsuccess.textContent = message;
    document.body.appendChild(notificationsuccess);
    
    // remove after 3 seconds
    setTimeout(() => {
        notificationsuccess.remove();
    }, 3000);
}
// show logged out notification
function showLogoutNotification(message) {
    const notificationloggedout = document.createElement('div');
    notificationloggedout.className = 'logout-notification';
    notificationloggedout.textContent = message;
    document.body.appendChild(notificationloggedout);
    
    // remove after 3 seconds
    setTimeout(() => {
        notificationloggedout.remove();
    }, 3000);
}

// validate email format
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// helper: is user signed in
function isSignedIn() {
    return !!currentUserEmail;
}

// disable or enable chat interaction (ui + input)
function disableChatInteraction(disabled) {
    const app = document.querySelector('.app');
    if (!app) return;
    if (disabled) {
        app.classList.add('locked');
        if (userInput) userInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (micBtn) micBtn.disabled = true;
        if (speakerBtn) speakerBtn.disabled = true;
    } else {
        app.classList.remove('locked');
        if (userInput) userInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (micBtn) micBtn.disabled = false;
        if (speakerBtn) speakerBtn.disabled = false;
    }
}

// ========== event listeners ==========
// send message on button click
sendBtn.addEventListener("click", sendMessage);

// send message on enter key
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// ========== voice to text ==========
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
        if (micBtn.classList.contains("listening")) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    recognition.onstart = () => {
        micBtn.classList.add("listening");
        userInput.placeholder = "Listening...";
    };

    recognition.onend = () => {
        micBtn.classList.remove("listening");
        userInput.placeholder = "Send a message...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        userInput.focus();
    };
} else if (micBtn) {
    micBtn.style.display = "none"; // Hide if not supported
    console.log("Web Speech API not supported in this browser.");
}

// ========== text to speech ==========
// toggle text to speech
if (speakerBtn) {
    speakerBtn.addEventListener("click", () => {
        isTextToSpeechEnabled = !isTextToSpeechEnabled;
        
        const iconOn = document.getElementById("speakerIconOn");
        const iconOff = document.getElementById("speakerIconOff");
        
        if (isTextToSpeechEnabled) {
            if(iconOn) iconOn.style.display = "block";
            if(iconOff) iconOff.style.display = "none";
        } else {
            if(iconOn) iconOn.style.display = "none";
            if(iconOff) iconOff.style.display = "block";
            window.speechSynthesis.cancel();
        }
    });
}

function speakText(text) {
    if ('speechSynthesis' in window && isTextToSpeechEnabled) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// toggle between light and dark theme
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    // play the animation
    themeToggle.classList.add("rotate-animation");
    
    // remove the class after animation finishes (500ms) 
    // so it can be played again on next click
    setTimeout(() => {
        themeToggle.classList.remove("rotate-animation");
    }, 500);

    if (document.body.classList.contains("light-mode")) {
        themeToggle.textContent = "☀️";
        if (currentUserEmail) localStorage.setItem(`theme_${currentUserEmail}`, 'light');
    } else {
        themeToggle.textContent = "🌙";
        if (currentUserEmail) localStorage.setItem(`theme_${currentUserEmail}`, 'dark');
    }
});


