/**
 * Datos de ejemplo para el modo de prueba (USE_MOCK = true).
 * Todo es ficticio. Las contraseñas están en texto plano SOLO porque esto
 * nunca llega a un servidor: el backend real guarda `password_hash`.
 */

/** Imagen de ejemplo (patita sobre fondo de color) para no depender de archivos externos. */
export function fotoEjemplo(tono, etiqueta = "Foto de ejemplo") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" role="img" aria-label="${etiqueta}">
<rect width="640" height="400" fill="hsl(${tono} 28% 82%)"/>
<g fill="hsl(${tono} 30% 38%)"><ellipse cx="320" cy="248" rx="70" ry="56"/>
<ellipse cx="230" cy="168" rx="26" ry="36"/><ellipse cx="290" cy="128" rx="26" ry="38"/>
<ellipse cx="350" cy="128" rx="26" ry="38"/><ellipse cx="410" cy="168" rx="26" ry="36"/></g>
<text x="320" y="360" text-anchor="middle" font-family="sans-serif" font-size="22" fill="hsl(${tono} 30% 30%)">${etiqueta}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const horas = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const ZONAS = [
  [1, "Palermo", -34.5875, -58.43], [2, "Caballito", -34.6186, -58.444], [3, "Flores", -34.628, -58.463],
  [4, "Boedo", -34.63, -58.415], [5, "Almagro", -34.61, -58.42], [6, "Villa Crespo", -34.599, -58.44],
  [7, "Belgrano", -34.562, -58.456], [8, "Barracas", -34.643, -58.376], [9, "La Boca", -34.6345, -58.363],
  [10, "Mataderos", -34.658, -58.502], [11, "Villa Lugano", -34.677, -58.469], [12, "Recoleta", -34.588, -58.393],
  [13, "Villa Urquiza", -34.573, -58.489], [14, "Liniers", -34.642, -58.52],
];

