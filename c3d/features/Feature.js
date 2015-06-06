var utilities = require('../modules/utilities.js');
var matrixUtilities = require('../modules/matrixUtilities.js');

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
};

Feature.prototype.in_graph = false;
Feature.prototype.in_2D_map = false;

Feature.generateLineString = function generateLineString(geoJSONgeometry) {
	var lineString = new THREE.Geometry();
    for(var i = 0; i < geoJSONgeometry.coordinates.length; i++){
        lineString.vertices.push( new THREE.Vector3( geoJSONgeometry.coordinates[i][0], geoJSONgeometry.coordinates[i][1], 0) );
    }
    return lineString;
};

Feature.generatePolygonShape = function generatePolygonShape(geoJSONgeometry){
	var coords = geoJSONgeometry.coordinates;
	var shape = new THREE.Shape();
    for (var j = 0; j < coords[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j === 0) { // primo punto
            shape.moveTo(coords[0][j][0], coords[0][j][1]);
        } else { // altri punti
            shape.lineTo(coords[0][j][0], coords[0][j][1]);
        }
    }
    for (var i = 1; i < coords.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var k = 0; k < coords[i].length; k++) { //scorro le singole coordinate dei vari perimetri
            if (k === 0) { // primo punto
                hole.moveTo(coords[i][k][0], coords[i][k][1]);
            } else { // altri punti
                hole.lineTo(coords[i][k][0], coords[i][k][1]);
            }  
        }
        shape.holes.push(hole);
    }
    return shape;
};

Feature.generatePolygon = function generatePolygon(geoJSONgeometry) {
    return Feature.generatePolygonShape(geoJSONgeometry).makeGeometry();  
};

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
		if (child.properties.class === 'window') {
			var windowLength = child.geometry.coordinates[1][0];
			var windowHeight = child.properties.height;
			
			var windowHorizontalShift = child.properties.tVector[0];
			var windowVerticalShift = child.properties.tVector[2];
			
			var newHole = [
				[windowHorizontalShift, windowVerticalShift], 
				[windowHorizontalShift+windowLength, windowVerticalShift], 
				[windowHorizontalShift+windowLength, windowVerticalShift+windowHeight], 
				[windowHorizontalShift, windowVerticalShift+windowHeight]
			];
			coordinates.push(newHole);
		}
	}
	return { coordinates: coordinates };
};

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
    el3D.name = 'package_' + model3D.name;
    el3D.visible = false;
    el3D.package = true;
    
    return el3D;

};

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
                    );
};

Feature.prototype.getInfo = function () {
    var feature = this;
    var featureInfoComponent = React.createClass({displayName: "featureInfoComponent",
        render: function() {
            return feature.getCreateElement();
            }
    });
    return featureInfoComponent;

};

Feature.prototype.get3DModel = function() {
	var model = new THREE.Object3D();
	model.name = this.id;
	model.feature = this;
	return model;
};

Feature.prototype.getGraphNode = function(feature) {
    var graphNode;
    if(feature.properties.nodeTVector === undefined) {
        switch(feature.geometry.type) {
            case 'Point':
                graphNode = createNode([0, 0, 0], feature.id, 'subNode');
                break;
            case 'LineString':
                var midPointLineString = utilities.getMidPointLineString(feature.geometry.coordinates);
                graphNode = createNode(midPointLineString, feature.id, 'subNode');
                break;
            case 'Polygon':
                var midPointPolygon = utilities.getMidPointPolygon(feature.geometry.coordinates);
                graphNode = createNode(midPointPolygon, feature.id, 'subNode');
                break;
            default:
                graphNode = createNode([0, 0, 0], feature.id, 'subNode');
        }
    }
    else {
        graphNode = createNode(feature.properties.nodeTVector, feature.id, 'subNode');
    }

    return graphNode;
};
Feature.prototype.getLocalCoordinates = function() {
    var objMatrix = matrixUtilities.objMatrix(this);
    switch(this.geometry.type) {
            case 'Point':
                return matrixUtilities.applyTransformation(this.geometry.coordinates, objMatrix);
                break;
            case 'LineString':
                var newCoordinates = [];
                for(var i in this.geometry.coordinates) {
                    newCoordinates.push(matrixUtilities.applyTransformation(this.geometry.coordinates[i], objMatrix)); 
                }
                return newCoordinates;       
                break;
            case 'Polygon':
                var newCoordinates = [];
                for(var i in this.geometry.coordinates) {
                    for(j in this.geometry.coordinates[i]) { 
                        newCoordinates.push(matrixUtilities.applyTransformation(this.geometry.coordinates[i][j], objMatrix)); 
                    }
                }
                return newCoordinates; 
                break;
            default:

    }       
};
function createNode(tVector, objectId, triangleId) {
    var graphNode = {
        type: 'graph',
        id: 'c_' + triangleId + '_' + objectId,
        geometry: {
            type: 'Point',
            coordinates: [0, 0]
        },
        properties: {
            class: 'graphNode',
            tVector: [0, 0, 0],
            rVector: [0, 0, 0],
            parent: objectId,
            adj: {}
        },
        children: []
    };
    graphNode.properties.tVector = tVector;
    return graphNode;
}


module.exports = Feature;