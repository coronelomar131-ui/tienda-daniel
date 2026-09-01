// Leer las tallas que el dueño escribe a mano, sin exigirle un formato.
//
// Antes se partía por comas y luego se intentaba cambiar comas por puntos,
// cuando el split ya se las había comido. Y si escribías "25 26 27" con
// espacios, todo se iba a NaN y el par se guardaba SIN TALLAS sin avisar.
//
// Ahora se acepta como venga: comas, espacios, diagonales, saltos de línea,
// y "MX"/"US" de sobra. La coma decimal ("27,5") se respeta solo cuando lo
// que sigue es un dígito suelto, porque "25, 26" son dos tallas, no 25.26.

export function leerTallas(texto) {
    const limpio = String(texto ?? '')
        .replace(/[^\d.,;/|\s-]+/g, ' ')            // fuera letras y símbolos raros
        .replace(/(\d)\s*,\s*(\d)(?!\d)/g, '$1.$2'); // "27,5" -> "27.5"

    const vistas = new Set();
    return limpio
        .split(/[^\d.]+/)
        .map(Number)
        .filter(n => Number.isFinite(n) && n > 0 && n < 100)
        .filter(n => !vistas.has(n) && vistas.add(n))
        .sort((a, b) => a - b);
}

// Como se le muestran de vuelta, para que vea lo que se va a guardar.
export const escribirTallas = (tallas) => (tallas || []).join(', ');
