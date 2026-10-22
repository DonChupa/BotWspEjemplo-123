
require("dotenv").config();

const express = require("express");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getDataConnect } = require("firebase-admin/data-connect");

const {
  listClients,
  listProfessionals,
  listProcedures,
  listOffers,
  listAppointments,
  createAppointment,
  cancelAppointment,
} = require("./src/dataconnect-admin-generated");

const app = express();
app.use(express.static("public"));
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// 1. INICIALIZAR FIREBASE
// ========================================

if (getApps().length === 0) {
  const serviceAccount = require("./serviceAccountKey.json");

  initializeApp({
    credential: cert(serviceAccount),
    projectId: "prototipo-3bcdb",
  });
}

// ========================================
// 2. CONECTAR CON DATA CONNECT
// ========================================

const dc = getDataConnect({
  serviceId: "prototipo-3bcdb-service",
  location: "southamerica-west1",
  connector: "example",
});

// ========================================
// 3. FUNCIONES AUXILIARES
// ========================================

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [year, month, day] = fecha.split("-").map(Number);
  const fechaUTC = new Date(Date.UTC(year, month - 1, day));

  return (
    fechaUTC.getUTCFullYear() === year &&
    fechaUTC.getUTCMonth() === month - 1 &&
    fechaUTC.getUTCDate() === day
  );
}

function obtenerFechaChile() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function obtenerMinutosChile() {
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date())
    .split(":")
    .map(Number);

  return hora[0] * 60 + hora[1];
}

function formatearHora(minutos) {
  const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
  const minuto = String(minutos % 60).padStart(2, "0");

  return `${hora}:${minuto}`;
}

function convertirHoraAMinutos(valor) {
  if (typeof valor !== "string" && typeof valor !== "number") {
    return NaN;
  }

  const texto = String(valor).trim();

  // Compatibilidad con citas antiguas: "10" equivale a "10:00".
  if (/^\d{1,2}$/.test(texto)) {
    const hora = Number(texto);

    if (hora < 0 || hora > 23) {
      return NaN;
    }

    return hora * 60;
  }

  // Nuevo formato: "10:00", "10:40", etc.
  if (!/^\d{2}:\d{2}$/.test(texto)) {
    return NaN;
  }

  const [hora, minuto] = texto.split(":").map(Number);

  if (hora > 23 || minuto > 59) {
    return NaN;
  }

  return hora * 60 + minuto;
}


// ========================================
// 4. RUTAS GENERALES
// ========================================

app.get("/", (req, res) => {
  res.send("¡El bot de WhatsApp está funcionando!");
});

app.get("/estado", (req, res) => {
  res.json({
    activo: true,
    proyecto: "bot-whatsapp-firebase",
    firebase: "configurado",
    mensaje: "Servidor iniciado correctamente",
  });
});

// ========================================
// 5. CONSULTAR CLIENTES
// ========================================

app.get("/api/clientes", async (req, res) => {
  try {
    const resultado = await listClients(dc);


    res.json(resultado.data.clients);
  } catch (error) {
    console.error("Error al consultar clientes:", error);
    res.status(500).json({
      error: "No se pudieron consultar los clientes.",
    });
  }
});

// ========================================
// 6. CONSULTAR PROFESIONALES
// ========================================

app.get("/api/profesionales", async (req, res) => {
  try {
    const resultado = await listProfessionals(dc);
    res.json(resultado.data.professionals);
  } catch (error) {
    console.error("Error al consultar profesionales:", error);
    res.status(500).json({
      error: "No se pudieron consultar los profesionales.",
    });
  }
});

// ========================================
// 7. CONSULTAR PROCEDIMIENTOS
// ========================================

app.get("/api/procedimientos", async (req, res) => {
  try {
    const resultado = await listProcedures(dc);
    res.json(resultado.data.procedures);
  } catch (error) {
    console.error("Error al consultar procedimientos:", error);
    res.status(500).json({
      error: "No se pudieron consultar los procedimientos.",
    });
  }
});

// ========================================
// 8. CONSULTAR OFERTAS
// ========================================

app.get("/api/ofertas", async (req, res) => {
  try {
    const resultado = await listOffers(dc);
    res.json(resultado.data.offers);
  } catch (error) {
    console.error("Error al consultar ofertas:", error);
    res.status(500).json({
      error: "No se pudieron consultar las ofertas.",
    });
  }
});

// ========================================
// 9. CONSULTAR CITAS
// ========================================

app.get("/api/citas", async (req, res) => {
  try {
    const resultado = await listAppointments(dc);

    const citas = resultado.data.appointments.map((cita) => ({
      ...cita,
      hora: /^\d{1,2}$/.test(String(cita.hora))
        ? `${String(cita.hora).padStart(2, "0")}:00`
        : cita.hora,
    }));

    res.json(citas);
  } catch (error) {
    console.error("Error al consultar citas:", error);
    res.status(500).json({
      error: "No se pudieron consultar las citas.",
    });
  }
});

