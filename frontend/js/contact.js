function sendMessage(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !subject || !message) {
        showToast("Please fill all fields.");
        return;
    }

    const contact = {
        name,
        email,
        subject,
        message,
        date: new Date().toLocaleString()
    };

    let messages = JSON.parse(localStorage.getItem("messages")) || [];
    messages.push(contact);

    localStorage.setItem("messages", JSON.stringify(messages));

  showToast("Thank you! Your message has been sent.");

    event.target.reset();
}