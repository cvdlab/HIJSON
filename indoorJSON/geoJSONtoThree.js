/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

function getMaxlevel(pathname) {
    var maxLevel = 0;
    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") {
            console.log('FeatureCollection detected');
            $.each( data.features, function( key, feature ) {
                if(feature.properties.level > maxLevel)
                    maxLevel = feature.properties.level;
            });
        } else {
            console.log('ERROR: No FeatureCollection detected');
        }

    });
}
/* main parsing function */
function parseGeoJSON(scene, pathname) {
    
    var map = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") {
            console.log('FeatureCollection detected');
            
            //foreach data.features invocare in base al geometry.type uno dei metodi descritti in seguito, una o più volte (multi-*)
            $.each( data.features, function( key, feature ) {
                switch (feature.geometry.type) {
                    case "Point":
                        parsePoint(map, feature.geometry.coordinates, feature.properties);
                        break;
                    case "LineString":
                        parseLine(map, feature.geometry.coordinates, feature.properties);
                        break;
                    case "Polygon":
                        parsePolygon(map, feature.geometry.coordinates, feature.properties);
                        break;
                    case "MultiPoint":
                        $.each( feature.geometry.coordinates, function ( key, pointCoordinates ) {
                            parsePoint(map, pointCoordinates, feature.properties);
                        });
                        break;
                    case "MultiLineString":
                        $.each( feature.geometry.coordinates, function ( key, pointCoordinates ) {
                            parseLine(map, pointCoordinates, feature.properties);
                        });
                        break;
                    case "MultiPolygon":
                        $.each( feature.geometry.coordinates, function ( key, pointCoordinates ) {
                            parsePolygon(map, pointCoordinates, feature.properties);
                        });
                        break;
                }
            });
        } else {
            console.log('ERROR: No FeatureCollection detected');
        }
    });
    
    scene.add(map);
}

/* auxiliary parsing functions for points, lines and polygons */

function parsePoint(map, coordinates, properties) {
    // creo l'oggetto THREE punto a partire dai dati della feature (feature.geometry.coordinates) e lo aggiungo alla map
    var pointPosition = new THREE.Vector3(
                        coordinates[0], 
                        coordinates[1], 
                        zLevel(properties.level)
                        );
    
    var point = new THREE.Object3D();
    point.position = pointPosition;
    
    // aggiungo all'object3D un cerchietto per segnarlo sulla mappa
    point.add(new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ) ));
    
    map.add(point);
}

function parseLine(map, coordinates, properties) {
    
    switch (properties.geomType) {
        case "wall":
            var material = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 5 });
            break;
        case "door":
            var material = new THREE.LineBasicMaterial({ color: 0xBBBBBB, linewidth: 5 });
            break;
        case "perimeter_wall":
            var material = new THREE.LineBasicMaterial({ color:0x00ffff, linewidth: properties.depth });
            break;
        default:
            var material = new THREE.LineBasicMaterial({ color: 0x000000 });
    }
    
    var geometry = new THREE.Geometry();
    $.each(coordinates, function (key, pointCoordinates){
        geometry.vertices.push( new THREE.Vector3( pointCoordinates[0], pointCoordinates[1], zLevel(properties.level) ) );
    });
    
    var line = new THREE.Line( geometry, material );
    map.add( line );
}

function parsePolygon(map, coordinates, properties) {
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
    
    var polygon = new THREE.Mesh(shape.makeGeometry(), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.3, side: THREE.DoubleSide}));
    
    polygon.position.z = zLevel(properties.level);  // imposta il piano di altezza
    map.add(polygon);
}