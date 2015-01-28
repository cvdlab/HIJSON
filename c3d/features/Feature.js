var utilities = require('../modules/utilities.js')
var React = require('react');

function Feature(feature) { 
	this.id = feature.id;
	this.type = 'Feature';
	this.geometry = feature.geometry;
	this.properties = feature.properties;
	this.parent = {};
	this.children = [];
}

Feature.inherits = function inherits(Child, Parent) {
	var F = function() {};
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
}

Feature.generateLineString = function generateLineString(geoJSONgeometry) {
	var lineString = new THREE.Geometry();
    for(var i = 0; i < geoJSONgeometry.coordinates.length; i++){
        lineString.vertices.push( new THREE.Vector3( geoJSONgeometry.coordinates[i][0], geoJSONgeometry.coordinates[i][1], 0) );
    }
    return lineString;
}

Feature.generatePolygonShape = function generatePolygonShape(geoJSONgeometry){
	var coords = geoJSONgeometry.coordinates;
	var shape = new THREE.Shape();
    for (var j = 0; j < coords[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(coords[0][j][0], coords[0][j][1]);
        } else { // altri punti
            shape.lineTo(coords[0][j][0], coords[0][j][1]);
        }
    }
    for (var i = 1; i < coords.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < coords[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(coords[i][j][0], coords[i][j][1]);
            } else { // altri punti
                hole.lineTo(coords[i][j][0], coords[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    return shape;
}

Feature.generatePolygon = function generatePolygon(geoJSONgeometry) {
    return Feature.generatePolygonShape(geoJSONgeometry).makeGeometry();  
}

Feature.generateWallGeometry = function generateWallGeometry(wallFeature) {
	var wallLength = wallFeature.geometry.coordinates[1][0];
	var wallHeight = wallFeature.parent.properties.height;
	var coordinates = [
		[ [0, 0], [wallLength, 0], [wallLength, wallHeight], [0, wallHeight] ]
	];
	for (var i = 0; i < wallFeature.children.length; i++) {
		var child = wallFeature.children[i];
		if (child.properties.class === 'door') {
			var doorLength = child.geometry.coordinates[1][0];
//			var doorHeight = child.properties.height;
			var doorHeight = 2;
			var doorShift = child.properties.tVector[0];
			var hole = [
				[doorShift,0], [doorShift+doorLength, 0], [doorShift+doorLength, doorHeight], [doorShift, doorHeight]	
			];
			coordinates.push(hole);
		}
	}
	return { coordinates: coordinates }
}

Feature.packageModel = function packageModel(model3D) {
    var geometry;
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0} );
    var el3D;
    var feature = model3D.feature;
    if(feature.geometry.type === "Polygon") {

        var shape = Feature.generatePolygonShape(feature.geometry);
        geometry = shape.extrude({
            curveSegments: 1,
            steps: 1,
            amount: feature.properties.height,
            bevelEnabled: false
        });
    
        el3D = new THREE.Mesh( geometry, material );
        el3D.add(model3D);
    }
    else {
        var bbox = new THREE.BoundingBoxHelper(model3D, 0xff0000);
        bbox.update();
        var bboxSize = bbox.box.size();
        geometry = new THREE.BoxGeometry( bboxSize.x, bboxSize.y, bboxSize.z );
        el3D = new THREE.Mesh( geometry, material );

        el3D.add(model3D);

        var bboxCentroid = utilities.getCentroid(bbox);
        model3D.position.set(-bboxCentroid.x,-bboxCentroid.y,-bboxCentroid.z);    
        el3D.position.z = bbox.box.size().z/2;
        
    }
    el3D.package = true;
    
    return el3D;

}

Feature.prototype.getCreateElement = function() {
    var feature = this;
    var x = feature.obj3D.position.x;
    var y = feature.obj3D.position.y;
    var position = '[' + x + '; ' +  y + ']';
    return (React.createElement("dl", {className: "dl-horizontal"}, 
                        React.createElement("dt", null, "id:"), 
                        React.createElement("dd", null, feature.id), 
                        React.createElement("dt", null, "class:"), 
                        React.createElement("dd", null, feature.properties.class), 
                        React.createElement("dt", null, "Position"), 
                        React.createElement("dd", null, position)
                    )
                    )
}

Feature.prototype.getInfo = function () {
    var feature = this;
    var featureInfoComponent = React.createClass({displayName: "featureInfoComponent",
        render: function() {
            return feature.getCreateElement();
            }
    });
    return featureInfoComponent;

}

module.exports = Feature;