// ========================================
// 10. CALCULAR DISPONIBILIDAD
// ========================================

app.get("/api/disponibilidad", async (req, res) => {
  try {
    const { fecha, professionalId, procedureId } = req.query;

    if (!fecha || !professionalId || !procedureId) {
      return res.status(400).json({
        error:
          "Debes indicar fecha, professionalId y procedureId.",
      });
    }

    if (!fechaValida(fecha)) {
      return res.status(400).json({
        error: "La fecha debe tener formato YYYY-MM-DD y ser válida.",
      });
    }

    const hoyChile = obtenerFechaChile();

    if (fecha < hoyChile) {
      return res.status(400).json({
        error: "No puedes consultar horarios de fechas pasadas.",
      });
    }

    const [procedimientosResult, profesionalesResult, citasResult] =
      await Promise.all([
        listProcedures(dc),
        listProfessionals(dc),
        listAppointments(dc),
      ]);

    const procedimiento =
      procedimientosResult.data.procedures.find(
        (p) => p.id === procedureId
      );

    if (!procedimiento) {
      return res.status(404).json({
        error: "El procedimiento no existe.",
      });
    }

    const profesional =
      profesionalesResult.data.professionals.find(
        (p) => p.id === professionalId
      );

    if (!profesional) {
      return res.status(404).json({
        error: "El profesional no existe.",
      });
    }

    const duracion = Number(procedimiento.duracion);
    const descanso = 10;
    const apertura = 10 * 60;
    const cierre = 19 * 60;

    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(500).json({
        error: "La duración del procedimiento no es válida.",
      });
    }

    const citasDelDia = citasResult.data.appointments
      .filter(
        (cita) =>
          cita.fecha === fecha &&
          cita.professional?.id === professionalId &&
          cita.estado !== "CANCELADA"
      )
      .map((cita) => {
        const inicio = convertirHoraAMinutos(cita.hora);

        const procedimientoExistente =
          procedimientosResult.data.procedures.find(
            (p) => p.id === cita.procedure?.id
          );

        const duracionExistente = Number(
          procedimientoExistente?.duracion
        );

        return {
          inicio,
          fin: inicio + duracionExistente,
        };
      })
      .filter(
        (cita) =>
          Number.isFinite(cita.inicio) &&
          Number.isFinite(cita.fin)
      );

    const horariosDisponibles = [];

    // Generar bloques consecutivos según:
    // duración del procedimiento + 10 minutos de descanso.
    for (
      let inicio = apertura;
      inicio + duracion <= cierre;
      inicio += duracion + descanso
    ) {
      const fin = inicio + duracion;

      // Evitar superposiciones y respetar el descanso
      // respecto de las citas existentes.
      const ocupado = citasDelDia.some(
        (cita) =>
          inicio < cita.fin + descanso &&
          fin + descanso > cita.inicio
      );

      if (!ocupado) {
        horariosDisponibles.push(formatearHora(inicio));
      }
    }

    // Si la fecha es hoy, eliminar horas que ya pasaron.
    if (fecha === hoyChile) {
      const minutosAhora = obtenerMinutosChile();

      for (
        let i = horariosDisponibles.length - 1;
        i >= 0;
        i--
      ) {
        const [hh, mm] = horariosDisponibles[i]
          .split(":")
          .map(Number);

        if (hh * 60 + mm <= minutosAhora) {
          horariosDisponibles.splice(i, 1);
        }
      }
    }

    res.json({
      fecha,
      profesional: {
        id: profesional.id,
        nombre: profesional.nombre,
        apellido: profesional.apellido,
      },
      procedimiento: {
        id: procedimiento.id,
        nombre: procedimiento.nombre,
        duracion: duracion,
      },
      descansoMinutos: descanso,
      apertura: "10:00",
      cierre: "19:00",
      horariosDisponibles,
    });
  } catch (error) {
    console.error("Error al calcular disponibilidad:", error);
    res.status(500).json({
      error: "No se pudo calcular la disponibilidad.",
    });
  }
});

// ========================================
// 11. CREAR UNA CITA
// ========================================


