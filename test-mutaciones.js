
const { initializeApp, cert } = require("firebase-admin/app");
const { getDataConnect } = require("firebase-admin/data-connect");

const serviceAccount = require("./serviceAccountKey.json");

const {
  createAppointment,
  cancelAppointment,
  listAppointments,
} = require("./src/dataconnect-admin-generated");

// Inicializar Firebase
initializeApp({
  credential: cert(serviceAccount),
  projectId: "prototipo-3bcdb",
});

// Conectar con Firebase Data Connect
const dc = getDataConnect({
  serviceId: "prototipo-3bcdb-service",
  location: "southamerica-west1",
  connector: "example",
});

async function main() {
  let idCita;

  try {
    // 1. Crear una cita de prueba
    console.log("\n========== CREAR CITA ==========");

    const nuevaCita = await createAppointment(dc, {
      fecha: "2026-10-25",
      hora: 10,
      estado: "PENDIENTE",
      clientId: "ed23783559e84a3d8f60adfdd71bcc10",
      professionalId: "080bf8c219514922aac95d0567978fec",
      procedureId: "8654315f08c84449a76e1c57be061fca",
    });

    idCita = nuevaCita.data.appointment_insert.id;

    console.log("Cita creada correctamente.");
    console.log("ID de la cita:", idCita);

    // 2. Consultar las citas registradas
    console.log("\n========== LISTAR CITAS ==========");

    const resultado = await listAppointments(dc);

    console.dir(resultado.data.appointments, {
      depth: null,
    });

    // 3. Cancelar la cita que acabamos de crear
    console.log("\n========== CANCELAR CITA ==========");

    const cancelacion = await cancelAppointment(dc, {
      id: idCita,
    });

    console.log("Resultado de cancelación:");
    console.dir(cancelacion.data, {
      depth: null,
    });

    // 4. Volver a consultar para verificar la cancelación
    console.log("\n========== VERIFICAR CANCELACIÓN ==========");

    const citasActualizadas = await listAppointments(dc);

    const citaCancelada = citasActualizadas.data.appointments.find(
      (cita) => cita.id === idCita
    );

    if (citaCancelada) {
      console.log("Estado final:", citaCancelada.estado);
      console.dir(citaCancelada, {
        depth: null,
      });
    } else {
      console.log(
        "No se encontró la cita en la consulta final."
      );
    }
  } catch (error) {
    console.error("\nOcurrió un error durante la prueba:");
    console.error(error);
    process.exitCode = 1;
  }
}

main();

