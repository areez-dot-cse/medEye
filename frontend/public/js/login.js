const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const role = document.getElementById("role").value;

  const username = document.getElementById("username").value;

  const password = document.getElementById("password").value;

  const message = document.getElementById("message");

  try {
    let endpoint = "";
    let body = {};

    if (role === "authority") {
      endpoint = "http://localhost:3000/auth/authority/login";
      body = {
        username,
        password,
      };
    }
    if (role === "doctor") {
      endpoint = "http://localhost:3000/auth/doctor/login";
      body = {
        email: username,
        password,
      };
    }
    if (role === "manufacturer") {
      endpoint = "http://localhost:3000/auth/manufacturer/login";
      body = {
        email: username,
        password,
      };
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      message.innerHTML = `<div class="alert alert-danger">
                        ${data.message}
                    </div>`;

      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);

    if (role === "authority") {
      window.location = "/authority";
    }
    if (role === "doctor") {
      window.location = "/doctor";
    }

    if (role === "manufacturer") {
      window.location = "/manufacturer";
    }
    //put a matchcase here
  } catch (error) {
    console.error(error);

    message.innerHTML = `<div class="alert alert-danger">
                    Login Failed
                </div>`;
  }
});
