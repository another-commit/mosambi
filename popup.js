const PANTRY_URL =
  "https://getpantry.cloud/apiv1/pantry/97bb90ca-481a-48cd-aafc-e40f9c3073f5/basket/textbox";
const textBox = document.getElementById("textBox");
const sendBtn = document.getElementById("sendBtn");
const readBtn = document.getElementById("readBtn");

// Send text to Pantry
sendBtn.addEventListener("click", async () => {
  const text = textBox.value;
  if (!text) return alert("Please enter some text!");

  try {
    const res = await fetch(PANTRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (res.ok) alert("Text sent!");
    else alert("Failed to send text.");
  } catch (err) {
    alert("Error: " + err);
  }
});

// Read text from Pantry
readBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(PANTRY_URL);
    const data = await res.json();
    textBox.value = data.message || "";
  } catch (err) {
    alert("Error: " + err);
  }
});
