const API_URL = "https://s9ggkndj08.execute-api.eu-west-3.amazonaws.com/prod/chat";

function addMessage(content, isUser = false) {
  const chatBody = document.getElementById("chatBody");
  const messageDiv = document.createElement("div");
  messageDiv.className = isUser ? "user-message" : "bot-message";
  messageDiv.textContent = content;
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
    console.log("Sending to:", API_URL);
    console.log("Message:", message);
    
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    
    console.log("Response status:", res.status);

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
    console.error("Fetch error:", err);
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