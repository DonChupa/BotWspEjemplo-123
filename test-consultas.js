
const { initializeApp, cert } = require("firebase-admin/app");
const { getDataConnect } = require("firebase-admin/data-connect");

const serviceAccount = require("./serviceAccountKey.json");

const {
  listClients,
  listProfessionals,
  listProcedures,
  listOffers,
  listAppointments,
} = require("./src/dataconnect-admin-generated");

async function main() {
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

    const consultas = [
      ["Clientes", listClients],
      ["Profesionales", listProfessionals],
      ["Procedimientos", listProcedures],
      ["Ofertas", listOffers],
      ["Citas", listAppointments],
    ];

    for (const [nombre, consulta] of consultas) {
      const resultado = await consulta(dc);
      const clave = Object.keys(resultado.data)[0];
      const registros = resultado.data[clave];

      console.log(`\n${nombre}: ${registros.length}`);
      console.table(registros);
    }
  } catch (error) {
    console.error("Falló una consulta:", error.message);
    console.error("Código:", error.code);
    process.exitCode = 1;
  }
}

main();
