import PanelCabecera from './PanelCabecera.jsx';

export default function PanelCard({
  titulo,
  descripcion,
  enlace,
  textoEnlace,
  className = '',
  actions,
  children,
}) {
  return (
    <section className={`dashboard-panel${className ? ` ${className}` : ''}`}>
      <PanelCabecera
        titulo={titulo}
        descripcion={descripcion}
        enlace={enlace}
        textoEnlace={textoEnlace}
      >
        {actions}
      </PanelCabecera>
      {children}
    </section>
  );
}
