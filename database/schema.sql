-- =====================================================================
-- SOS Patitas — Esquema de Base de Datos (MySQL)
-- Segunda Entrega — Diseño y Módulos
-- Grupo 159 — Guardia / Ortellado
-- =====================================================================
-- Este script contiene el DDL correspondiente al Diagrama Entidad-Relación
-- presentado en /docs. Ubicar este archivo en /database del repositorio.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sos_patitas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sos_patitas;

-- ---------------------------------------------------------------------
-- ZONA — catálogo único de zonas/barrios (RNF04: permite sumar zonas
-- o ciudades sin rediseñar el modelo).
-- ---------------------------------------------------------------------
CREATE TABLE zona (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_zona_nombre (nombre)
);

-- ---------------------------------------------------------------------
-- USUARIO — moderadores y administradores (RF09, RNF02).
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  email          VARCHAR(160) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  rol            ENUM('moderador', 'administrador') NOT NULL DEFAULT 'moderador',
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_usuario_email (email)
);

-- ---------------------------------------------------------------------
-- CASO — publicación de un caso de animal en situación de calle
-- (RF01, RF02, RF03, RF04, RF05, RF08).
-- ---------------------------------------------------------------------
CREATE TABLE caso (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  tipo_animal          VARCHAR(60) NOT NULL,
  descripcion          TEXT NOT NULL,
  nivel_urgencia       ENUM('critica', 'media', 'baja') NOT NULL,
  tipo_ayuda           ENUM('veterinaria', 'traslado', 'alimento', 'otro') NOT NULL,
  estado               ENUM('pendiente', 'en_revision', 'aprobado', 'rechazado', 'resuelto')
                         NOT NULL DEFAULT 'pendiente',
  contacto_publicante  VARCHAR(160) NOT NULL,
  zona_id              INT NOT NULL,
  moderador_id         INT NULL,
  motivo_rechazo       VARCHAR(255) NULL,
  fecha_publicacion    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_moderacion     DATETIME NULL,
  CONSTRAINT fk_caso_zona      FOREIGN KEY (zona_id)      REFERENCES zona(id),
  CONSTRAINT fk_caso_moderador FOREIGN KEY (moderador_id) REFERENCES usuario(id),
  INDEX idx_caso_zona (zona_id),
  INDEX idx_caso_estado (estado),
  INDEX idx_caso_urgencia (nivel_urgencia)
);

-- ---------------------------------------------------------------------
-- CASO_FOTO — fotos de un caso (1:N). Evita el grupo repetitivo del
-- primer borrador (RF01 admite varias fotos por caso).
-- ---------------------------------------------------------------------
CREATE TABLE caso_foto (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  caso_id  INT NOT NULL,
  url      VARCHAR(500) NOT NULL,
  orden    INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_casofoto_caso FOREIGN KEY (caso_id) REFERENCES caso(id) ON DELETE CASCADE,
  INDEX idx_casofoto_caso (caso_id)
);

-- ---------------------------------------------------------------------
-- HISTORIAL_MODERACION — auditoría de cada acción de moderación sobre
-- un caso, con motivo y fecha (RF03).
-- ---------------------------------------------------------------------
CREATE TABLE historial_moderacion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  caso_id     INT NOT NULL,
  usuario_id  INT NOT NULL,
  accion      ENUM('aprobado', 'rechazado', 'en_revision') NOT NULL,
  motivo      VARCHAR(255) NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_caso    FOREIGN KEY (caso_id)    REFERENCES caso(id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  INDEX idx_historial_caso (caso_id)
);

-- ---------------------------------------------------------------------
-- DIRECTORIO_CONTACTO — veterinarias y rescatistas por zona (RF06).
-- ---------------------------------------------------------------------
CREATE TABLE directorio_contacto (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tipo           ENUM('veterinaria', 'rescatista') NOT NULL,
  nombre         VARCHAR(160) NOT NULL,
  telefono       VARCHAR(40) NOT NULL,
  zona_id        INT NOT NULL,
  atencion_24hs  BOOLEAN NOT NULL DEFAULT FALSE,
  especialidad   VARCHAR(120) NULL,
  CONSTRAINT fk_directorio_zona FOREIGN KEY (zona_id) REFERENCES zona(id),
  INDEX idx_directorio_zona (zona_id)
);

-- ---------------------------------------------------------------------
-- DONACION — registro manual de monto objetivo/recaudado por caso
-- (RF07). UNIQUE en caso_id: se asume 1 registro de donación por caso;
-- confirmar este supuesto con el tutor si se previera más de uno.
-- alias_donacion y actualizado_por son NOT NULL: una donación solo se crea
-- cuando el moderador la carga con un alias definido y queda registrado
-- quién la actualizó (alineado con la documentación en /docs).
-- ---------------------------------------------------------------------
CREATE TABLE donacion (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  caso_id              INT NOT NULL,
  monto_objetivo       DECIMAL(10,2) NULL,
  monto_recaudado      DECIMAL(10,2) NOT NULL DEFAULT 0,
  alias_donacion       VARCHAR(80) NOT NULL,
  actualizado_por      INT NOT NULL,
  fecha_actualizacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donacion_caso    FOREIGN KEY (caso_id)         REFERENCES caso(id) ON DELETE CASCADE,
  CONSTRAINT fk_donacion_usuario FOREIGN KEY (actualizado_por) REFERENCES usuario(id),
  UNIQUE KEY uq_donacion_caso (caso_id)
);