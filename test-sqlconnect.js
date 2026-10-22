
const { initializeApp, cert } = require("firebase-admin/app");
const { getDataConnect } = require("firebase-admin/data-connect");
const serviceAccount = require("./serviceAccountKey.json");

const { listClients } = require("./src/dataconnect-admin-generated");

async function probarSQLConnect() {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: "prototipo-3bcdb",
    });

    const dc = getDataConnect({
      serviceId: "prototipo-3bcdb-service",
      location: "southamerica-west1",
      connector: "example",
    });

    console.log("Consultando clientes en Firebase SQL Connect...");

    const resultado = await listClients(dc);

    console.log("¡Consulta ejecutada correctamente!");
    console.log("Clientes encontrados:", resultado.data.clients.length);
    console.table(resultado.data.clients);
  } catch (error) {
    console.error("Error al consultar SQL Connect:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

probarSQLConnect();
