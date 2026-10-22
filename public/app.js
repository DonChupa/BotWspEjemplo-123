
const messages = document.getElementById("messages");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const quickActions = document.querySelector(".quick-actions");


const booking = {
  step: "idle",
  clientId: null,
  procedureId: null,
  professionalId: null,
  fecha: null,
  hora: null,
  procedures: [],
  professionals: [],
  clients: [],
  horarios: []
};


// Agrega un mensaje al chat.
function addMessage(text, type) {
  const message = document.createElement("div");
  message.classList.add("message", type);

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  });

  message.appendChild(paragraph);
  message.appendChild(time);
  messages.appendChild(message);

  // Desplaza el chat hacia el mensaje más reciente.
  messages.scrollTop = messages.scrollHeight;
}

async function iniciarReserva() {
  try {
    addMessage("Primero, seleccionemos el cliente para la reserva...", "received");

    const response = await fetch("/api/clientes");

    if (!response.ok) {
      throw new Error("Error al consultar los clientes");
    }

    const clientes = await response.json();

    if (clientes.length === 0) {
      addMessage("No hay clientes registrados en Firebase.", "received");
      return;
    }

    booking.clients = clientes;
    booking.step = "client";

    addMessage("¿Para cuál cliente quieres agendar la cita?", "received");

    clientes.forEach((cliente, index) => {
      addMessage(
        `${index + 1}. ${cliente.nombre} ${cliente.apellido}`,
        "received"
      );
    });

    addMessage(
      "Escribe el número del cliente que deseas seleccionar.",
      "received"
    );
  } catch (error) {
    console.error(error);
    addMessage("No pude consultar los clientes. Inténtalo nuevamente.", "received");
  }
}

// Envía un mensaje escrito por el usuario.
function sendMessage(text) {
  const cleanText = text.trim();

  if (!cleanText) return;

  addMessage(cleanText, "sent");
  handleBotMessage(cleanText);
}

// Maneja el formulario de envío.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  sendMessage(input.value);
  input.value = "";
  input.focus();
});

