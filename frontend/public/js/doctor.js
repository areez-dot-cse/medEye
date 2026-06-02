const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "doctor") {
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

async function togglePrescription(prescriptionUid) {
  const detailsRow = document.getElementById(
    `details-${prescriptionUid}`,
  );

  if (detailsRow.style.display === "table-row") {
    detailsRow.style.display = "none";
    return;
  }

  const response = await fetch(
    `${API_URL}/doctors/prescriptions/${prescriptionUid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  const p = data.prescription;

  detailsRow.innerHTML = `
        <td colspan="3">

            <p>
                <strong>Drug:</strong>
                ${p.drug_code}
            </p>

            <p>
                <strong>Strip Count:</strong>
                ${p.strip_count}
            </p>

            <p>

                <strong>Status:</strong>

                ${
                  p.status === "active"
                    ? `
                    <span class="badge bg-success">
                        Active
                    </span>
                    `
                    : `
                    <span class="badge bg-secondary">
                        Used
                    </span>
                    `
                }

            </p>

            <p>
                <strong>Issued At:</strong>
                ${new Date(
                  p.issued_at,
                ).toLocaleString()}
            </p>

            <hr>

            <img
                src="${data.qr}"
                width="200"
            >

            <hr>

            ${
              data.dispense
                ? `
                <h5>
                    Dispense Info
                </h5>

                <p>
                    <strong>Strip:</strong>
                    ${data.dispense.strip_uid}
                </p>

                <p>
                    <strong>Dispensed At:</strong>
                    ${new Date(
                      data.dispense.dispensed_at
                    ).toLocaleString()}
                </p>
                `
                : `
                <span
                    class="badge bg-warning text-dark"
                >
                    Not Dispensed Yet
                </span>
                `
            }

        </td>
    `;

  detailsRow.style.display = "table-row";
}

async function loadProfile() {
  const response = await fetch(
    `${API_URL}/doctors/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const doctor = await response.json();

  document.getElementById(
    "doctorProfile",
  ).innerHTML = `
        <p>
            <strong>UID:</strong>
            ${doctor.doctor_uid}
        </p>

        <p>
            <strong>Name:</strong>
            ${doctor.name}
        </p>

        <p>
            <strong>Email:</strong>
            ${doctor.email}
        </p>

        <p>

            <strong>Status:</strong>

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

        </p>
    `;
}

async function loadPrescriptions() {
  const response = await fetch(
    `${API_URL}/doctors/prescriptions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const prescriptions = await response.json();

  document.getElementById(
    "totalPrescriptions",
  ).innerText = prescriptions.length;

  document.getElementById(
    "activePrescriptions",
  ).innerText = prescriptions.filter(
    (p) => p.status === "active",
  ).length;

  document.getElementById(
    "usedPrescriptions",
  ).innerText = prescriptions.filter(
    (p) => p.status === "used",
  ).length;

  const table =
    document.getElementById(
      "prescriptionTable",
    );

  table.innerHTML = "";

  prescriptions.forEach(
    (prescription) => {
      table.innerHTML += `
                <tr
                    style="cursor:pointer"
                    onclick="togglePrescription('${prescription.prescription_uid}')"
                >

                    <td>
                        ${prescription.prescription_uid}
                    </td>

                    <td>

                        ${
                          prescription.status ===
                          "active"
                            ? `
                            <span class="badge bg-success">
                                Active
                            </span>
                            `
                            : `
                            <span class="badge bg-secondary">
                                Used
                            </span>
                            `
                        }

                    </td>

                    <td>

                        <img
                            src="${prescription.qr}"
                            width="80"
                        >

                    </td>

                </tr>

                <tr
                    id="details-${prescription.prescription_uid}"
                    style="display:none"
                >
                </tr>
            `;
    },
  );
}

document
  .getElementById(
    "prescriptionForm",
  )
  .addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const response = await fetch(
        `${API_URL}/doctors/prescriptions`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            drugCode:
              document.getElementById(
                "drugCode",
              ).value,

            stripCount: Number(
              document.getElementById(
                "stripCount",
              ).value,
            ),
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        return showMessage(
          data.message,
          "danger",
        );
      }

      showMessage(
        "Prescription Created",
      );

      document.getElementById(
        "prescriptionForm",
      ).reset();

      await loadPrescriptions();
    },
  );

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    () => {
      localStorage.removeItem(
        "token",
      );

      localStorage.removeItem(
        "role",
      );

      window.location = "/login";
    },
  );

loadProfile();
loadPrescriptions();