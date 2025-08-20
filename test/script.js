const API_URL = "https://lksr0bjie6.execute-api.eu-west-3.amazonaws.com/prod/chat";

function addMessage(content, isUser = false) {
  const chatBody = document.getElementById("chatBody");
  const messageDiv = document.createElement("div");
  // było: "user-message" / "bot-message"
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;
  messageDiv.textContent = content;          // zachowamy bezpieczeństwo (bez HTML)
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}


async function sendMessage() {
  const messageInput = document.getElementById("message");
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  addMessage(message, true);
  messageInput.value = "";
  
  addMessage("Czekam na odpowiedź...", false);
  
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    
    // Usuń "Czekam na odpowiedź..."
    const chatBody = document.getElementById("chatBody");
    chatBody.removeChild(chatBody.lastChild);
    
    if (data.response) {
      addMessage(data.response, false);
    } else {
      addMessage("Błąd: " + JSON.stringify(data), false);
    }

  } catch (err) {
    const chatBody = document.getElementById("chatBody");
    chatBody.removeChild(chatBody.lastChild);
    addMessage("Błąd połączenia: " + err.message, false);
  }
}

// Event listeners
document.getElementById("sendBtn").addEventListener("click", sendMessage);

document.getElementById("message").addEventListener("keypress", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// --- Theme toggle ---
(function initTheme(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;

  function apply(t){
    const root = document.documentElement;
    if(t === 'dark'){ root.setAttribute('data-theme','dark'); }
    else { root.removeAttribute('data-theme'); }
    localStorage.setItem('theme', t);
    btn.textContent = t === 'dark' ? '☀️ Tryb jasny' : '🌙 Tryb ciemny';
    btn.setAttribute('aria-pressed', t === 'dark');
  }

  const saved = localStorage.getItem('theme')
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  apply(saved);

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    apply(isDark ? 'light' : 'dark');
  });
})();
