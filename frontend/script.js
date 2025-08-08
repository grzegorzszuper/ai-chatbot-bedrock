const API_URL = "https://r7l91vquc8.execute-api.eu-west-3.amazonaws.com/prod/chat";

async function sendMessage() {
  const msgInput = document.getElementById('message');
  const chatBody = document.getElementById('chatBody');
  const userMsg = msgInput.value.trim();
  if (!userMsg) return;

  // Dodaj wiadomość użytkownika
  const userBubble = document.createElement('div');
  userBubble.classList.add('message', 'user');
  userBubble.textContent = userMsg;
  chatBody.appendChild(userBubble);
  chatBody.scrollTop = chatBody.scrollHeight;
  msgInput.value = '';

  // Dodaj loading
  const loading = document.createElement('div');
  loading.classList.add('message', 'bot');
  loading.textContent = 'Czekam na odpowiedź...';
  chatBody.appendChild(loading);
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    loading.remove();
    const botBubble = document.createElement('div');
    botBubble.classList.add('message', 'bot');
    botBubble.textContent = data.response || 'Brak odpowiedzi';
    chatBody.appendChild(botBubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    loading.remove();
    alert('Błąd komunikacji z serwerem');
    console.error(err);
  }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('message').addEventListener('keyup', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});