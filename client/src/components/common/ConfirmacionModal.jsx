export default function ConfirmacionModal({
  titulo,
  mensaje,
  confirmarTexto = 'Confirmar',
  cancelarTexto = 'Volver',
  peligro = false,
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <div className="modal-backdrop confirmation-backdrop">
      <section className="card confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmacion-titulo">
        <h3 id="confirmacion-titulo">{titulo}</h3>
        <p>{mensaje}</p>
        <div className="socio-modal-actions">
          <button className="btn secondary" type="button" onClick={onCancelar} disabled={procesando}>
            {cancelarTexto}
          </button>
          <button className={`btn ${peligro ? 'danger' : 'primary'}`} type="button" onClick={onConfirmar} disabled={procesando}>
            {procesando ? 'Procesando…' : confirmarTexto}
          </button>
        </div>
      </section>
    </div>
  );
}
