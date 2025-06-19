# Asistente de Carga Masiva de Productos para Stocktracker

Este proyecto es una aplicación web creada con Google Apps Script que utiliza la API de Google Gemini para procesar listas de productos en texto plano y transformarlas en tres archivos CSV estructurados. Estos archivos están diseñados para facilitar la carga masiva de nuevos productos, sus transacciones de inventario inicial y los detalles de dicho inventario en el sistema de control y gestión de inventarios **Stocktracker**.

![Captura de pantalla de la aplicación](https://i.imgur.com/kYqVv2C.png)

## ✨ Características Principales

- **Procesamiento Inteligente:** Utiliza la IA de Google Gemini para interpretar descripciones de productos y asignarles automáticamente categorías, subcategorías y nombres limpios.
- **Interfaz Guiada por Pasos:** Una experiencia de usuario intuitiva que guía al usuario a través de tres pasos claros: configuración, ingreso de datos y descarga.
- **Parámetros Flexibles:** Permite al usuario forzar valores específicos para campos como Categoría, Subcategoría, Proveedor, etc., o dejar que la IA los determine.
- **Generación de Múltiples Archivos:** Con un solo clic, genera tres archivos CSV listos para ser importados:
  1. **Listado de Productos:** El catálogo maestro de los nuevos artículos.
  2. **Transacción de Inventario:** El registro de cabecera de la operación de carga inicial.
  3. **Detalle de Inventario Inicial:** Las líneas de detalle que asocian cada producto con la transacción y su cantidad inicial.
- **Pre-procesamiento y Post-procesamiento Robusto:** Limpia automáticamente los datos de entrada y formatea los datos de salida para garantizar la integridad de los archivos CSV y la compatibilidad con Excel.
- **Diseño Profesional y Responsivo:** Una interfaz limpia y moderna con un diseño que se adapta a diferentes tamaños de pantalla.

## 🚀 Puesta en Marcha (Instalación)

Para desplegar y utilizar esta aplicación, necesitas seguir los siguientes pasos:

### 1. Pre-requisitos

- Una **Cuenta de Google**.
- Una **API Key de Google Gemini**. Puedes obtenerla gratuitamente en [Google AI Studio](https://aistudio.google.com/).

### 2. Configuración del Proyecto en Google Apps Script

1. Ve a [script.google.com](https://script.google.com/home) y crea un **Nuevo proyecto**.
2. Dale un nombre a tu proyecto, por ejemplo, "Asistente Stocktracker".
3. Verás una lista de archivos a la izquierda. Borra el contenido del archivo `Código.gs` por defecto.
4. Copia el contenido completo del archivo `Código.gs` proporcionado y pégalo en tu archivo `Código.gs`.
5. Crea un nuevo archivo HTML (`Archivo > Nuevo > Archivo HTML`) y nómbralo **`Index`**. Copia el contenido del `Index.html` proporcionado y pégalo allí.
6. Crea un segundo archivo HTML y nómbralo **`Stylesheet`**. Copia el contenido del `Stylesheet.html` proporcionado y pégalo allí.

Tu estructura de archivos debería verse así:
Archivos
├─ Código.gs
├─ Index.html
└─ Stylesheet.html


### 3. Almacenar la API Key de forma segura

1. En el editor de Apps Script, haz clic en el icono de **Configuración del proyecto** (⚙️) en el menú de la izquierda.
2. Desplázate hacia abajo hasta la sección **"Propiedades de la secuencia de comandos"**.
3. Haz clic en **"Añadir propiedad de la secuencia de comandos"**.
4. En el campo **"Propiedad"**, escribe exactamente: `GEMINI_API_KEY`
5. En el campo **"Valor"**, pega tu clave de API de Google AI (Gemini).
6. Haz clic en **"Guardar propiedades de la secuencia de comandos"**.

### 4. Desplegar la Aplicación Web

1. En la parte superior derecha del editor, haz clic en **"Implementar"** y luego en **"Nueva implementación"**.
2. Haz clic en el icono de engranaje (⚙️) junto a "Seleccionar tipo" y elige **"Aplicación web"**.
3. Configura la implementación de la siguiente manera:
   - **Descripción:** `Versión 1.0 del Asistente de Carga Masiva`.
   - **Ejecutar como:** `Yo (tu_email@gmail.com)`.
   - **Quién tiene acceso:** `Cualquier usuario`. (Recomendado para no tener que iniciar sesión).
4. Haz clic en **"Implementar"**.
5. Google te pedirá que autorices los permisos del script. Sigue los pasos y concede los permisos.
6. Al finalizar, se te proporcionará una **URL de la aplicación web**. ¡Esa es la URL de tu asistente! Guárdala para acceder a ella.

---

## 📖 Guía de Uso Paso a Paso

La aplicación está diseñada como un asistente de 3 pasos.

### **Paso 1: Parámetros Opcionales**
En esta primera sección, puedes definir valores que se aplicarán a **todo el lote de productos** que vas a procesar.
- **¿Cómo funciona?** Si dejas un campo en blanco (ej. "Categoría"), la IA analizará cada producto individualmente para asignarle el valor más lógico. Si escribes un valor (ej. "Frenos" en "Categoría"), todos los productos del lote serán asignados a la categoría "Frenos".
- **Acción:** Una vez que hayas definido los parámetros que necesites (o ninguno), haz clic en el botón verde **"Siguiente"** para continuar.

### **Paso 2: Listado de Productos**
Esta es el área principal donde ingresarás tus datos.
- **¿Cómo funciona?** Pega tu lista de productos en el área de texto. Asegúrate de que haya **un producto por línea**. El formato de cada línea debe ser algo como `CODIGO-PRODUCTO Descripción completa del producto con marca, modelo, etc. Stock: 5`.
- **Límite:** Puedes procesar un máximo de 25 productos a la vez. El contador de líneas te ayudará a llevar la cuenta.
- **Acción:** Una vez que hayas pegado tu lista, el botón azul **"Procesar Datos"** se habilitará. Haz clic en él para que la IA comience a trabajar. Verás un indicador de carga mientras se procesa la información.

### **Paso 3: Previsualización y Descarga**
Una vez que la IA termina su trabajo, esta sección se activará automáticamente.
- **Previsualización:** Verás una tabla con el resultado del archivo principal (`Listado de Productos`) para que puedas verificar rápidamente si la IA interpretó los datos correctamente.
- **Acciones:** Tendrás disponibles tres botones de descarga y uno de reinicio.
  1. **`Descargar Listado de Productos`:** Descarga el archivo CSV principal con el catálogo completo de los productos procesados. Es el archivo que se usa para crear los productos en Stocktracker.
  2. **`Descargar Transacción`:** Descarga un archivo CSV que contiene una única línea. Esta es la "cabecera" de la transacción de inventario inicial.
  3. **`Descargar Inventario Inicial`:** Descarga el archivo CSV con el detalle de la transacción, asociando cada `ID_Producto` con su cantidad de inventario inicial.
  4. **`Realizar Nuevo Procesamiento`:** Limpia todos los campos y resultados, y te devuelve al Paso 1 para que puedas comenzar un nuevo lote.

## 📂 Archivos Generados

La aplicación produce los siguientes tres archivos, diseñados para ser importados en orden:

1. **`productos_YYYY-MM-DD.csv`**
   - **Propósito:** Crear las fichas de los nuevos productos en el sistema.
   - **Contenido:** `ID_Producto`, `Nombre_Producto`, `Descripcion`, `Categoria`, etc.

2. **`transaccion_II_YYYYMMDD_HHMM.csv`**
   - **Propósito:** Crear el registro maestro de la transacción de ajuste de inventario.
   - **Contenido:** `ID_Transaccion`, `Fecha_Hora`, `Tipo_Transaccion`, `Notas_Transaccion`, etc.

3. **`inventario_inicial_II_YYYYMMDD_HHMM.csv`**
   - **Propósito:** Cargar las líneas de detalle de la transacción, asignando el stock a cada producto.
   - **Contenido:** `ID_Transaccion_Detail`, `ID_Transaccion`, `ID_Producto`, `Cantidad`.

## 🛠️ Tecnologías Utilizadas

- **Google Apps Script (GAS):** Backend y hosting de la aplicación.
- **Google Gemini API:** Modelo de IA para el procesamiento de lenguaje natural.
- **HTML5, CSS3, JavaScript:** Estructura y lógica del frontend.
- **Tailwind CSS & Font Awesome:** Librerías de diseño para una interfaz moderna.

## 👨‍💻 Autor

Desarrollado y mantenido por **Ing. Nestor Santos**.

- **LinkedIn:** [https://www.linkedin.com/in/ingnsantos/](https://www.linkedin.com/in/ingnsantos/)
