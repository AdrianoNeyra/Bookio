from flask import Flask, jsonify, render_template, session, request, redirect, url_for, flash, abort
import mysql.connector, base64, re
from werkzeug.security import generate_password_hash, check_password_hash
import smtplib
import random
import traceback
from email.mime.text import MIMEText
from datetime import datetime, timedelta
  
app = Flask(__name__)
app.secret_key = 'tu_llave_secreta_aqui' # Necesario para sesiones

# Configuración de la base de datos
db_config = {
    'host': 'mysql-bookio-adrianoneyra2007-5b82.l.aivencloud.com',
    'user': 'avnadmin',
    'password': 'AVNS_SSvIvhk1YvEN9kAJd-v',
    'database': 'bookio_db',
    'port': 16246
}

EMAIL_EMISOR = "adrianoneyra2007@gmail.com"
EMAIL_PASSWORD = "gqyp mkxl lzcu wwqx"

def get_db_connection():
    return mysql.connector.connect(**db_config)

def enviar_correo_codigo(email_destino, codigo):
    msg = MIMEText(f"O teu código de recuperação de palavra-passe é: {codigo}\nEste código expira em 15 minutos.")
    msg['Subject'] = 'Código de Recuperação - Bookio'
    msg['From'] = EMAIL_EMISOR
    msg['To'] = email_destino

    try:
        # Cambiamos a SMTP_SSL en el puerto 465 (suele dar menos problemas con Gmail)
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(EMAIL_EMISOR, EMAIL_PASSWORD)
        server.sendmail(EMAIL_EMISOR, email_destino, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("\n❌ --- ERROR CRÍTICO AL ENVIAR CORREO ---")
        print(f"Tipo de error: {type(e).__name__}")
        print(f"Mensaje: {e}")
        traceback.print_exc() # Esto te dirá la línea exacta del fallo
        print("----------------------------------------\n")
        return False

@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    email = request.form.get('email', '').strip()
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user:
        codigo = str(random.randint(100000, 999999))
        expiracion = datetime.now() + timedelta(minutes=15)
        
        cursor.execute(
            "UPDATE users SET reset_token = %s, reset_expires = %s WHERE id = %s",
            (codigo, expiracion, user['id'])
        )
        conn.commit()
        
        if enviar_correo_codigo(email, codigo):
            session['email_a_recuperar'] = email
            cursor.close()
            conn.close()
            # RECARGA LA PÁGINA PERO ABRE EL FORMULARIO 2
            return render_template('login.html', active_form='rp2')
        
    cursor.close()
    conn.close()
    return render_template('login.html', active_form='rp1')

@app.route('/verify_code', methods=['POST'])
def verify_code():
    email = session.get('email_a_recuperar')
    if not email:
        return render_template('login.html', active_form='rp1')

    codigo_ingresado = request.form.get('code', '').strip()
    nueva_pass = request.form.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = "SELECT id FROM users WHERE email = %s AND reset_token = %s AND reset_expires > %s"
    cursor.execute(query, (email, codigo_ingresado, datetime.now()))
    user = cursor.fetchone()

    if user:
        hashed_password = generate_password_hash(nueva_pass)
        cursor.execute(
            "UPDATE users SET password = %s, reset_token = NULL, reset_expires = NULL WHERE id = %s",
            (hashed_password, user['id'])
        )
        conn.commit()
        
        session.pop('email_a_recuperar', None)
        cursor.close()
        conn.close()
        # ÉXITO TOTAL: Te manda al login inicial
        return render_template('login.html', active_form='login')
    else:
        cursor.close()
        conn.close()
        # ERROR: Se queda en la pantalla del código para reintentar
        return render_template('login.html', active_form='rp2')

@app.route('/')
def index():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True) # dictionary=True para acceder por nombre de columna

    try:
        # 1. Obtener libros aprobados con el nombre del autor
        # Usamos un JOIN para traer el username desde la tabla users
        query_libros = """
            SELECT b.*, u.username 
            FROM books b 
            JOIN users u ON b.author_id = u.id 
            WHERE b.status = 'approved' 
            ORDER BY b.created_at DESC 
            LIMIT 8
        """
        cursor.execute(query_libros)
        libros = cursor.fetchall()

        # 2. Obtener total de libros para las estadísticas
        cursor.execute("SELECT COUNT(*) as total FROM books WHERE status = 'approved'")
        total_libros = cursor.fetchone()['total']

        return render_template('index.html', libros=libros, total_libros=total_libros)

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return "Error en la base de datos", 500
    finally:
        cursor.close()
        conn.close()

# --- RUTAS DE NAVEGACIÓN (Esqueletos) ---

