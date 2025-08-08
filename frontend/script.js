const API_URL = "https://r7l91vquc8.execute-api.eu-west-3.amazonaws.com/prod/chat";

async function sendMessage() {
  const msgInput = document.getElementById('message');
  const chatBody = document.getElementById('chatBody');
  const userMsg = msgInput.value.trim();
  if (!userMsg) return;

  // Usuń placeholder, jeśli to pierwsza wiadomość
  msgInput.value = '';

  // Dodaj wiadomość użytkownika
  const userDiv = document.createElement('div');
  userDiv.classList.add('user-msg');
  userDiv.textContent = userMsg;
  chatBody.appendChild(userDiv);
  chatBody.scrollTop = chatBody.scrollHeight;

  // Dodaj loading
  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('bot-msg');
  loadingDiv.textContent = 'Czekam na odpowiedź...';
  chatBody.appendChild(loadingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const res = await fetch(API_URL, {
      method: 'POST', mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    loadingDiv.remove();
    const botDiv = document.createElement('div');
    botDiv.classList.add('bot-msg');
    botDiv.textContent = data.response || 'Brak odpowiedzi';
    chatBody.appendChild(botDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    loadingDiv.remove();
    const errDiv = document.createElement('div');
    errDiv.classList.add('bot-msg');
    errDiv.textContent = 'Błąd połączenia: ' + err.message;
    chatBody.appendChild(errDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('message').addEventListener('keypress', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});