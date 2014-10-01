var archGen = {}

/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

function parsePoint(feature) {
    // creo l'oggetto THREE punto a partire dai dati della feature (feature.geometry.coordinates) e lo aggiungo alla map
    var pointPosition = new THREE.Vector3(
                        feature.geometry.coordinates[0], 
                        feature.geometry.coordinates[1]
                        );
    
    var point = new THREE.Object3D();
    
    point.position = pointPosition;
    
    // aggiungo all'object3D un cerchietto per segnarlo sulla mappa
    point.add(new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ) ));
    
    return point;
    //map.add(point);
}

function parseLineString(feature) {
    
    switch (feature.properties.class) {
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
    $.each(feature.geometry.coordinates, function (key, pointCoordinates){
        geometry.vertices.push( new THREE.Vector3( pointCoordinates[0], pointCoordinates[1] ) );
    });
    
    var line = new THREE.Line( geometry, material );
    
    return line;
    //map.add( line );
}

function parsePolygon(feature) {
    // probabilmente l'utilizzo di una shape risulta l'opzione migliore, specialmente per la creazione degli holes (vedi docs geoJson)
    
    var shape = new THREE.Shape();
    var coordinates = feature.geometry.coordinates;
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
    
    var polygon = new THREE.Mesh(shape.makeGeometry(), new THREE.MeshBasicMaterial({color: 0x367289, transparent: true, opacity: 0.3, side: THREE.DoubleSide}));
    
    polygon.position.z = 0;  // imposta il piano di altezza
    
    return polygon;
    //map.add(polygon);
}


archGen['Point'] = parsePoint;

archGen['LineString'] = parseLineString;

archGen['Polygon'] = parsePolygon;

// archGen['MultiPoint'] = function parseMultiPoint(feature) {
// 	$.each(feature.geometry.coordinates, function (key, pointCoordinates) {
// 		parsePoint(feature);
// 	});
// }

// archGen['MultiLineString'] = function parseMultiLineString(feature) {
// 	$.each(feature.geometry.coordinates, function (key, lineStringCoordinates) {
// 		parseLineString(feature);
// 	});
// }

// archGen['MultiPolygon'] = function parseMultiPolygon(feature) {
// 	$.each(feature.geometry.coordinates, function (key, polygonCoordinates) {
// 		parsePolygon(feature);
// 	});
// }

archGen['MultiPoint'] = function parseMultiPoint(feature) {
    var singlePoint;
    for(var i=0; i<feature.geometry.coordinates;i++) {
        singlePoint = feature;
        singlePoint.geometry.type = "Point";
        singlePoint.geometry.coordinates = feature.geometry.coordinates[i];
        parsePoint(singlePoint);
    }
}

archGen['MultiLineString'] = function parseMultiLineString(feature) {
    var singleLineString;
    var newCoordinates;
    for(var i=0; i<feature.geometry.coordinates.length;i++) {
        newCoordinates = feature.geometry.coordinates[i];
        singleLineString = feature;
        singleLineString.geometry.type = "LineString";
        console.log(newCoordinates);
        console.log(singleLineString);
        singleLineString.geometry.coordinates = newCoordinates;
        //console.log(singleLineString);
        parseLineString(singleLineString);
    }
}