@app.route('/explorar')
def explorar():
    # 1. Obtener parámetros de la URL (filtros)
    search_query = request.args.get('q', '')
    genre_filter = request.args.get('genre', '')
    sort_option = request.args.get('sort', 'new')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 2. Construir la consulta base unificando con géneros y autores
        sql = """
            SELECT 
                b.id, 
                b.title, 
                b.image, 
                u.username,
                COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Sem género') AS genre
            FROM books b 
            JOIN users u ON b.author_id = u.id 
            LEFT JOIN book_genres bg ON b.id = bg.book_id
            LEFT JOIN genres g ON bg.genre_id = g.id
            WHERE b.status = 'approved'
        """
        params = []

        # 3. Aplicar filtro de búsqueda (Título o Autor)
        if search_query:
            sql += " AND (b.title LIKE %s OR u.username LIKE %s)"
            params.extend([f"%{search_query}%", f"%{search_query}%"])

        # 4. Aplicar filtro de género (usamos la tabla intermedia bg)
        if genre_filter:
            sql += " AND bg.genre_id = %s"
            params.append(genre_filter)

        # Es obligatorio agrupar por el ID del libro antes de ordenar debido al GROUP_CONCAT
        sql += " GROUP BY b.id"

        # 5. Aplicar ordenamiento
        if sort_option == 'new':
            sql += " ORDER BY b.created_at DESC"
        elif sort_option == 'old':
            sql += " ORDER BY b.created_at ASC"

        cursor.execute(sql, params)
        libros = cursor.fetchall()

        # 6. Obtener el total de libros general para el encabezado
        cursor.execute("SELECT COUNT(*) as total FROM books WHERE status = 'approved'")
        total_libros = cursor.fetchone()['total']

        # === NUEVO: OBTENER LISTA DE GÉNEROS DESDE LA BD ===
        # Hacemos esto justo antes de cerrar el cursor para tener la lista en el HTML
        cursor.execute("SELECT id, name FROM genres ORDER BY name ASC")
        lista_generos = cursor.fetchall()

        return render_template(
            'explorar.html', 
            libros=libros, 
            total_libros=total_libros,
            search=search_query,
            selected_genre=genre_filter,
            sort_option=sort_option,
            generos_db=lista_generos  # ← ¡Pasamos la variable para tu bucle en el HTML!
        )

    except mysql.connector.Error as err:
        print(f"Error en catálogo explorar: {err}")
        return "Erro ao carregar o catálogo", 500
    finally:
        cursor.close()
        conn.close()

@app.route('/libro/<int:libro_id>')
def detalle_libro(libro_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Obtener datos del libro con TODOS sus géneros agrupados
    cursor.execute("""
        SELECT b.*, 
               b.author_id AS user_id, 
               u.username, 
               COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Sem género') AS genre
        FROM books b
        JOIN users u ON b.author_id = u.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.id = %s
        GROUP BY b.id
    """, (libro_id,))
    libro = cursor.fetchone()

    if not libro:
        cursor.close()
        conn.close()
        abort(404)

    # 2. Obtener los capítulos del libro
    cursor.execute("SELECT id, title FROM chapters WHERE book_id = %s ORDER BY id ASC", (libro_id,))
    capitulos = cursor.fetchall()

    # 3. Verificar si es favorito (solo si el usuario está logueado)
    is_favorito = False
    if 'user_id' in session:
        cursor.execute("SELECT * FROM favorites WHERE user_id = %s AND book_id = %s", 
                       (session['user_id'], libro_id))
        if cursor.fetchone():
            is_favorito = True

    # 4. Libros relacionados con TODOS sus géneros agrupados también
    cursor.execute("""
        SELECT b.id, b.title, b.image, u.username,
               COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Sem género') AS genre
        FROM books b
        JOIN users u ON b.author_id = u.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.id IN (
            SELECT DISTINCT book_id 
            FROM book_genres 
            WHERE genre_id IN (SELECT genre_id FROM book_genres WHERE book_id = %s)
        )
        AND b.id != %s
        AND b.status = 'published'
        GROUP BY b.id
        LIMIT 4
    """, (libro_id, libro_id))
    relacionados = cursor.fetchall()

    # ... (Punto 2: Obtener capítulos)
    cursor.execute("SELECT id, title FROM chapters WHERE book_id = %s ORDER BY id ASC", (libro_id,))
    capitulos = cursor.fetchall()

    # === MODIFICADO: CARGAR SOLO LOS 5 PRIMEROS AL PRINCIPIO ===
    cursor.execute("""
        SELECT c.id, c.content, DATE_FORMAT(c.created_at, '%d/%m/%Y %H:%i') AS created_at, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.book_id = %s
        ORDER BY c.created_at DESC
        LIMIT 5
    """, (libro_id,))
    comentarios = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) AS total FROM comments WHERE book_id = %s", (libro_id,))
    total_comentarios = cursor.fetchone()['total']

    cursor.close()
    conn.close()

    # Modifica el return para pasar la variable 'comentarios' al HTML
    return render_template('detalle.html', 
                           libro=libro, 
                           capitulos=capitulos, 
                           is_favorito=is_favorito, 
                           relacionados=relacionados,
                           comentarios=comentarios,
                           total_comentarios=total_comentarios) # ← Pasamos los comentarios aquí

