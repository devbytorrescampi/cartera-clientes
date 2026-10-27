// CSV para Excel en español: separador ";", UTF-8 con BOM (sin BOM, Excel muestra mal los acentos)
// y fin de línea CRLF. La lectura acepta también "," y archivos sin BOM.

const BOM = '﻿';
const SEPARADOR = ';';

// Una celda que empieza con estos caracteres Excel la interpreta como fórmula.
const INICIO_FORMULA = /^[=+\-@\t\r]/;

/** Antepone un apóstrofo a los textos que Excel ejecutaría como fórmula (inyección de fórmulas). */
export function neutralizarFormula(texto: string): string {
  return INICIO_FORMULA.test(texto) ? `'${texto}` : texto;
}

/** Revierte neutralizarFormula al importar. */
export function restaurarFormula(texto: string): string {
  return texto.startsWith("'") && INICIO_FORMULA.test(texto.slice(1)) ? texto.slice(1) : texto;
}

function celda(valor: string): string {
  return /[";\r\n,]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function escribirCsv(filas: string[][]): string {
  return BOM + filas.map((fila) => fila.map(celda).join(SEPARADOR)).join('\r\n') + '\r\n';
}

/**
 * Lee un CSV con comillas dobles (que pueden contener separadores y saltos de línea).
 * El separador se toma de la primera línea: ";" salvo que solo haya ",".
 * Descarta las filas completamente vacías.
 */
export function leerCsv(texto: string): string[][] {
  const contenido = texto.startsWith(BOM) ? texto.slice(1) : texto;
  const primeraLinea = contenido.slice(0, contenido.search(/\r?\n|$/));
  const separador = primeraLinea.includes(';') || !primeraLinea.includes(',') ? ';' : ',';

  const filas: string[][] = [];
  let fila: string[] = [];
  let valor = '';
  let entreComillas = false;

  const cerrarFila = () => {
    fila.push(valor);
    if (fila.some((v) => v.trim() !== '')) filas.push(fila);
    fila = [];
    valor = '';
  };

  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i];
    if (entreComillas) {
      if (c === '"' && contenido[i + 1] === '"') {
        valor += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        valor += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(valor);
      valor = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && contenido[i + 1] === '\n') i++;
      cerrarFila();
    } else {
      valor += c;
    }
  }
  if (valor !== '' || fila.length > 0) cerrarFila();
  return filas;
}

/** Minúsculas, sin acentos y solo letras y números: para comparar encabezados y etiquetas. */
export function normalizarClave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
