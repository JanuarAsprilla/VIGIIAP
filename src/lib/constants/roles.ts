// Mapeo de roles backend → etiquetas UI.
// Vive en su propio archivo (no en AuthContext.tsx) para que ese archivo pueda
// exportar solo componentes — requisito de react-refresh/only-export-components.
export const ROLES = {
  SUPER_ADMIN:   'Super Administrador',
  ADMIN:         'Administrador SIG',
  INVESTIGADOR:  'Investigador',
  TECNICO:       'Técnico SIG',
  INSTITUCIONAL: 'Funcionario Institucional',
  PUBLICO:       'Público',
  VISITANTE:     'Visitante',
}
