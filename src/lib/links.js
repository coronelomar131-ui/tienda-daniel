// Los links de config.js vienen con texto de ejemplo ("tu_cuenta_aqui",
// "TUIDAQUI") hasta que el dueño pone los suyos. Un link de ejemplo lleva a una
// pagina que no existe, asi que mientras siga asi mejor no se muestra.
// En cuanto se pone el link real en config.js, aparece solo.
const EJEMPLO = /tu_cuenta_aqui|TUIDAQUI/i;

export const linkReal = (url) => (url && !EJEMPLO.test(url) ? url : '');
