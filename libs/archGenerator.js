var archGen = {}

function parsePoint(coordinates, properties) {
    // creo l'oggetto THREE punto a partire dai dati della feature (feature.geometry.coordinates) e lo aggiungo alla map
    var pointPosition = new THREE.Vector3(
                        coordinates[0], 
                        coordinates[1]
                        );
    
    var point = new THREE.Object3D();
    
    point.position = pointPosition;
    
    // aggiungo all'object3D un cerchietto per segnarlo sulla mappa
    point.add(new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ) ));
    
    return point;
}

function parseLineString(coordinates, properties) {
    switch (properties.class) {
        case "internal_wall":
            var material = new THREE.LineBasicMaterial({ color: 0x5898A4, linewidth: 5 });
            break;
        case "door":
            var material = new THREE.LineBasicMaterial({ color: 0x052744, linewidth: 5 });
            break;
        case "level":
            var material = new THREE.LineBasicMaterial({ color:0x00ffff, linewidth: 5 });
            break;
        default:
            var material = new THREE.LineBasicMaterial({ color: 0x000000 });
    }
    
    var geometry = new THREE.Geometry();
    for(var i=0; i<coordinates.length; i++){
        geometry.vertices.push( new THREE.Vector3( coordinates[i][0], coordinates[i][1],0 ) );
    };
    var line = new THREE.Line( geometry, material );
    return line;
    //map.add( line );
}

function parsePolygon(coordinates, properties) {
    // probabilmente l'utilizzo di una shape risulta l'opzione migliore, specialmente per la creazione degli holes (vedi docs geoJson)
    
    var shape = new THREE.Shape();
    for (var j = 0; j < coordinates[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(coordinates[0][j][0], coordinates[0][j][1]);
        } else { // altri punti
            shape.lineTo(coordinates[0][j][0], coordinates[0][j][1]);
        }
    }
    
    for (var i = 1; i < coordinates.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < coordinates[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(coordinates[i][j][0], coordinates[i][j][1]);
            } else { // altri punti
                hole.lineTo(coordinates[i][j][0], coordinates[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    
    var polygon = new THREE.Mesh(shape.makeGeometry(), new THREE.MeshBasicMaterial({color: 0x0DD45C, transparent: true, opacity: 0.3, side: THREE.DoubleSide}));
    
    polygon.position.z = 0;  // imposta il piano di altezza
    
    return polygon;
    //map.add(polygon);
}


archGen['Point'] = parsePoint;

archGen['LineString'] = parseLineString;

archGen['Polygon'] = parsePolygon;

archGen['MultiPoint'] = function parseMultiPoint(coordinates, properties) {
	var multiPoint = new THREE.Object3D();
    for(var i=0;i<coordinates.length; i++) {
		parsePoint(coordinates[i],properties);
	}

    return multiPoint;
};

archGen['MultiLineString'] = function parseMultiLineString(coordinates, properties) {
    var multiLine = new THREE.Object3D();
    for(var i=0;i<coordinates.length; i++) {
        multiLine.add(parseLineString(coordinates[i],properties));
    }
    return multiLine;
};

archGen['MultiPolygon'] = function parseMultiPolygon(coordinates, properties) {
    var multiPolygon = new THREE.Object3D();
    for(var i=0;i<coordinates.length; i++) {
        parsePolygon(coordinates[i],properties);
    }

    return multiPolygon;
};