async function handleBotMessage(text) {
  const message = text.toLowerCase();

  // Selección del cliente durante una reserva.
  if (booking.step === "client") {
    const numero = Number(message.trim());

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > booking.clients.length
    ) {
      addMessage(
        `Escribe un número entre 1 y ${booking.clients.length}.`,
        "received"
      );
      return;
    }

    const cliente = booking.clients[numero - 1];

    booking.clientId = cliente.id;
    booking.step = "procedure";

    addMessage(
      `Cliente seleccionado: ${cliente.nombre} ${cliente.apellido}.`,
      "received"
    );

     try {
      const response = await fetch("/api/procedimientos");

      if (!response.ok) {
        throw new Error("Error al consultar los procedimientos");
      }

      const procedimientos = await response.json();

      if (procedimientos.length === 0) {
        addMessage("No hay procedimientos disponibles.", "received");
        booking.step = "idle";
        return;
      }

      booking.procedures = procedimientos;

      addMessage("Selecciona el procedimiento escribiendo su número:", "received");

      procedimientos.forEach((procedimiento, index) => {
        addMessage(
          `${index + 1}. ${procedimiento.nombre}`,
          "received"
        );
      });
    } catch (error) {
      console.error(error);
      booking.step = "idle";
      addMessage("No pude consultar los procedimientos.", "received");
    }

    return;
  }
  
  // Selección del procedimiento durante una reserva.
  if (booking.step === "procedure") {
    const numero = Number(message.trim());

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > booking.procedures.length
    ) {
      addMessage(
        `Escribe un número entre 1 y ${booking.procedures.length}.`,
        "received"
      );
      return;
    }

    const procedimiento = booking.procedures[numero - 1];

    booking.procedureId = procedimiento.id;
    booking.step = "professional";

    addMessage(
      `Procedimiento seleccionado: ${procedimiento.nombre}.`,
      "received"
    );

    try {
      const response = await fetch("/api/profesionales");

      if (!response.ok) {
        throw new Error("Error al consultar los profesionales");
      }

      const profesionales = await response.json();

      if (profesionales.length === 0) {
        addMessage("No hay profesionales disponibles.", "received");
        booking.step = "idle";
        return;
      }

      booking.professionals = profesionales;

      addMessage(
        "Ahora elige al profesional escribiendo su número:",
        "received"
      );

      profesionales.forEach((profesional, index) => {
        addMessage(
          `${index + 1}. ${profesional.nombre} ${profesional.apellido}`,
          "received"
        );
      });
    } catch (error) {
      console.error(error);
      booking.step = "idle";
      addMessage("No pude consultar los profesionales.", "received");
    }

    return;
  }


  // Selección del profesional durante una reserva.
  if (booking.step === "professional") {
    const numero = Number(message.trim());

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > booking.professionals.length
    ) {
      addMessage(
        `Escribe un número entre 1 y ${booking.professionals.length}.`,
        "received"
      );
      return;
    }

    const profesional = booking.professionals[numero - 1];

    booking.professionalId = profesional.id;
    booking.step = "date";

    addMessage(
      `Profesional seleccionado: ${profesional.nombre} ${profesional.apellido}.`,
      "received"
    );

    addMessage(
      "¿Para qué fecha deseas la cita? Escribe la fecha en formato AAAA-MM-DD. Por ejemplo: 2026-11-05.",
      "received"
    );

    return;
  }

  // Selección de la fecha de la cita.
  if (booking.step === "date") {
    const fecha = message.trim();
    const formatoValido = /^\d{4}-\d{2}-\d{2}$/.test(fecha);

    if (!formatoValido) {
      addMessage(
        "Formato incorrecto. Escribe la fecha como AAAA-MM-DD, por ejemplo: 2026-11-05.",
        "received"
      );
      return;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const fechaIngresada = new Date(anio, mes - 1, dia);
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const fechaExiste =
      fechaIngresada.getFullYear() === anio &&
      fechaIngresada.getMonth() === mes - 1 &&
      fechaIngresada.getDate() === dia;

    if (!fechaExiste || fechaIngresada < hoy) {
      addMessage(
        "Esa fecha no es válida o ya pasó. Intenta con una fecha futura.",
        "received"
      );
      return;
    }

    booking.fecha = fecha;
    booking.step = "availability";

    addMessage(
      `Fecha seleccionada: ${fecha}. Consultaré los horarios disponibles.`,
      "received"
    );

    await handleBotMessage("__consultar_disponibilidad__");
    return;
  }

  // Consulta de horarios disponibles.
  if (
  booking.step === "availability" &&
  message === "__consultar_disponibilidad__"
) {
    try {
      const params = new URLSearchParams({
        fecha: booking.fecha,
        professionalId: booking.professionalId,
        procedureId: booking.procedureId
      });

      const response = await fetch(`/api/disponibilidad?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensaje || "No se pudo consultar la disponibilidad");
      }

      const disponibilidad = await response.json();
      const horarios = disponibilidad.horariosDisponibles;

      if (!horarios || horarios.length === 0) {
        addMessage(
          "No hay horarios disponibles para esa fecha. Escribe otra fecha en formato AAAA-MM-DD.",
          "received"
        );

        booking.step = "date";
        return;
      }

      booking.horarios = horarios;
      booking.step = "time";

      addMessage(
        `Estos son los horarios disponibles para el ${booking.fecha}:`,
        "received"
      );

      horarios.forEach((hora, index) => {
        addMessage(`${index + 1}. ${hora}`, "received");
      });

      addMessage(
        "Escribe el número del horario que prefieres.",
        "received"
      );
    } catch (error) {
      console.error(error);

      addMessage(
        error.message || "No pude consultar los horarios. Inténtalo nuevamente.",
        "received"
      );
    }

    return;
  }

    // Selección del horario.
  if (booking.step === "time") {
    const numero = Number(message.trim());

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > booking.horarios.length
    ) {
      addMessage(
        `Escribe un número entre 1 y ${booking.horarios.length}.`,
        "received"
      );
      return;
    }

    booking.hora = booking.horarios[numero - 1];
    booking.step = "confirmation";

    const cliente = booking.clients.find(
      (c) => c.id === booking.clientId
    );

    const procedimiento = booking.procedures.find(
      (p) => p.id === booking.procedureId
    );

    const profesional = booking.professionals.find(
      (p) => p.id === booking.professionalId
    );

    addMessage(
      `Resumen de tu cita:\n\n` +
      `Cliente: ${cliente.nombre} ${cliente.apellido}\n` +
      `Procedimiento: ${procedimiento.nombre}\n` +
      `Profesional: ${profesional.nombre} ${profesional.apellido}\n` +
      `Fecha: ${booking.fecha}\n` +
      `Hora: ${booking.hora}\n\n` +
      `Escribe "confirmar" para reservar o "cancelar" para descartar.`,
      "received"
    );

    return;
  }

   // Confirmación o cancelación de la reserva.
  if (booking.step === "confirmation") {
    if (message.trim() === "cancelar") {
      booking.step = "idle";
      booking.clientId = null;
      booking.procedureId = null;
      booking.professionalId = null;
      booking.fecha = null;
      booking.hora = null;

      addMessage("Reserva descartada. No se creó ninguna cita.", "received");
      return;
    }

    if (message.trim() !== "confirmar") {
      addMessage(
        'Escribe "confirmar" para continuar o "cancelar" para descartar.',
        "received"
      );
      return;
    }

    try {
      const response = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fecha: booking.fecha,
          hora: booking.hora,
          clientId: booking.clientId,
          professionalId: booking.professionalId,
          procedureId: booking.procedureId
        })
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.mensaje ||
          resultado.error ||
          "No se pudo crear la cita."
        );
      }

      addMessage(
        resultado.mensaje || "¡Cita creada correctamente en Firebase!",
        "received"
      );

      booking.step = "idle";
      booking.clientId = null;
      booking.procedureId = null;
      booking.professionalId = null;
      booking.fecha = null;
      booking.hora = null;
      booking.procedures = [];
      booking.professionals = [];
      booking.clients = [];
      booking.horarios = [];
    } catch (error) {
      console.error(error);

      addMessage(
        `No se pudo guardar la cita: ${error.message}. Puedes intentarlo nuevamente escribiendo "confirmar".`,
        "received"
      );
    }

    return;
  }
  // Saludos
  if (message.includes("hola") || message.includes("buenas")) {
    
    try {
      const response = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fecha: booking.fecha,
          hora: booking.hora,
          clientId: booking.clientId,
          professionalId: booking.professionalId,
          procedureId: booking.procedureId
        })
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensaje ||
          "No se pudo crear la cita."
        );
      }

      addMessage(
        resultado.mensaje || "¡Cita creada correctamente en Firebase!",
        "received"
      );

      // Limpiamos el estado de la reserva.
      booking.step = "idle";
      booking.clientId = null;
      booking.procedureId = null;
      booking.professionalId = null;
      booking.fecha = null;
      booking.hora = null;
      booking.procedures = [];
      booking.professionals = [];
      booking.clients = [];
      booking.horarios = [];
    } catch (error) {
      console.error(error);

      addMessage(
        `No se pudo guardar la cita: ${error.message}. Puedes intentarlo nuevamente escribiendo "confirmar".`,
        "received"
      );
    }

    return;
  }

  // Procedimientos
  if (
    message.includes("procedimiento") ||
    message.includes("servicio")
  ) {
    try {
      const response = await fetch("/api/procedimientos");

      if (!response.ok) {
        throw new Error("No se pudieron consultar los procedimientos");
      }

      const procedimientos = await response.json();

      if (!procedimientos.length) {
        addMessage("Por ahora no hay procedimientos disponibles.", "received");
        return;
      }

      const lista = procedimientos
        .map((p, index) => `${index + 1}. ${p.nombre}`)
        .join("\n");

      addMessage(`Estos son los procedimientos disponibles:\n${lista}`, "received");
    } catch (error) {
      console.error(error);
      addMessage("No pude consultar los procedimientos. Inténtalo nuevamente.", "received");
    }

    return;
  }

  // Agendar una cita
  if (message.includes("agendar") || message.includes("reservar")) {
    booking.step = "idle";
    booking.clientId = null;
    booking.procedureId = null;
    booking.professionalId = null;
    booking.fecha = null;
    booking.hora = null;
    booking.procedures = [];
    booking.professionals = [];
    booking.horarios = [];

    await iniciarReserva();
    return;
  }
  // Consultar citas
  if (message.includes("mis citas") || message.includes("revisar mis citas")) {
    addMessage(
      "Para consultar tus citas, primero necesitaremos identificarte. Esa función la conectaremos en el siguiente paso.",
      "received"
    );
    return;
  }

  // Respuesta por defecto
  addMessage(
    "Todavía estoy aprendiendo esa opción 😊. Puedes escribir «agendar cita», «mis citas» o «procedimientos».",
    "received"
  );
}

// Maneja los botones de opciones rápidas.
quickActions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-message]");

  if (!button) return;

  sendMessage(button.dataset.message);
});
