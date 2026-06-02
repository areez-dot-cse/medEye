const API_URL = "http://localhost:3000";

const result = document.getElementById("result");

document
  .getElementById("verifyPrescriptionBtn")
  .addEventListener("click", verifyPrescription);

document
  .getElementById("verifyStripBtn")
  .addEventListener("click", verifyStrip);

document
  .getElementById("orderMedicineBtn")
  .addEventListener("click", orderMedicine);

document
  .getElementById("startScannerBtn")
  .addEventListener("click", startScanner);

async function verifyPrescription() {
  const uid = document.getElementById("prescriptionUid").value;

  if (!uid) {
    return;
  }

  const response = await fetch(`${API_URL}/verify/prescription/${uid}`);

  const data = await response.json();

  if (!response.ok) {
    result.innerHTML = `
            <div class="alert alert-danger">

                INVALID PRESCRIPTION

            </div>
            `;

    return;
  }

  result.innerHTML = `
        <div class="alert alert-success">

            VALID PRESCRIPTION

        </div>

        <p>
            <strong>UID:</strong>
            ${data.prescription.prescription_uid}
        </p>

        <p>
            <strong>Doctor:</strong>
            ${data.prescription.name}
        </p>

        <p>
            <strong>Drug:</strong>
            ${data.prescription.drug_code}
        </p>

        <p>
            <strong>Strip Count:</strong>
            ${data.prescription.strip_count}
        </p>

        <p>
            <strong>Status:</strong>

${
  data.prescription.status === "active"
    ? `
    <span
        class="badge bg-success"
    >
        Active
    </span>
    `
    : `
    <span
        class="badge bg-secondary"
    >
        Used
    </span>
    `
}
        </p>
        `;
}

async function orderMedicine() {
  const prescriptionUid = document.getElementById("orderPrescriptionUid").value;

  if (!prescriptionUid) {
    return;
  }

  const response = await fetch(`${API_URL}/order`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      prescriptionUid,
    }),
  });

  const data = await response.json();

  const orderResult = document.getElementById("orderResult");

  if (!response.ok) {
    orderResult.innerHTML = `
            <div class="alert alert-danger">

                ${data.message}

            </div>
            `;

    return;
  }

  orderResult.innerHTML = `
        <div class="alert alert-success">

            Medicine Dispensed Successfully

        </div>

        <p>
            <strong>
                Prescription:
            </strong>

            ${data.prescriptionUid}
        </p>

        <p>
            <strong>
                Assigned Strip:
            </strong>

            ${data.stripUid}
        </p>

        <p>
            <strong>
                Drug:
            </strong>

            ${data.drugCode}
        </p>

        <p>
            <strong>
                Batch:
            </strong>

            ${data.batchUid}
        </p>

        <button
            class="btn btn-primary mt-2"
            onclick="verifyAssignedStrip('${data.stripUid}')"
        >
            Verify Assigned Strip
        </button>
        `;
}

async function verifyStrip() {
  const uid = document.getElementById("stripUid").value;

  if (!uid) {
    return;
  }

  const response = await fetch(`${API_URL}/verify/strip/${uid}`);

  const data = await response.json();

  if (!response.ok) {
    result.innerHTML = `
            <div class="alert alert-danger">

                COUNTERFEIT MEDICINE

            </div>
            `;

    return;
  }

  result.innerHTML = `
        <div class="alert alert-success">

            AUTHENTIC MEDICINE

        </div>

        <p>
            <strong>Strip UID:</strong>
            ${data.strip.strip_uid}
        </p>

        <p>
            <strong>Drug:</strong>
            ${data.strip.drug_code}
        </p>

        <p>
            <strong>Manufacturer:</strong>
            ${data.strip.company_name}
        </p>

        <p>
            <strong>Batch:</strong>
            ${data.strip.batch_uid}
        </p>

        <p>
            <strong>Status:</strong>

${
  data.strip.status === "available"
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
        </p>
        `;
}

async function startScanner() {
  const scanner = new Html5Qrcode("reader");

  await scanner.start(
    {
      facingMode: "environment",
    },
    {
      fps: 10,
      qrbox: 350,
    },
    async (decodedText) => {
      console.log("QR DETECTED");
      console.log(decodedText);
      await scanner.stop();

      handleScannedQr(decodedText);
    },
    (errorMessage) => {
      console.log(errorMessage);
    },
  );
}

function handleScannedQr(decodedText) {
  try {
    console.log("HANDLE QR");
    console.log(decodedText);
    const qrData = JSON.parse(decodedText);

    const uid = qrData.uid;

    if (uid.startsWith("RX-")) {
      document.getElementById("prescriptionUid").value = uid;

      verifyPrescription();

      return;
    }

    if (uid.startsWith("STR-")) {
      document.getElementById("stripUid").value = uid;

      verifyStrip();

      return;
    }

    alert("Unknown QR format");
  } catch (error) {
    console.error(error);

    alert("Invalid QR Code");
  }
}

async function verifyAssignedStrip(stripUid) {
  document.getElementById("stripUid").value = stripUid;
  await verifyStrip();
}
