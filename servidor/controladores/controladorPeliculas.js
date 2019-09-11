var conexionBaseDeDatos = require('../lib/conexionbd');

//Funciones de las guias practicas:

//Guia 4: "Recomendador de peliculas"

function recomendador(req, res) {

    var anio_inicio = req.query.anio_inicio;
    var anio_fin = req.query.anio_fin;
    var puntuacion = req.query.puntuacion;
    var genero = req.query.genero;
    var limit = req.query.cantidad;
    //creamos variable para distinguir entre estreno o clasico
    var tipoPeli = undefined;
    if (anio_inicio != undefined) {
        if (anio_inicio == 2005) {
            //es un estreno
            tipoPeli = '>=';
        } else {
            //una clasica
            tipoPeli = '<';
        }
    }

    //creamos la consulta
    var consulta = 'SELECT pelicula.id, pelicula.titulo, pelicula.trama, genero.nombre, pelicula.poster, pelicula.puntuacion FROM pelicula join genero on pelicula.genero_id = genero.id ';

    //si filtra por genero:
    if (genero != undefined) {
        consulta += ` where genero.nombre = '${genero}'`;
        if (puntuacion != undefined) {
            consulta += ` and puntuacion > 6`;
        }
        if (anio_fin != undefined) {
            consulta += ` and anio ${tipoPeli} 2005`;
        }
    } else {//si no filtra por genero
        //si filtra por puntacion 
        if (puntuacion != undefined) {
            consulta += `where puntuacion > 6`;
            if (tipoPeli != undefined) {
                consulta += `and anio ${tipoPeli} 2005`;
            }
        }
        if (tipoPeli != undefined) {
            consulta += `and anio ${tipoPeli} 2005`;
        }
    }
    if (limit != undefined) {
        consulta += ` limit ${limit}`
    }
    conexionBaseDeDatos.query(consulta, function (error, results, fields) {

        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar las peliculas. Verificar los parametros ingresados");
        }
        else {
            var lista = {
                peliculas: results,
            }
            res.send(lista);
        }
    });
};





//Guia2: Devolver la lista de generos

function listaGeneros(req, res) {
    conexionBaseDeDatos.query('SELECT nombre, id FROM `genero`', function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los generos");
        } else {
            var lista = {
                generos: results,
            }
        }
        res.send(lista);
    })
};

//Guia 1 y 2: Devolver toda la lista de peliculas o Filtrar peliculas

function filtrarPeliculas(req, res) {
    //Captar y guardar parametros
    var anio = req.query.anio;
    var titulo = req.query.titulo;
    var genero = req.query.genero;
    var colOrden = req.query.columna_orden;
    var tipoOrden = req.query.tipo_orden;
    var limit = req.query.cantidad;
    var pagina = req.query.pagina;
    //Crea la consulta 
    var consulta = 'SELECT * FROM `pelicula`';

    //si filtra por genero:
    if (genero != undefined) {
        consulta += ` where genero_id = '${genero}'`;
    }
    //si filtra por titulo:
    if (titulo != undefined) {
        if (genero == undefined) {
            consulta += ` where titulo like '%${titulo}%'`;            
        } else { consulta += ` && titulo like '%${titulo}%'`; }
    }

    //si filtra por año:
    if (anio != undefined) {
        if (genero == undefined && titulo == undefined) {
            consulta += ` where anio = ${anio}`;
        } else {
            consulta += `&& anio = ${anio}`;
        }

    }
    //si ordena
    if (colOrden != undefined) {
        consulta += ` order by ${colOrden} ${tipoOrden} `;
    }


    //consulta y envia la respuesta
    //1ero consulto sin limit para saber el total de registros
    var total = undefined;
    conexionBaseDeDatos.query(consulta, function (error, results, fields) {
        total = results.length;
    });
    //Hago la consulta con el limit y envio la respuesta al front      
    var numeroCon = (pagina - 1) * 52;
    consulta += `limit ${numeroCon}, ${limit}`;
    conexionBaseDeDatos.query(consulta, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar las peliculas. Verificar los parametros ingresados");
        } else {
            var lista = {
                peliculas: results,
                total: total,
            }
            res.send(lista);
        }
    });


};

//guia 3 devolver toda la info de la pelicula




function infoPelicula(req, res) {
    var id = req.params.id;

    //Consulta a la base de datos sobre actores
    var actores = undefined;
    var consultaActores = `select nombre 
    from actor
    join actor_pelicula
    on actor_id = actor.id
    where pelicula_id = ${id}`;
    conexionBaseDeDatos.query(consultaActores, function (error, pelicula1, fields) {
        actores = pelicula1;
    });
    
    //Consulta info a la base de datos sobre tabla pelicula y genero. 
    var peliculaYgenero = `select titulo, duracion, director,  anio, poster, trama, fecha_lanzamiento, puntuacion, nombre 
    from pelicula 
    join genero 
    on pelicula.genero_id = genero.id where
     pelicula.id = ${id}`
    conexionBaseDeDatos.query(peliculaYgenero, function (error, pelicula1, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los actores. Intente nuevamente");
        } else {
            var data = {
                pelicula: pelicula1[0],
                actores: actores,
            }
            res.send(data)
        }

    });

};


//exportamos la función porcentaje para poder llamarla desde el servidor.
module.exports = {
    recomendador: recomendador,
    listaGeneros: listaGeneros,
    filtrarPeliculas: filtrarPeliculas,
    infoPelicula: infoPelicula,
};



