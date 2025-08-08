const API_URL = "https://r7l91vquc8.execute-api.eu-west-3.amazonaws.com/prod/chat";

async function sendMessage() {
  const message = document.getElementById("message").value.trim();
  const responseDiv = document.getElementById("response");
  if (!message) return;

  // wyróżnij wiadomość użytkownika
  responseDiv.innerHTML = `<div class=\"user-msg\">Ty: ${message}</div><div class=\"bot-msg\">Czekam na odpowiedź...</div>`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    const botText = data.response || "Brak odpowiedzi";
    responseDiv.innerHTML = `<div class=\"user-msg\">Ty: ${message}</div><div class=\"bot-msg\">Bot: ${botText}</div>`;

  } catch (err) {
    responseDiv.innerHTML = `<div class=\"user-msg\">Ty: ${message}</div><div class=\"bot-msg\">Błąd połączenia: ${err.message}</div>`;
  }
}