app.post("/api/citas", async (req, res) => {
  try {
    const {
      fecha,
      hora,
      clientId,
      professionalId,
      procedureId,
    } = req.body;

    if (
      !fecha ||
      typeof hora !== "string" ||
      !/^\d{2}:\d{2}$/.test(hora) ||
      !clientId ||
      !professionalId ||
      !procedureId
    ) {
      return res.status(400).json({
        error:
          'Faltan datos o son inválidos. La hora debe ser texto en formato "HH:mm".',
        camposRequeridos: [
          "fecha",
          "hora",
          "clientId",
          "professionalId",
          "procedureId",
        ],
      });
    }

    if (!fechaValida(fecha)) {
      return res.status(400).json({
        error: "La fecha debe tener formato YYYY-MM-DD y ser válida.",
      });
    }

    const minutosHora = convertirHoraAMinutos(hora);

    if (
      !Number.isFinite(minutosHora) ||
      minutosHora < 600 ||
      minutosHora >= 1140
    ) {
      return res.status(400).json({
        error: "La hora debe estar entre las 10:00 y antes de las 19:00.",
      });
    }

    const hoyChile = obtenerFechaChile();

    if (
      fecha < hoyChile ||
      (fecha === hoyChile && minutosHora <= obtenerMinutosChile())
    ) {
      return res.status(400).json({
        error: "No puedes agendar una cita en el pasado.",
      });
    }

    const disponibilidad = await obtenerDisponibilidadInterna({
      fecha,
      professionalId,
      procedureId,
    });

    if (!disponibilidad.horariosDisponibles.includes(hora)) {
      return res.status(409).json({
        error:
          "Ese horario no está disponible para el procedimiento seleccionado.",
        horariosDisponibles: disponibilidad.horariosDisponibles,
      });
    }

    const resultado = await createAppointment(dc, {
      fecha,
      hora,
      estado: "PENDIENTE",
      clientId,
      professionalId,
      procedureId,
    });

    res.status(201).json({
      mensaje: "Cita creada correctamente.",
      cita: resultado.data.appointment_insert,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    res.status(500).json({
      error: "No se pudo crear la cita.",
    });
  }
});

// ========================================
// 12. FUNCIÓN INTERNA DE DISPONIBILIDAD
// ========================================

async function obtenerDisponibilidadInterna({
  fecha,
  professionalId,
  procedureId,
}) {
  const [procedimientosResult, profesionalesResult, citasResult] =
    await Promise.all([
      listProcedures(dc),
      listProfessionals(dc),
      listAppointments(dc),
    ]);

  const procedimiento = procedimientosResult.data.procedures.find(
    (p) => p.id === procedureId
  );

  const profesional = profesionalesResult.data.professionals.find(
    (p) => p.id === professionalId
  );

  if (!procedimiento || !profesional) {
    throw new Error("El profesional o procedimiento no existe.");
  }

  const duracion = Number(procedimiento.duracion);
  const descanso = 10;
  const apertura = 600;
  const cierre = 1140;

  if (!Number.isFinite(duracion) || duracion <= 0) {
  throw new Error("La duración del procedimiento no es válida.");
}

  const citasDelDia = citasResult.data.appointments
    .filter(
      (cita) =>
        cita.fecha === fecha &&
        cita.professional?.id === professionalId &&
        cita.estado !== "CANCELADA"
    )
    .map((cita) => {
      const inicio = convertirHoraAMinutos(cita.hora);
      const proc = procedimientosResult.data.procedures.find(
        (p) => p.id === cita.procedure?.id
      );

      return {
        inicio,
        fin: inicio + Number(proc?.duracion),
      };
    })
    .filter(
      (cita) =>
        Number.isFinite(cita.inicio) &&
        Number.isFinite(cita.fin)
    );

  const horariosDisponibles = [];

  for (
    let inicio = apertura;
    inicio + duracion <= cierre;
    inicio += duracion + descanso
  ) {
    const fin = inicio + duracion;

    const ocupado = citasDelDia.some(
      (cita) =>
        inicio < cita.fin + descanso &&
        fin + descanso > cita.inicio
    );

    if (!ocupado) {
      horariosDisponibles.push(formatearHora(inicio));
    }
  }

  if (fecha === obtenerFechaChile()) {
    const minutosAhora = obtenerMinutosChile();

    for (let i = horariosDisponibles.length - 1; i >= 0; i--) {
      const [hh, mm] = horariosDisponibles[i]
        .split(":")
        .map(Number);

      if (hh * 60 + mm <= minutosAhora) {
        horariosDisponibles.splice(i, 1);
      }
    }
  }

  return {
    horariosDisponibles,
    duracion,
  };
}

// ========================================
// 13. CANCELAR UNA CITA
// ========================================

app.patch("/api/citas/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-f]{32}$/i.test(id)) {
      return res.status(400).json({
        error: "El ID de la cita no tiene un formato válido.",
      });
    }

    const resultado = await listAppointments(dc);

    const cita = resultado.data.appointments.find(
      (item) => item.id === id
    );

    if (!cita) {
      return res.status(404).json({
        error: "No se encontró la cita indicada.",
      });
    }

    if (cita.estado === "CANCELADA") {
      return res.status(409).json({
        error: "La cita ya está cancelada.",
      });
    }

    await cancelAppointment(dc, { id });

    res.json({
      mensaje: "Cita cancelada correctamente.",
      id,
      estado: "CANCELADA",
    });
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    res.status(500).json({
      error: "No se pudo cancelar la cita.",
    });
  }
});

// ========================================
// 14. RUTA NO ENCONTRADA
// ========================================

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada.",
  });
});

// ========================================
// 15. INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
