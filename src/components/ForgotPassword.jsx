const submit = async () => {
  try {
    console.log("Sending request...");

    const res = await fetch("https://fyp2-backend-gihc.onrender.com/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    console.log("Response status:", res.status);

    const data = await res.json();
    console.log("Response data:", data);

    if (!res.ok) {
      alert(data.msg || "Error");
      return;
    }

    alert("Email sent ✅");

  } catch (err) {
    console.error(err);
    alert("Cannot connect to server ❌");
  }
};