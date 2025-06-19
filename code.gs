// Variable Global para la URL de despliegue
const SCRIPT_URL = ScriptApp.getService().getUrl();

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Asistente de Carga Masiva')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function formatNumericCodesAsText(csvString) {
  try {
    const lines = csvString.trim().split('\n');
    const headerLine = lines.shift(); 
    if (!headerLine) return csvString;
    const headers = headerLine.split(',');
    const idProductoIndex = headers.indexOf('ID_Producto');
    const codigoFabIndex = headers.indexOf('Codigo_Fab');
    if (idProductoIndex === -1 && codigoFabIndex === -1) return csvString;

    const processedLines = lines.map(line => {
      const columns = line.split(',');
      if (idProductoIndex > -1 && columns[idProductoIndex] && /^\d+$/.test(columns[idProductoIndex])) {
        columns[idProductoIndex] = "'" + columns[idProductoIndex];
      }
      if (codigoFabIndex > -1 && columns[codigoFabIndex] && /^\d+$/.test(columns[codigoFabIndex])) {
        columns[codigoFabIndex] = "'" + columns[codigoFabIndex];
      }
      return columns.join(',');
    });
    return [headerLine, ...processedLines].join('\n');
  } catch(e) {
    Logger.log("Error al formatear códigos numéricos: " + e.toString());
    return csvString; 
  }
}

function generarCsvInventario(productosCsv, idTransaccion) {
  try {
    const lineas = productosCsv.trim().split('\n');
    const encabezadoProductos = lineas.shift();
    if (!encabezadoProductos) return ""; 

    const indices = {
      idProducto: encabezadoProductos.split(',').indexOf('ID_Producto'),
      inventarioInicial: encabezadoProductos.split(',').indexOf('Inventario_Incial')
    };

    if (indices.idProducto === -1 || indices.inventarioInicial === -1) {
      Logger.log("No se encontraron las columnas 'ID_Producto' o 'Inventario_Incial'.");
      return "";
    }

    const encabezadoInventario = 'ID_Transaccion_Detail,ID_Transaccion,ID_Producto,Cantidad,Monto';
    const filasInventario = [];

    lineas.forEach(linea => {
      const columnas = linea.split(',');
      const idProducto = columnas[indices.idProducto];
      const cantidad = columnas[indices.inventarioInicial];

      if (idProducto && cantidad && cantidad.trim() !== '') {
        const idTransaccionDetail = Utilities.getUuid().substring(0, 8).toUpperCase();
        const nuevaFila = [
          idTransaccionDetail,
          idTransaccion,
          idProducto,
          cantidad,
          '' 
        ].join(',');
        filasInventario.push(nuevaFila);
      }
    });

    return [encabezadoInventario, ...filasInventario].join('\n');
  } catch (e) {
    Logger.log("Error al generar CSV de inventario: " + e.toString());
    return "";
  }
}

function generarCsvTransaccion(idTransaccion) {
    const ahora = new Date();
    const fechaHora = Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
    const nombreArchivoInventario = `inventario_inicial_${idTransaccion.substring(3)}.csv`;
    const notas = `Carga de Inventario Inicial segun ${nombreArchivoInventario}`;
    
    const encabezado = 'ID_Transaccion,Fecha_Hora,Tipo_Transaccion,ID_Usuario,ID_Proveedor,ID_Cliente,Referencia_Documento,Notas_Transaccion,Ajuste,Image_Transaccion,ID_Empresa';
    
    const fila = [
        idTransaccion,
        fechaHora,
        "II",
        "", // ID_Usuario
        "", // ID_Proveedor
        "", // ID_Cliente
        "", // Referencia_Documento
        notas,
        "TRUE",
        "", // Image_Transaccion
        "ID000001"
    ].join(',');

    return [encabezado, fila].join('\n');
}

function processDataWithAI(rawData, stockMinimo, categoria, subcategoria, unidadMedida, idProveedor, ubicacion) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) throw new Error("API Key no configurada en el servidor.");
    
    const cleanedRawData = rawData.replaceAll(',', '.');
    const fullPrompt = `${getMetaPrompt(stockMinimo, categoria, subcategoria, unidadMedida, idProveedor, ubicacion)}\n# DATOS DE PRODUCTOS A PROCESAR:\n${cleanedRawData}`;
    const modelName = "gemini-1.5-flash-latest";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
      "contents": [{ "parts": [{ "text": fullPrompt }] }],
      "generationConfig": { "temperature": 0.2, "maxOutputTokens": 8192 }
    };
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(API_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseBody);
      if (jsonResponse.candidates && jsonResponse.candidates[0].content.parts[0].text) {
        let csvResult = jsonResponse.candidates[0].content.parts[0].text.trim();
        csvResult = csvResult.replaceAll('VACIO_', '');
        const productosCsvFinal = formatNumericCodesAsText(csvResult);
        
        const idTransaccion = `II_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmm")}`;
        const inventarioCsvFinal = generarCsvInventario(productosCsvFinal, idTransaccion);
        const transaccionCsvFinal = generarCsvTransaccion(idTransaccion);

        return {
          productosCSV: productosCsvFinal,
          inventarioCSV: inventarioCsvFinal,
          transaccionCSV: transaccionCsvFinal
        };

      } else {
        throw new Error("AI API response format error.");
      }
    } else {
      throw new Error(`AI API call failed. Código: ${responseCode}`);
    }
  } catch (e) {
    Logger.log(`Error en la ejecución de processDataWithAI: ${e.toString()}`);
    throw new Error(e.message);
  }
}