export function crearSemilla() {
  const zonas = ZONAS.map(([id, nombre]) => ({ id, nombre }));
  const centro = Object.fromEntries(ZONAS.map(([id, , lat, lng]) => [id, [lat, lng]]));
  const cerca = (zona, i) => [centro[zona][0] + ((i * 37) % 11 - 5) * 0.0011, centro[zona][1] + ((i * 53) % 11 - 5) * 0.0011];

  const caso = (id, d) => {
    const [lat, lng] = cerca(d.zona_id, id);
    const fotos = (d.tonos ?? []).map((t, i) => ({ id: id * 10 + i, url: fotoEjemplo(t), orden: i + 1 }));
    return {
      id, codigo_seguimiento: `PAT-${String(7000 + id * 13)}`,
      tipo_animal: d.tipo_animal, descripcion: d.descripcion,
      nivel_urgencia: d.nivel_urgencia, tipo_ayuda: d.tipo_ayuda, estado: d.estado,
      contacto_publicante: d.contacto, zona_id: d.zona_id,
      latitud: d.sinCoord ? null : lat, longitud: d.sinCoord ? null : lng,
      moderador_id: ["pendiente"].includes(d.estado) ? null : 1,
      motivo_rechazo: d.motivo ?? null,
      fecha_publicacion: horas(d.h), fecha_moderacion: d.estado === "pendiente" ? null : horas(Math.max(d.h - 2, 0.5)),
      fotos, historial: d.estado === "pendiente" ? [] : [{
        id: id * 100, usuario_id: 1, usuario: "Marcela (moderadora)",
        accion: d.estado === "resuelto" ? "aprobado" : d.estado, motivo: d.motivo ?? null, fecha: horas(Math.max(d.h - 2, 0.5)),
      }],
      donacion: d.donacion ? { ...d.donacion, actualizado_por: 1, fecha_actualizacion: horas(d.h - 3) } : null,
    };
  };

  const casos = [
    caso(1, { tipo_animal: "Perro/a", estado: "aprobado", nivel_urgencia: "critica", tipo_ayuda: "veterinaria", zona_id: 2, h: 5, tonos: [24, 24], contacto: "11 5555-0141",
      descripcion: "Perro mediano, pelaje marrón, atropellado en Av. Rivadavia y Medrano. Arrastra las patas traseras pero está consciente. Lo cuidamos entre vecinos en la vereda hasta que llegue ayuda. Necesita radiografías urgentes.",
      donacion: { monto_objetivo: 85000, monto_recaudado: 32000, alias_donacion: "patitas.caballito" } }),
    caso(2, { tipo_animal: "Perro/a", estado: "aprobado", nivel_urgencia: "critica", tipo_ayuda: "traslado", zona_id: 8, h: 9, tonos: [10], contacto: "@vecinosbarracas",
      descripcion: "Perra con una herida abierta en la pata delantera, cerca de la estación Hipólito Yrigoyen. Está tranquila pero no se deja acercar. Alguien con auto que pueda llevarla a una veterinaria 24hs este fin de semana." }),
    caso(3, { tipo_animal: "Gata embarazada o con cría/s", estado: "aprobado", nivel_urgencia: "media", tipo_ayuda: "alimento", zona_id: 3, h: 30, tonos: [200, 210, 190], contacto: "gatosflores@correo.test",
      descripcion: "Gata con cuatro gatitos de unas tres semanas en un patio abandonado de Flores. Necesitan alimento balanceado húmedo y leche maternizada. Ya hay una persona de tránsito, falta cubrir la comida del mes.",
      donacion: { monto_objetivo: 24000, monto_recaudado: 24000, alias_donacion: "gatitos.flores" } }),
    caso(4, { tipo_animal: "Cachorros", estado: "aprobado", nivel_urgencia: "media", tipo_ayuda: "otro", zona_id: 10, h: 52, tonos: [48], contacto: "11 4444-0178",
      descripcion: "Cinco cachorros dejados en una caja frente a la plaza de Mataderos. Buscamos hogares de tránsito por dos semanas hasta que puedan ser vacunados y dados en adopción." }),
    caso(5, { tipo_animal: "Perro/a", estado: "aprobado", nivel_urgencia: "baja", tipo_ayuda: "alimento", zona_id: 11, h: 80, tonos: [150], contacto: "11 3333-0192", sinCoord: true,
      descripcion: "Perra mayor, muy flaca, que vive en la puerta de una escuela. Los vecinos le dan agua pero necesita comida regular y una revisión veterinaria de rutina." }),
    caso(6, { tipo_animal: "Gato/a", estado: "aprobado", nivel_urgencia: "media", tipo_ayuda: "veterinaria", zona_id: 4, h: 20, tonos: [280], contacto: "11 2222-0110",
      descripcion: "Gato adulto con un ojo cerrado e hinchado, aparece todos los días en una panadería de Boedo. Parece infección. Necesita consulta y medicación." }),
    caso(7, { tipo_animal: "Perro/a", estado: "pendiente", nivel_urgencia: "critica", tipo_ayuda: "veterinaria", zona_id: 1, h: 0.6, tonos: [330], contacto: "11 6666-0145",
      descripcion: "Perro joven con convulsiones en la plaza Serrano. Un vecino lo tiene en brazos. Pedimos ayuda urgente para una veterinaria de guardia." }),
    caso(8, { tipo_animal: "Gato/a", estado: "pendiente", nivel_urgencia: "baja", tipo_ayuda: "otro", zona_id: 6, h: 3, tonos: [90], contacto: "gatera.crespo@correo.test",
      descripcion: "Gato atrapado en un balcón de un edificio abandonado en Villa Crespo desde hace dos días. Está asustado pero se lo ve bien." }),
    caso(9, { tipo_animal: "Perro/a", estado: "pendiente", nivel_urgencia: "media", tipo_ayuda: "traslado", zona_id: 14, h: 7, tonos: [260], contacto: "11 7777-0133",
      descripcion: "Perra con cría recién nacida en una obra en Liniers. Queremos moverla a un lugar seguro antes de que lleguen las máquinas el lunes." }),
    caso(10, { tipo_animal: "Perro/a", estado: "en_revision", nivel_urgencia: "media", tipo_ayuda: "veterinaria", zona_id: 12, h: 14, tonos: [0], contacto: "11 8888-0160",
      descripcion: "Perro con cojera en Recoleta. Falta confirmar la ubicación exacta con quien publicó." }),
    caso(11, { tipo_animal: "Perro/a", estado: "rechazado", nivel_urgencia: "critica", tipo_ayuda: "otro", zona_id: 5, h: 40, contacto: "11 1111-0000",
      motivo: "No pudimos verificar el caso: el teléfono de contacto no responde y la dirección no existe.",
      descripcion: "Necesito plata urgente para un perro, transferir al alias que paso por privado." }),
    caso(12, { tipo_animal: "Gato/a", estado: "resuelto", nivel_urgencia: "media", tipo_ayuda: "veterinaria", zona_id: 7, h: 160, tonos: [170], contacto: "11 9999-0120",
      descripcion: "Gata con una pata fracturada en Belgrano. Fue operada y ya está en adopción responsable.",
      donacion: { monto_objetivo: 60000, monto_recaudado: 61500, alias_donacion: "gata.belgrano" } }),
  ];

  const directorio = [
    { id: 1, tipo: "veterinaria", nombre: "Veterinaria Guardia Rivadavia", telefono: "11 4903-2200", zona_id: 2, atencion_24hs: true, especialidad: "Urgencias y cirugía" },
    { id: 2, tipo: "veterinaria", nombre: "Hospital Veterinario del Sur", telefono: "11 4301-7788", zona_id: 8, atencion_24hs: true, especialidad: "Traumatología" },
    { id: 3, tipo: "veterinaria", nombre: "Clínica Veterinaria Palermo", telefono: "11 4772-1900", zona_id: 1, atencion_24hs: false, especialidad: "Clínica general" },
    { id: 4, tipo: "rescatista", nombre: "Marta R. (tránsito de gatos)", telefono: "11 5123-4567", zona_id: 3, atencion_24hs: false, especialidad: "Gatos y camadas" },
    { id: 5, tipo: "rescatista", nombre: "Colectivo Patas del Oeste", telefono: "11 5987-6543", zona_id: 10, atencion_24hs: false, especialidad: "Perros, traslados" },
    { id: 6, tipo: "veterinaria", nombre: "Veterinaria 24 Belgrano", telefono: "11 4783-0099", zona_id: 7, atencion_24hs: true, especialidad: null },
  ];

  const usuarios = [
    { id: 1, nombre: "Marcela Díaz", email: "moderador@sospatitas.test", password: "moderador123", rol: "moderador", activo: true },
    { id: 2, nombre: "Administración", email: "admin@sospatitas.test", password: "admin12345", rol: "administrador", activo: true },
  ];

  return { zonas, casos, directorio, usuarios };
}
