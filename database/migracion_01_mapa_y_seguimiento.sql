-- =====================================================================
-- SOS Patitas — Migración 01 (se ejecuta DESPUÉS de schema.sql)
-- Grupo 159 — Guardia / Ortellado
-- =====================================================================
-- Agrega a la tabla `caso` lo que el esquema aprobado de la 2ª entrega
-- todavía no contemplaba y que el MVP necesita:
--
--   1) codigo_seguimiento: código que recibe quien publica para consultar
--      el estado de su caso sin crear cuenta (documentación: "consulta el
--      estado de su propio caso con el link recibido").
--   2) latitud / longitud (opcionales): ubicación exacta para mostrar el
--      caso en el mapa (criterio de éxito del MVP: "aparecer públicamente
--      con su ubicación"). Si no se informan, el caso se ubica por zona.
--
-- Es un cambio SOLO ADITIVO: no modifica ni elimina nada de lo aprobado.
-- Conviene comentarlo con el tutor y reflejarlo en el diagrama ER.
-- =====================================================================

-- Si ya hay casos cargados, a esos se les asigna un código al azar para poder
-- marcar la columna como obligatoria.
ALTER TABLE caso
  ADD COLUMN codigo_seguimiento VARCHAR(12) NULL AFTER id,
  ADD COLUMN latitud  DECIMAL(9,6) NULL AFTER zona_id,
  ADD COLUMN longitud DECIMAL(9,6) NULL AFTER latitud;

UPDATE caso
   SET codigo_seguimiento = CONCAT('PAT-', UPPER(SUBSTRING(MD5(CONCAT(id, RAND())), 1, 6)))
 WHERE codigo_seguimiento IS NULL;

ALTER TABLE caso
  MODIFY COLUMN codigo_seguimiento VARCHAR(12) NOT NULL,
  ADD UNIQUE KEY uq_caso_codigo_seguimiento (codigo_seguimiento);
