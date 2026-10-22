
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

async function probarFirebase() {
  try {
    // Cargar las credenciales de la cuenta de servicio.
    const serviceAccount = require("./serviceAccountKey.json");

    // Conectar con el proyecto Firebase.
    initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore();

    console.log("Conexión con Firebase inicializada.");

    // 1. Guardar un documento de prueba.
    const referencia = db.collection("pruebasConexion").doc("prueba1");
console.log("Intentando escribir en:", referencia.path);
console.log("Proyecto:", serviceAccount.project_id);
console.log("Base de datos:", db.databaseId);
    await referencia.set({
        
      mensaje: "Hola desde Node.js",
      estado: "conectado",
      fecha: FieldValue.serverTimestamp(),
    });

    console.log("Escritura realizada correctamente.");

    // 2. Leer el documento guardado.
    const documento = await referencia.get();

    if (documento.exists) {
      console.log("Lectura realizada correctamente.");
      console.log("Datos encontrados:", documento.data());
    } else {
      console.log("No se encontró el documento.");
    }

  } catch (error) {
    console.error("Error al conectar con Firebase:", error.message);
    process.exitCode = 1;
  }
}

probarFirebase();