function getMetaPrompt(stockMinimo, categoria, subcategoria, unidadMedida, idProveedor, ubicacion) {
  const hoy = new Date();
  const diaFormateado = String(hoy.getDate()).padStart(2, '0');
  const mesFormateado = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioCompleto = hoy.getFullYear();
  const fechaFormateada = `${anioCompleto}/${mesFormateado}/${diaFormateado}`;
  const stockMinimoValue = (stockMinimo && stockMinimo.trim() !== '') ? stockMinimo.trim() : '1';

  const categoriaInstruction = categoria ? `*   **Categoria**: Usa el valor FIJO '${categoria}' para este campo.` : `*   **Categoria**: Analiza la descripción para asignarle una categoría lógica.`;
  const subCategoriaInstruction = subcategoria ? `*   **SubCategoria**: Usa el valor FIJO '${subcategoria}' para este campo.` : `*   **SubCategoria**: Analiza la descripción para asignarle una subcategoría lógica.`;
  const unidadMedidaInstruction = unidadMedida ? `*   **Unidad_Medida**: Usa el valor FIJO '${unidadMedida}' para este campo.` : `*   **Unidad_Medida**: Interpreta la unidad de medida (ej. 'KIT', 'JGO', 'PZA'). Si no es clara, usa 'UND'.`;
  const idProveedorInstruction = idProveedor ? `*   **ID_Proveedor_Principal**: Usa el valor FIJO '${idProveedor}' para este campo.` : `*   **ID_Proveedor_Principal**: Usa el placeholder VACIO_ para este campo.`;
  const ubicacionInstruction = ubicacion ? `*   **Ubicacion_Predeterminada**: Usa el valor FIJO '${ubicacion}' para este campo.` : `*   **Ubicacion_Predeterminada**: Usa el placeholder VACIO_ para este campo.`;

  return `# Rol y Objetivo
Eres un asistente experto en procesamiento de datos. Tu tarea es recibir información de productos y transformarla a un formato CSV estructurado.

---
# Estructura del CSV de Salida
El resultado debe ser un CSV con este encabezado exacto:
ID_Producto,Nombre_Producto,Descripcion,Codigo_Fab,Categoria,SubCategoria,Unidad_Medida,Imagen,Codigo_Barras_QR,ID_Proveedor_Principal,Stock_Minimo,Ubicacion_Predeterminada,Notas_Producto,Activo,Fecha_Registro_item,ID_Usuario,ID_Empresa,Inventario_Incial

---
# Instrucciones de Procesamiento

### Mapeo de Campos
*   **ID_Producto** y **Codigo_Fab**: Usa el código de producto del origen para ambos campos.
*   **Nombre_Producto**: Extrae un nombre de producto conciso del texto de origen.
*   **Descripcion**: Usa el texto de origen completo como descripción.
${categoriaInstruction}
${subCategoriaInstruction}
${unidadMedidaInstruction}
${idProveedorInstruction}
${ubicacionInstruction}
*   **Notas_Producto**: Si el origen contiene información que se considere relevante, ponla aquí pero sin emplear comas(,) solo puntos (.).
*   **Inventario_Incial**: Si el origen contiene información de inventario inicial (Stock actual) colocaras en este campo la cantidad de inventario, sino encuentras información establece el valor por defecto como "0".

### Valores Fijos y Placeholders
*   **ID_Empresa**: Siempre 'ID000001'.
*   **Stock_Minimo**: Siempre '${stockMinimoValue}'.
*   **Activo**: Siempre TRUE.
*   **Fecha_Registro_item**: Siempre '${fechaFormateada}'.
*   **Placeholders**: Usa la palabra VACIO_ para los campos: **Imagen**, **Codigo_Barras_QR**, **ID_Usuario**.

---
# REQUISITO CRÍTICO
Tu respuesta DEBE ser únicamente el contenido CSV en crudo, comenzando con la fila de encabezado. NO incluyas texto adicional.`;
}
