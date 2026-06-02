const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");

const role = localStorage.getItem("role");

if (!token || role !== "authority") {
  window.location = "/login";
}

const message = document.getElementById("message");

function showMessage(text, type = "success") {
  message.innerHTML = `
        <div class="alert alert-${type}">
            ${text}
        </div>
        `;
}

function updateAuthorityStats() {
  const doctors = window.doctorsData || [];

  const manufacturers = window.manufacturersData || [];

  const revokedDoctors = doctors.filter((d) => d.status === "revoked").length;

  const revokedManufacturers = manufacturers.filter(
    (m) => m.status === "revoked",
  ).length;

  document.getElementById("revokedAccounts").innerText =
    revokedDoctors + revokedManufacturers;
}

async function loadDoctors() {
  const response = await fetch(`${API_URL}/authority/doctors`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const doctors = await response.json();
  window.doctorsData = doctors;

  document.getElementById("totalDoctors").innerText = doctors.length;

  updateAuthorityStats();

  const table = document.getElementById("doctorTable");

  table.innerHTML = "";

  doctors.forEach((doctor) => {
    table.innerHTML += `
                <tr>

                    <td>
                        ${doctor.doctor_uid}
                    </td>

                    <td>
                        ${doctor.name}
                    </td>

                    <td>
                        ${doctor.email}
                    </td>

                    <td>
                        ${
                          doctor.status === "active"
                            ? `
        <span class="badge bg-success">
            Active
        </span>
        `
                            : `
        <span class="badge bg-danger">
            Revoked
        </span>
        `
                        }
                    </td>

                    <td>

                        ${
                          doctor.status === "active"
                            ? `
                            <button
                                class="btn btn-danger btn-sm"
                                onclick="revokeDoctor('${doctor.doctor_uid}')"
                            >
                                Revoke
                            </button>
                            `
                            : ""
                        }

                    </td>

                </tr>
                `;
  });
}

async function loadManufacturers() {
  const response = await fetch(`${API_URL}/authority/manufacturers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const manufacturers = await response.json();
  window.manufacturersData = manufacturers;

  document.getElementById("totalManufacturers").innerText =
    manufacturers.length;

  updateAuthorityStats();

  const table = document.getElementById("manufacturerTable");

  table.innerHTML = "";

  manufacturers.forEach((manufacturer) => {
    table.innerHTML += `
                <tr>

                    <td>
                        ${manufacturer.manufacturer_uid}
                    </td>

                    <td>
                        ${manufacturer.company_name}
                    </td>

                    <td>
                        ${manufacturer.email}
                    </td>

                    <td>
                        ${
                          manufacturer.status === "active"
                            ? `
        <span class="badge bg-success">
            Active
        </span>
        `
                            : `
        <span class="badge bg-danger">
            Revoked
        </span>
        `
                        }
                    </td>

                    <td>

                        ${
                          manufacturer.status === "active"
                            ? `
                            <button
                                class="btn btn-danger btn-sm"
                                onclick="revokeManufacturer('${manufacturer.manufacturer_uid}')"
                            >
                                Revoke
                            </button>
                            `
                            : ""
                        }

                    </td>

                </tr>
                `;
  });
}

document
  .getElementById("doctorForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/authority/doctors`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name: document.getElementById("doctorName").value,

        licenseNumber: document.getElementById("doctorLicense").value,

        email: document.getElementById("doctorEmail").value,

        password: document.getElementById("doctorPassword").value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage(data.message, "danger");
    }

    showMessage("Doctor created successfully");

    document.getElementById("doctorForm").reset();

    await loadDoctors();
  });

document
  .getElementById("manufacturerForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/authority/manufacturers`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        companyName: document.getElementById("manufacturerName").value,

        licenseNumber: document.getElementById("manufacturerLicense").value,

        email: document.getElementById("manufacturerEmail").value,

        password: document.getElementById("manufacturerPassword").value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage(data.message, "danger");
    }

    showMessage("Manufacturer created successfully");

    document.getElementById("manufacturerForm").reset();

    await loadManufacturers();
  });

async function revokeDoctor(uid) {
  const response = await fetch(`${API_URL}/authority/doctors/${uid}/revoke`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    showMessage("Doctor revoked");

    await loadDoctors();
  }
}

async function revokeManufacturer(uid) {
  const response = await fetch(
    `${API_URL}/authority/manufacturers/${uid}/revoke`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.ok) {
    showMessage("Manufacturer revoked");

    await loadManufacturers();
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");

  localStorage.removeItem("role");

  window.location = "/login";
});

loadDoctors();
loadManufacturers();
