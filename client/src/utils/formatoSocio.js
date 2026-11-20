export function formatearDocumentoSocio(valor) {
  const documento = String(valor ?? '');
  const digitos = documento.replace(/\D/g, '');

  if (digitos.length !== 11) return documento;
  return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`;
}

export function formatearTelefonoSocio(valor) {
  const telefono = String(valor ?? '');
  const internacional = telefono.match(/^(\+\d{1,3})[-\s](\d{3})[-\s](\d{3})[-\s](\d{4})$/);
  if (internacional) {
    return `${internacional[1]}-${internacional[2]}-${internacional[3]}-${internacional[4]}`;
  }

  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length !== 10) return telefono;
  return `${digitos.slice(0, 3)}-${digitos.slice(3, 6)}-${digitos.slice(6)}`;
}
