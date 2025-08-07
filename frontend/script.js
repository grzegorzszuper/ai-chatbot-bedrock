const API_URL = "https://r7l91vquc8.execute-api.eu-west-3.amazonaws.com/prod/chat";

async function sendMessage() {
  const message = document.getElementById("message").value;
  const responseDiv = document.getElementById("response");
  responseDiv.innerText = "Czekam na odpowiedź...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",  // 👈 DODANE!
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    if (data.response) {
      responseDiv.innerText = data.response;
    } else {
      responseDiv.innerText = "Błąd: " + JSON.stringify(data);
    }

  } catch (err) {
    responseDiv.innerText = "Błąd połączenia: " + err.message;
  }
}
