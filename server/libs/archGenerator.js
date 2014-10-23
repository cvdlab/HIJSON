var archGen = {}

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
}

function parseLineString(feature) {
    switch (feature.properties.class) {
        case "external_wall":
            var material = new THREE.LineBasicMaterial({ 
                color: 0xDE935F, 
                linewidth: feature.properties.thickness 
            });
            break;
        case "internal_wall":
            var material = new THREE.LineBasicMaterial({ 
                color: 0xF0C674, 
                linewidth:  feature.properties.thickness 
            });
            break;
        case "door":
            var material = new THREE.LineBasicMaterial({ 
                color: 0xB5BD68, 
                linewidth: feature.properties.thickness 
            });
            break;
        case "level":
            var material = new THREE.LineBasicMaterial({ 
                color:0x8ABEB7, 
                linewidth: feature.properties.thickness 
            });
            break;
        default:
            var material = new THREE.LineBasicMaterial({ 
                color: 0x000000 
            });
    }
    var feaGeo = feature.geometry;

    var geometry = new THREE.Geometry();
    for(var i=0; i<feaGeo.coordinates.length; i++){
        geometry.vertices.push( new THREE.Vector3( feaGeo.coordinates[i][0], feaGeo.coordinates[i][1], 0) );

    };
    var line = new THREE.Line( geometry, material );
    return line;
}

function parsePolygon(feature) {
    switch (feature.properties.class) {
    case "internal_wall":
        var material = new THREE.MeshBasicMaterial({
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.3, 
            side: THREE.DoubleSide
        });
        break;
    case "room":
        var material = new THREE.MeshBasicMaterial({
            color: 0x8ABEB7,
            transparent: true, 
            opacity: 0.3, 
            side: THREE.DoubleSide
        });
        break;
    case "level":
        var material = new THREE.MeshBasicMaterial({
            color: 0x0DDB5F, 
            transparent: true, 
            opacity: 0.01, 
            side: THREE.DoubleSide
        });
        break;
    default:
        var material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.3, 
            side: THREE.DoubleSide
        });
    }
    
    var shape = new THREE.Shape();
    var feaGeo = feature.geometry;
    for (var j = 0; j < feaGeo.coordinates[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(feaGeo.coordinates[0][j][0], feaGeo.coordinates[0][j][1]);
        } else { // altri punti
            shape.lineTo(feaGeo.coordinates[0][j][0], feaGeo.coordinates[0][j][1]);
        }
    }
    
    for (var i = 1; i < feaGeo.coordinates.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < feaGeo.coordinates[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(feaGeo.coordinates[i][j][0], feaGeo.coordinates[i][j][1]);
            } else { // altri punti
                hole.lineTo(feaGeo.coordinates[i][j][0], feaGeo.coordinates[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    
    var polygon = new THREE.Mesh(shape.makeGeometry(), material);
    
    polygon.position.z = 0;  // imposta il piano di altezza
    
    return polygon;
}


archGen['Point'] = parsePoint;

archGen['LineString'] = parseLineString;

archGen['Polygon'] = parsePolygon;

