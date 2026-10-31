const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Expresiones regulares para validación
const EXP = {
  // Cédula dominicana: 8 dígitos o formato 001-1234567-8
  cedulaDominicana: /^(?:[0-9]{8}|[0-9]{3}-[0-9]{7}-[0-9])$/,
  // Teléfono: 000-000-0000 o equivalencias internacionales: +XX-000-000-0000 o +XX 000 000 0000
  telefono: /^(?:\+\d{1,3}-)?\d{3}-\d{3}-\d{4}$|^(?:\+\d{1,3}\s)?\d{3}\s\d{3}\s\d{4}$|^\d{10}$|^\d{3}\s\d{3}\s\d{4}$/,
  // Edad: mínimo 18 años, máximo 90 años
  edadMinima: 18,
  edadMaxima: 90,
};

// Helper: calcular edad desde fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// Helper: validar si una fecha es un día laborable (no fin de semana ni feriado dominicano)
function esDiaLaborable(dia) {
  const diaSemana = dia.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
  if (diaSemana === 0 || diaSemana === 6) return false; // fin de semana

  // Feriados oficiales de República Dominicana
  const mes = dia.getMonth(); // 0-11
  const diaMes = dia.getDate();

  const feriados = {
    '01-06': 'Día de los Reyes',     // 6 de enero
    '02-27': 'Día de la Independencia', // 27 de febrero
    '04-16': 'Día de la Libertad',    // 16 de abril
    '05-01': 'Día del Trabajo',       // 1 de mayo
    '08-15': 'Día de la Altagracia',  // 15 de agosto
    '11-03': 'Día de la Constitución',// 3 de noviembre
    '12-25': 'Navidad',               // 25 de diciembre
    '12-31': 'Año Nuevo',             // 31 de diciembre
  };

  const clave = `${mes + 1}-${diaMes.toString().padStart(2, '0')}`;
  if (feriados[clave]) return false; // es feriado

  return true;
}

const Socio = sequelize.define('Socio', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  documento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isCedula(value) {
        if (!EXP.cedulaDominicana.test(value)) {
          throw new Error('Formato de cédula dominicana inválido. Use: 00000000 o 001-1234567-8');
        }
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail(value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Email inválido');
        }
      },
    },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isTelefono(value) {
        if (!EXP.telefono.test(value)) {
          throw new Error(
            'Formato de teléfono inválido. Use: 000-000-0000 o +XX-000-000-0000'
          );
        }
      },
    },
  },
  direccion: { type: DataTypes.STRING },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isValidAge(value) {
        const edad = calcularEdad(value);
        if (edad < EXP.edadMinima) {
          throw new Error(
            `El socio debe ser mayor de ${EXP.edadMinima} años. Edad actual: ${edad}`
          );
        }
        if (edad > EXP.edadMaxima) {
          throw new Error(
            `La edad máxima permitida es de ${EXP.edadMaxima} años. Edad actual: ${edad}`
          );
        }
      },
    },
  },
  fechaIngreso: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('activo', 'inactivo'), defaultValue: 'activo' },
}, { tableName: 'socios' });

module.exports = Socio;