@app.route('/api/libro/<int:libro_id>/comentarios')
def obtener_comentarios_api(libro_id):
    offset = request.args.get('offset', 0, type=int)
    limite = 5
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT c.id, c.content, c.created_at, u.username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.book_id = %s
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        """, (libro_id, limite, offset))
        
        resultados = cursor.fetchall()
        
        comentarios = []
        for r in resultados:
            # Nos aseguramos de que la fecha se convierta a texto sin importar cómo venga de la BD
            if hasattr(r['created_at'], 'strftime'):
                fecha_texto = r['created_at'].strftime('%d/%m/%Y %H:%M')
            else:
                fecha_texto = str(r['created_at'])

            comentarios.append({
                'username': r['username'],
                'content': r['content'],
                'created_at': fecha_texto
            })
            
        return jsonify(comentarios)

    except Exception as e:
        # Esto pintará el error exacto en tu terminal de Flask si algo falla en Python
        print(f"ERR EN API COMENTARIOS: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/libro/<int:libro_id>/comentar', methods=['POST'])
def agregar_comentario(libro_id):
    # Validar que el usuario esté logueado
    if 'user_id' not in session:
        return redirect(url_for('login')) # O mandar un mensaje de error

    content = request.form.get('content', '').strip()
    
    if content:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Insertar comentario en la BD (created_at suele ser TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
            cursor.execute("""
                INSERT INTO comments (book_id, user_id, content) 
                VALUES (%s, %s, %s)
            """, (libro_id, session['user_id'], content))
            conn.commit()
        except mysql.connector.Error as err:
            print(f"Erro ao guardar comentário: {err}")
        finally:
            cursor.close()
            conn.close()

    # Redirige de vuelta a la misma página del libro para ver el comentario reflejado
    return redirect(url_for('detalle_libro', libro_id=libro_id))

@app.route('/libro/<int:libro_id>/nuevo-capitulo', methods=['GET', 'POST'])
def novo_capitulo(libro_id):
    if 'user_id' not in session:
        flash('Tens de iniciar sessão primeiro.', 'error')
        return redirect(url_for('login'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verificar que el libro existe y pertenece al usuario activo
    cursor.execute("SELECT * FROM books WHERE id = %s AND author_id = %s", (libro_id, session['user_id']))
    libro = cursor.fetchone()
    
    if not libro:
        flash('Livro não encontrado ou não tens permissão.', 'error')
        return redirect(url_for('explorar'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()

        try:
            # Buscamos el conteo usando tu columna order_index
            cursor.execute("SELECT COUNT(*) as total FROM chapters WHERE book_id = %s", (libro_id,))
            orden = cursor.fetchone()['total'] + 1

            # Cambiamos 'chapter_order' por 'order_index' en el INSERT
            query = "INSERT INTO chapters (book_id, title, content, order_index) VALUES (%s, %s, %s, %s)"
            cursor.execute(query, (libro_id, title, content, orden))
            conn.commit()
            
            flash('Capítulo guardado com sucesso!', 'success')
            return redirect(url_for('detalle_libro', libro_id=libro_id))
        except Exception as e:
            conn.rollback()
            print(f"Erro ao criar capítulo: {e}")
            flash('Erro ao guardar o capítulo.', 'error')

    # Obtener todos los capítulos del libro para mostrarlos en el sidebar lateral
    cursor.execute("SELECT id, title FROM chapters WHERE book_id = %s ORDER BY order_index ASC", (libro_id,))
    capitulos = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # editando=False porque es un capítulo nuevo
    return render_template('criar_cap.html', libro=libro, capitulos=capitulos, editando=False)

@app.route('/capitulo/<int:capitulo_id>/editar', methods=['GET', 'POST'])
def editar_capitulo(capitulo_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar el capítulo y verificar que el libro pertenezca al usuario logueado
    query_cap = """
        SELECT c.*, b.title as book_title, b.author_id 
        FROM chapters c 
        JOIN books b ON c.book_id = b.id 
        WHERE c.id = %s
    """
    cursor.execute(query_cap, (capitulo_id,))
    resultado = cursor.fetchone()

    if not resultado or resultado['author_id'] != session['user_id']:
        flash('Não tens permissão para editar este capítulo.', 'error')
        return redirect(url_for('explorar'))

    # Reestructuramos la data para que encaje con lo que pide tu HTML
    libro = {'id': resultado['book_id'], 'title': resultado['book_title']}
    capitulo = {'id': resultado['id'], 'title': resultado['title'], 'content': resultado['content']}

    if request.method == 'POST':
        nuevo_titulo = request.form.get('title', '').strip()
        nuevo_contenido = request.form.get('content', '').strip()

        try:
            cursor.execute(
                "UPDATE chapters SET title = %s, content = %s WHERE id = %s",
                (nuevo_titulo, nuevo_contenido, capitulo_id)
            )
            conn.commit()
            flash('Capítulo atualizado com sucesso!', 'success')
            return redirect(url_for('detalle_libro', libro_id=libro['id']))
        except Exception as e:
            conn.rollback()
            print(f"Erro ao atualizar: {e}")
        finally:
            cursor.close()
            conn.close()

    # Obtener el resto de capítulos del mismo libro para la barra lateral
    cursor.execute("SELECT id, title FROM chapters WHERE book_id = %s ORDER BY order_index ASC", (libro['id'],))
    capitulos = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template('criar_cap.html', libro=libro, capitulo=capitulo, capitulos=capitulos, editando=True)

@app.route('/capitulo/<int:capitulo_id>')
def ler_capitulo(capitulo_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Obtener el capítulo actual y los datos básicos de su libro
    query_cap = """
        SELECT c.*, b.title as book_title, b.id as book_id
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        WHERE c.id = %s
    """
    cursor.execute(query_cap, (capitulo_id,))
    capitulo = cursor.fetchone()

    if not capitulo:
        flash('Capítulo não encontrado.', 'error')
        cursor.close()
        conn.close()
        return redirect(url_for('explorar'))

    # Reestructuramos para cumplir con las variables de tu HTML (libro.id, libro.title)
    libro = {'id': capitulo['book_id'], 'title': capitulo['book_title']}

    # 2. Encontrar el capítulo ANTERIOR (el valor más alto de order_index que sea MENOR al actual)
    query_anterior = """
        SELECT id FROM chapters 
        WHERE book_id = %s AND order_index < %s 
        ORDER BY order_index DESC LIMIT 1
    """
    cursor.execute(query_anterior, (libro['id'], capitulo['order_index']))
    anterior = cursor.fetchone()
    anterior_id = anterior['id'] if anterior else None

    # 3. Encontrar el capítulo SIGUIENTE (el valor más bajo de order_index que sea MAYOR al actual)
    query_siguiente = """
        SELECT id FROM chapters 
        WHERE book_id = %s AND order_index > %s 
        ORDER BY order_index ASC LIMIT 1
    """
    cursor.execute(query_siguiente, (libro['id'], capitulo['order_index']))
    siguiente = cursor.fetchone()
    siguiente_id = siguiente['id'] if siguiente else None

    # 4. Calcular el número visual del capítulo (contando cuántos hay antes + 1)
    cursor.execute("SELECT COUNT(*) as total FROM chapters WHERE book_id = %s AND order_index <= %s", 
                   (libro['id'], capitulo['order_index']))
    index_atual = cursor.fetchone()['total']

    cursor.close()
    conn.close()

    # IMPORTANTE: El nombre del archivo debe ser exacto al que tienes creado
    return render_template('ler_cap.html', 
                           libro=libro, 
                           capitulo=capitulo, 
                           anterior_id=anterior_id, 
                           siguiente_id=siguiente_id, 
                           index_atual=index_atual)

@app.route('/perfil') 
@app.route('/perfil/<int:user_id>') 
def perfil(user_id=None):
    if user_id is None:
        if 'user_id' not in session:
            return redirect(url_for('login'))
        target_user_id = int(session['user_id'])
        is_own = True
    else:
        target_user_id = int(user_id)
        # Aseguramos que ambos sean enteros para poder compararlos correctamente
        is_own = (session.get('user_id') is not None and int(session['user_id']) == target_user_id)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Obtener datos del usuario del perfil
        cursor.execute("SELECT id, username, email FROM users WHERE id = %s", (target_user_id,))
        user_profile = cursor.fetchone()

        if not user_profile:
            cursor.close()
            conn.close()
            abort(404)

        user_profile['username_lower'] = str(user_profile['username']).lower()

        # 2. Obtener libros publicados combinando con la tabla de géneros
        if is_own:
            query_libros = """
                SELECT 
                    b.id, 
                    b.title, 
                    b.image,
                    COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Sem género') AS genre
                FROM books b
                LEFT JOIN book_genres bg ON b.id = bg.book_id
                LEFT JOIN genres g ON bg.genre_id = g.id
                WHERE b.author_id = %s
                GROUP BY b.id
                ORDER BY b.id DESC
            """
        else:
            query_libros = """
                SELECT 
                    b.id, 
                    b.title, 
                    b.image,
                    COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Sem género') AS genre
                FROM books b
                LEFT JOIN book_genres bg ON b.id = bg.book_id
                LEFT JOIN genres g ON bg.genre_id = g.id
                WHERE b.author_id = %s AND b.status = 'approved'
                GROUP BY b.id
                ORDER BY b.id DESC
            """
        
        cursor.execute(query_libros, (target_user_id,))
        mis_libros = cursor.fetchall()

        cursor.close()
        conn.close()

        return render_template(
            'perfil.html', 
            user_profile=user_profile, 
            livros=mis_libros,  
            is_own=is_own
        )

    except Exception as err:
        # CAMBIO CLAVE: Cambiado a Exception general para atrapar CUALQUIER fallo (Base de datos, Jinja, Python)
        print("\n❌ --- ERROR CRÍTICO EN LA RUTA DEL PERFIL ---")
        print(f"Detalle del error: {err}")
        print("--------------------------------------------\n")
        
        # Intentar cerrar conexiones de seguridad si falló a mitad de camino
        try:
            cursor.close()
            conn.close()
        except:
            pass
            
        return "Erro no servidor", 500

@app.route('/publicar')
def publicar():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name FROM genres")
    lista_generos = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('publicar.html', editando=False, lista_generos=lista_generos)

@app.route('/upload', methods=['POST'])
def upload():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    # Recoger datos del formulario
    title = request.form.get('title')
    description = request.form.get('description')
    genre_ids = request.form.getlist('genres')
    file = request.files.get('cover')

    image_base64 = None

    # Procesar imagen a Base64
    if file and file.filename != '':
        image_binary = file.read()
        encoded_string = base64.b64encode(image_binary).decode('utf-8')
        image_base64 = f"data:{file.content_type};base64,{encoded_string}"

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Iniciar transacción manual si es necesario (depende del driver)
        conn.start_transaction()

        # 2. Insertar el libro primero
        query_book = """INSERT INTO books (title, description, image, author_id, status) 
                        VALUES (%s, %s, %s, %s, 'pending')"""
        cursor.execute(query_book, (title, description, image_base64, session['user_id']))
        
        # 3. Obtener el ID del libro recién creado
        nuevo_libro_id = cursor.lastrowid

        # 4. Insertar las relaciones en book_genres
        if genre_ids:
            query_rel = "INSERT INTO book_genres (book_id, genre_id) VALUES (%s, %s)"
            # Preparamos los datos para una inserción múltiple
            relaciones = [(nuevo_libro_id, gid) for gid in genre_ids]
            cursor.executemany(query_rel, relaciones)

        conn.commit()
    except Exception as e:
        conn.rollback() # Si algo falla, deshacemos todo
        print(f"Erro: {e}")
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('biblioteca'))

@app.route('/editar_libro/<int:libro_id>', methods=['GET', 'POST'])
def editar_libro(libro_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verificar que el libro existe y es del usuario logueado
    cursor.execute("SELECT * FROM books WHERE id = %s AND author_id = %s", (libro_id, session['user_id']))
    libro = cursor.fetchone()

    if not libro:
        conn.close()
        return redirect(url_for('biblioteca'))

    if request.method == 'POST':
        nuevo_titulo = request.form.get('title')
        genre_ids = request.form.getlist('genres')
        nueva_desc = request.form.get('description')
        file = request.files.get('cover')

        # Lógica de la imagen
        image_final = libro['image']
        if file and file.filename != '':
            image_binary = file.read()
            encoded_string = base64.b64encode(image_binary).decode('utf-8')
            image_final = f"data:{file.content_type};base64,{encoded_string}"

        try:
            conn.start_transaction()

            # 1. Actualizar datos básicos (Corregido: usamos image_final)
            cursor.execute("""UPDATE books SET title=%s, description=%s, image=%s, status='pending' 
                            WHERE id=%s""", (nuevo_titulo, nueva_desc, image_final, libro_id))

            # 2. Borrar géneros antiguos
            cursor.execute("DELETE FROM book_genres WHERE book_id = %s", (libro_id,))

            # 3. Insertar los nuevos géneros
            if genre_ids:
                query_rel = "INSERT INTO book_genres (book_id, genre_id) VALUES (%s, %s)"
                relaciones = [(libro_id, int(gid)) for gid in genre_ids]
                cursor.executemany(query_rel, relaciones)

            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Erro ao editar: {e}")
        
        conn.close()
        return redirect(url_for('biblioteca'))

    # --- AQUÍ ESTÁ LA CORRECCIÓN PARA EL GET ---
    
    # 1. Obtener TODOS los géneros disponibles para mostrar los checkboxes
    cursor.execute("SELECT * FROM genres")
    lista_generos = cursor.fetchall()

    # 2. Obtener los IDs de los géneros que ya tiene este libro
    cursor.execute("SELECT genre_id FROM book_genres WHERE book_id = %s", (libro_id,))
    # Creamos una lista simple: [1, 3, 5]
    generos_del_libro = [row['genre_id'] for row in cursor.fetchall()]

    conn.close()
    return render_template('publicar.html',editando=True,libro=libro,lista_generos=lista_generos,generos_del_libro=generos_del_libro)

# --- RUTA DE LOGIN ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('loginEmail')
        password = request.form.get('loginPass')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Buscamos al usuario por email
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            # REQUISITO: Verificar si está baneado
            if user['status'] == 'banned':
                motivo = user['ban_reason'] if user['ban_reason'] else "No especificado"
                return redirect(url_for('login'))

            # Iniciar sesión exitosa
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['user_rank'] = user['user_rank']
            
            return redirect(url_for('index'))
    
    return render_template('login.html')

# --- RUTA DE REGISTRO ---
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('regName', '').strip()
    email = request.form.get('regEmail', '').strip()
    password = request.form.get('regPass', '')

    # Validaciones rápidas
    if not username or not email or not password:
        return redirect(url_for('login'))

    hashed_password = generate_password_hash(password)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # INSERTAR
        query = "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, email, hashed_password))
        
        # OBTENER ID PARA AUTO-LOGIN
        nuevo_id = cursor.lastrowid
        
        # ¡ESTO ES LO MÁS IMPORTANTE! Sin commit no se guarda nada
        conn.commit() 
        print(f"DEBUG: Usuario {username} creado con ID {nuevo_id}")

        # Iniciar sesión
        session['user_id'] = nuevo_id
        session['username'] = username
        
        return redirect(url_for('explorar')) # Éxito: va a explorar

    except mysql.connector.Error as err:
        if conn:
            conn.rollback() # Si falla, cancelamos cualquier cambio
        
        return redirect(url_for('login')) # Error: vuelve al registro

    finally:
        cursor.close()
        conn.close()

# --- LOGOUT ---
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/biblioteca')
def biblioteca():
    # REQUISITO: El usuario debe estar logueado para ver su biblioteca
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Obtener FAVORITOS (con subconsulta para género)
        query_favs = """
            SELECT b.*, u.username,
            (SELECT g.name FROM genres g 
             JOIN book_genres bg ON g.id = bg.genre_id 
             WHERE bg.book_id = b.id LIMIT 1) as genre
            FROM books b
            JOIN favorites f ON b.id = f.book_id
            JOIN users u ON b.author_id = u.id
            WHERE f.user_id = %s
        """
        cursor.execute(query_favs, (user_id,))
        favoritos = cursor.fetchall()

        # 2. Obtener MIS LIBROS (con subconsulta para género)
        # Incluimos también el género para que aparezca en tus propios libros
        query_mis_libros = """
            SELECT b.*,
            (SELECT g.name FROM genres g 
             JOIN book_genres bg ON g.id = bg.genre_id 
             WHERE bg.book_id = b.id LIMIT 1) as genre
            FROM books b 
            WHERE author_id = %s 
            ORDER BY created_at DESC
        """
        cursor.execute(query_mis_libros, (user_id,))
        libros = cursor.fetchall()

        return render_template('biblioteca.html', favoritos=favoritos, libros=libros)

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return "Erro ao carregar a biblioteca", 500
    finally:
        cursor.close()
        conn.close()

@app.route('/favorito/<int:libro_id>', methods=['POST'])
def toggle_favorito(libro_id):
    if 'user_id' not in session:
        return {"error": "Inicia sessão"}, 401

    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Comprobar si ya existe la combinación exacta
        query_check = "SELECT * FROM favorites WHERE user_id = %s AND book_id = %s"
        cursor.execute(query_check, (user_id, libro_id))
        favorito = cursor.fetchone()

        if favorito:
            # 2. Si existe, borramos por la combinación de ambos
            query_delete = "DELETE FROM favorites WHERE user_id = %s AND book_id = %s"
            cursor.execute(query_delete, (user_id, libro_id))
            status = "removed"
        else:
            # 3. Si no existe, insertamos
            query_insert = "INSERT INTO favorites (user_id, book_id) VALUES (%s, %s)"
            cursor.execute(query_insert, (user_id, libro_id))
            status = "added"

        conn.commit()
        return {"status": status}, 200

    except Exception as e:
        conn.rollback()
        print(f"ERROR EN FAVORITOS: {e}")
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

@app.route('/eliminar/<int:id>', methods=['POST'])
def eliminar(id):
    if 'user_id' not in session:
        return {"success": False}, 401

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Iniciamos transacción para asegurar que se borre todo o nada
        conn.start_transaction()

        # 1. Borrar relaciones de géneros
        cursor.execute("DELETE FROM book_genres WHERE book_id = %s", (id,))
        
        # 2. Borrar el libro (solo si pertenece al usuario actual)
        cursor.execute("DELETE FROM books WHERE id = %s AND author_id = %s", 
                       (id, session['user_id']))

        conn.commit()
        return {"success": True} # Enviamos éxito al JS
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

@app.route('/apelar_libro/<int:libro_id>', methods=['POST'])
def apelar_libro(libro_id):
    if 'user_id' not in session:
        return {"error": "Não autorizado"}, 401

    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificamos que el libro sea del usuario y esté rechazado
        cursor.execute("SELECT status FROM books WHERE id = %s AND author_id = %s", (libro_id, user_id))
        libro = cursor.fetchone()

        if not libro:
            return {"error": "Livro não encontrado"}, 404
        
        if libro[0] != 'rejected':
            return {"error": "Apenas livros rejeitados podem ser apelados"}, 400

        # Cambiamos el estado a 'pending' para que los admins lo vean de nuevo
        cursor.execute("UPDATE books SET status = 'pending' WHERE id = %s", (libro_id,))
        conn.commit()

        return {"status": "success"}, 200

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# --- RUTA PARA BUSCAR (Usada en el header) ---
@app.route('/buscar')
def buscar():
    query = request.args.get('q', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Buscamos coincidencias en título o nombre de autor
    search_sql = """
        SELECT b.*, u.username 
        FROM books b 
        JOIN users u ON b.author_id = u.id 
        WHERE b.status = 'approved' AND (b.title LIKE %s OR u.username LIKE %s)
    """
    val = (f"%{query}%", f"%{query}%")
    cursor.execute(search_sql, val)
    libros = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return render_template('index.html', libros=libros, total_libros=len(libros))

@app.route('/reportar/<string:target_type>', defaults={'target_id': None}, methods=['POST'])
@app.route('/reportar/<string:target_type>/<int:target_id>', methods=['POST'])
def crear_reporte(target_type, target_id):
    # 1. Validar sesión
    if 'user_id' not in session:
        return redirect(url_for('login'))

    # 2. Validar el tipo de reporte admisible en tu ENUM
    if target_type not in ['user', 'book', 'chapter', 'comment']:
        abort(400)

    # 3. Flexibilidad: Si el ID no vino por la URL, lo buscamos en el formulario (input hidden)
    if target_id is None:
        target_id = request.form.get('target_id')
        
    if not target_id:
        return f"Erro: ID do {target_type} em falta.", 400

    # 4. Recoger los motivos del formulario
    reason_select = request.form.get('reason_select', '').strip()
    reason_text = request.form.get('reason_text', '').strip()

    if not reason_select:
        return "Por favor, selecione um motivo para a denúncia.", 400
        
    reason_completa = f"[{reason_select}] {reason_text}".strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 5. Inserción unificada para cualquier tipo de reporte
        cursor.execute("""
            INSERT INTO reports (reporter_id, target_type, target_id, reason)
            VALUES (%s, %s, %s, %s)
        """, (session['user_id'], target_type, target_id, reason_completa))
        conn.commit()
        
    except mysql.connector.Error as err:
        print(f"Erro ao guardar o reporte ({target_type}) em bookio_db: {err}")
        return "Erro interno ao processar a denúncia", 500
    finally:
        cursor.close()
        conn.close()

    return redirect(request.referrer or url_for('explorar'))

@app.route('/admin/dashboard')
def admin_dashboard():
    # Seguridad: Verificar que sea admin
    print(f"DEBUG: Session data -> {session}") # Esto saldrá en tu terminal de VS Code
    if 'user_id' not in session or session.get('user_rank') != 'admin':
        return redirect(url_for('biblioteca'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Obtener todos los usuarios
        cursor.execute("SELECT id, username, email, user_rank, status FROM users ORDER BY id DESC")
        usuarios = cursor.fetchall()

        # 2. Obtener todos los libros aprobados para la pestaña "Livros"
        cursor.execute("""
            SELECT b.*, u.username as autor_nombre 
            FROM books b 
            JOIN users u ON b.author_id = u.id 
            WHERE b.status = 'approved'
            ORDER BY b.id DESC
        """)
        libros_raw = cursor.fetchall()

        # 3. Para cada libro, obtener sus capítulos
        for libro in libros_raw:
            cursor.execute("SELECT id, title FROM chapters WHERE book_id = %s", (libro['id'],))
            libro['capitulos'] = cursor.fetchall()
        
        # 4. Obtener libros pendientes de aprobación
        cursor.execute("""
            SELECT b.*, u.username as autor_nombre 
            FROM books b 
            JOIN users u ON b.author_id = u.id 
            WHERE b.status = 'pending'
            ORDER BY b.id DESC
        """)
        libros_pendientes = cursor.fetchall()

        # === NUEVO: 5. Obtener reportes pendientes de revisión ===
        cursor.execute("""
            SELECT 
                r.id, 
                r.target_type, 
                r.target_id, 
                r.reason, 
                r.status, 
                DATE_FORMAT(r.created_at, '%d/%m/%Y %H:%i') AS fecha,
                u.username AS denunciante
            FROM reports r
            JOIN users u ON r.reporter_id = u.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        """)
        reportes_pendientes = cursor.fetchall()

        # Enriquecer de forma dinámica según el target_type de tu BD
        for repo in reportes_pendientes:
            if repo['target_type'] == 'book':
                cursor.execute("SELECT title FROM books WHERE id = %s", (repo['target_id'],))
                res = cursor.fetchone()
                repo['objeto_nombre'] = res['title'] if res else "[Livro Eliminado]"
                
            elif repo['target_type'] == 'user':
                cursor.execute("SELECT username FROM users WHERE id = %s", (repo['target_id'],))
                res = cursor.fetchone()
                repo['objeto_nombre'] = res['username'] if res else "[Utilizador Eliminado]"
                
            elif repo['target_type'] == 'comment':
                cursor.execute("SELECT content FROM comments WHERE id = %s", (repo['target_id'],))
                res = cursor.fetchone()
                # 🚨 CORREGIDO: Quitamos el [:50] para guardar el contenido completo en la base de datos
                repo['objeto_nombre'] = res['content'] if res else "[Comentário Ocultado/Eliminado]"
                
            elif repo['target_type'] == 'chapter':
                cursor.execute("SELECT title FROM chapters WHERE id = %s", (repo['target_id'],))
                res = cursor.fetchone()
                repo['objeto_nombre'] = res['title'] if res else "[Capítulo Eliminado]"

    except mysql.connector.Error as err:
        print(f"ERROR EN DASHBOARD ADMIN: {err}")
        return "Erro interno ao processar dados do painel", 500
    finally:
        cursor.close()
        conn.close()

    # Enviamos de forma unificada todas las colecciones al HTML admin.html
    return render_template(
        'admin.html', 
        usuarios=usuarios, 
        libros=libros_raw, 
        libros_pendientes=libros_pendientes,
        reportes=reportes_pendientes  # ← El eslabón perdido que activa tu HTML
    )
# --- PROMOVER / DEGRADAR ---
@app.route('/admin/promote/<int:usuario_id>')
def promover_usuario(usuario_id):
    if session.get('user_rank') != 'admin': return redirect(url_for('biblioteca'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET user_rank = 'admin' WHERE id = %s", (usuario_id,))
    conn.commit()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/demote/<int:usuario_id>')
def degradar_usuario(usuario_id):
    if session.get('user_rank') != 'admin': return redirect(url_for('biblioteca'))
    if usuario_id == session['user_id']: return "No puedes degradarte a ti mismo"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET user_rank = 'user' WHERE id = %s", (usuario_id,))
    conn.commit()
    return redirect(url_for('admin_dashboard'))

# --- BANEAR / DESBANEAR ---
@app.route('/admin/ban/<int:id>')
def admin_ban_user(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET status = 'banned' WHERE id = %s", (id,))
    conn.commit()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/unban/<int:id>')
def admin_unban_user(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET status = 'active' WHERE id = %s", (id,))
    conn.commit()
    return redirect(url_for('admin_dashboard'))

# --- ELIMINAR USUARIO (Y SUS LIBROS) ---
@app.route('/admin/delete-user/<int:id>')
def admin_delete_user(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        # 1. Borrar capítulos de sus libros
        cursor.execute("DELETE FROM chapters WHERE book_id IN (SELECT id FROM books WHERE author_id = %s)", (id,))
        # 2. Borrar relaciones de géneros de sus libros
        cursor.execute("DELETE FROM book_genres WHERE book_id IN (SELECT id FROM books WHERE author_id = %s)", (id,))
        # 3. Borrar sus libros
        cursor.execute("DELETE FROM books WHERE author_id = %s", (id,))
        # 4. Borrar el usuario
        cursor.execute("DELETE FROM users WHERE id = %s", (id,))
        conn.commit()
    except:
        conn.rollback()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/delete-cap/<int:id>')
def admin_delete_cap(id):
    if session.get('user_rank') != 'admin':
        return redirect(url_for('biblioteca'))
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM chapters WHERE id = %s", (id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Erro ao eliminar capítulo: {e}")
    finally:
        cursor.close()
        conn.close()
        
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/delete-book/<int:id>')
def admin_delete_book(id):
    if session.get('user_rank') != 'admin':
        return redirect(url_for('biblioteca'))
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        
        # 1. Borrar todos los capítulos asociados al libro
        cursor.execute("DELETE FROM chapters WHERE book_id = %s", (id,))
        
        # 2. Borrar las relaciones de géneros
        cursor.execute("DELETE FROM book_genres WHERE book_id = %s", (id,))
        
        # 3. Borrar el libro
        cursor.execute("DELETE FROM books WHERE id = %s", (id,))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Erro ao eliminar livro completo: {e}")
    finally:
        cursor.close()
        conn.close()
        
    return redirect(url_for('admin_dashboard'))

# APROBAR ALTERACIÓN
@app.route('/admin/approve-book/<int:id>')
def admin_approve_book(id):

    if session.get('user_rank') != 'admin':
        return redirect(url_for('index'))

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # IMPORTANTE: Usamos 'approved' porque es el valor de tu ENUM
        cursor.execute("UPDATE books SET status = 'approved' WHERE id = %s", (id,))
        conn.commit()
            
    except Exception as e:
        conn.rollback()
        print(f"Erro ao aprovar: {e}")
    finally:
        cursor.close()
        conn.close()
    
    # Redirigir de vuelta al dashboard de admin
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/reject-book/<int:id>')
def admin_reject_book(id):
    
    user_rank = session.get('user_rank')
    if user_rank != 'admin':
        return redirect(url_for('index'))

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Cambiamos el estado a 'rejected' (según tu ENUM)
        cursor.execute("UPDATE books SET status = 'rejected' WHERE id = %s", (id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Erro ao rejeitar: {e}")
    finally:
        conn.close()
    
    return redirect(url_for('admin_dashboard'))

# A. DESCARTAR REPORTE (Cambia el estado a 'dismissed')
@app.route('/admin/reportes/descartar/<int:report_id>', methods=['POST'])
def admin_descartar_reporte(report_id):
    if 'user_id' not in session or session.get('user_rank') != 'admin': abort(403)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE reports SET status = 'dismissed' WHERE id = %s", (report_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return redirect(url_for('admin_dashboard'))


# B. RESOLVER REPORTE (Dependiendo del tipo, oculta o banea, y marca como 'resolved')
@app.route('/admin/reportes/resolver/<int:report_id>', methods=['POST'])
def admin_resolver_reporte(report_id):
    if 'user_id' not in session or session.get('user_rank') != 'admin': abort(403)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Obtener los datos del reporte para saber qué castigar
    cursor.execute("SELECT target_type, target_id FROM reports WHERE id = %s", (report_id,))
    repo = cursor.fetchone()

    if repo:
        # Aplicamos la sanción correspondiente según tu lógica de BD
        if repo['target_type'] == 'comment':
            # Cambiamos el estado del comentario a oculto usando el ENUM de tu BD
            cursor.execute("UPDATE comments SET status = 'hidden' WHERE id = %s", (repo['target_id'],))
            
        elif repo['target_type'] == 'book':
            # Rechazamos el libro usando tu ENUM de books
            cursor.execute("UPDATE books SET status = 'rejected' WHERE id = %s", (repo['target_id'],))
            
        elif repo['target_type'] == 'user':
            # Baneamos al usuario usando tu ENUM de users
            cursor.execute("UPDATE users SET status = 'banned' WHERE id = %s", (repo['target_id'],))

        # 2. Marcamos el reporte actual como resuelto
        cursor.execute("UPDATE reports SET status = 'resolved' WHERE id = %s", (report_id,))
        conn.commit()

    cursor.close()
    conn.close()
    return redirect(url_for('admin_dashboard'))

@app.errorhandler(404)
def pagina_nao_encontrada(e):
    # Retorna la plantilla personalizada junto con el código de estado 404 explícito
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)