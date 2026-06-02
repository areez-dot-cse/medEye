const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");

const role = localStorage.getItem("role");

if (!token || role !== "manufacturer") {
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

async function loadProfile() {
  const response = await fetch(`${API_URL}/manufacturers/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const manufacturer = await response.json();

  document.getElementById("manufacturerProfile").innerHTML = `
        <p>
            <strong>UID:</strong>
            ${manufacturer.manufacturer_uid}
        </p>

        <p>
            <strong>Company:</strong>
            ${manufacturer.company_name}
        </p>

        <p>
            <strong>Email:</strong>
            ${manufacturer.email}
        </p>

        <p>

            <strong>Status:</strong>

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

        </p>
    `;
}

async function loadBatches() {
  const response = await fetch(`${API_URL}/manufacturers/batches`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const batches = await response.json();
  document.getElementById("totalBatches").innerText = batches.length;

  const totalStrips = batches.reduce(
    (sum, batch) => sum + batch.strip_count,
    0,
  );

  document.getElementById("totalStrips").innerText = totalStrips;

  document.getElementById("avgBatchSize").innerText = batches.length
    ? Math.round(totalStrips / batches.length)
    : 0;

  const table = document.getElementById("batchTable");

  table.innerHTML = "";

  batches.forEach((batch) => {
    table.innerHTML += `
                <tr
                    style="cursor:pointer"
                    onclick="toggleBatch('${batch.batch_uid}')"
                >

                    <td>
                        ${batch.batch_uid}
                    </td>

                    <td>
                        ${batch.drug_code}
                    </td>

                    <td>
                        ${batch.strip_count}
                    </td>

                    <td>
                        ${new Date(batch.expiry_date).toLocaleDateString()}
                    </td>

                </tr>

                <tr
                    id="details-${batch.batch_uid}"
                    style="display:none"
                >
                </tr>
                `;
  });
}

document
  .getElementById("batchForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/manufacturers/batches`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        drugCode: document.getElementById("drugCode").value,

        stripCount: Number(document.getElementById("stripCount").value),

        expiryDate: document.getElementById("expiryDate").value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage(data.message, "danger");
    }

    showMessage("Batch Created");

    document.getElementById("batchForm").reset();

    await loadBatches();
  });

async function toggleBatch(batchUid) {
  const detailsRow = document.getElementById(`details-${batchUid}`);

  if (detailsRow.style.display === "table-row") {
    detailsRow.style.display = "none";

    return;
  }

  const response = await fetch(`${API_URL}/manufacturers/batches/${batchUid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  const batch = data.batch;

  let stripsHtml = `
        <table class="table table-sm">

            <thead>
                <tr>
                    <th>Strip UID</th>
                    <th>Status</th>
                    <th>QR</th>
                </tr>
            </thead>

            <tbody>
        `;

  data.strips.forEach((strip) => {
    stripsHtml += `
                <tr>

                    <td>
                        ${strip.strip_uid}
                    </td>

                    <td>

    ${
      strip.status === "available"
        ? `
        <span
            class="badge bg-warning text-dark"
        >
            Available
        </span>
        `
        : `
        <span
            class="badge bg-info"
        >
            Dispensed
        </span>
        `
    }

</td>

                    <td>

                        <img
                            src="${strip.qr}"
                            width="100"
                        >

                    </td>

                </tr>
                `;
  });

  stripsHtml += `
            </tbody>
        </table>
        `;

  detailsRow.innerHTML = `
        <td colspan="4">

            <p>
                <strong>
                    Batch UID:
                </strong>

                ${batch.batch_uid}
            </p>

            <p>
                <strong>
                    Drug:
                </strong>

                ${batch.drug_code}
            </p>

            <p>
                <strong>
                    Strip Count:
                </strong>

                ${batch.strip_count}
            </p>

            <p>
                <strong>
                    Manufactured:
                </strong>

                ${new Date(batch.manufactured_at).toLocaleString()}
            </p>

            <p>
                <strong>
                    Expiry:
                </strong>

                ${new Date(batch.expiry_date).toLocaleDateString()}
            </p>

            <hr>

            <h5>
                Generated Strips
            </h5>

            ${stripsHtml}

        </td>
        `;

  detailsRow.style.display = "table-row";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");

  localStorage.removeItem("role");

  window.location = "/login";
});

loadProfile();
loadBatches();
