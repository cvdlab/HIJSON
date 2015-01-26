var Feature = require('./Feature.js');

Feature.inherits(Internal_wall, Feature);

function Internal_wall(feature) {
	Feature.call(this, feature);
}

Internal_wall.prototype.style = { 
							    	color: "#e8e8e8",
    								opacity: 1
    							};

Internal_wall.prototype.get3DModel = function() {
    var material = new THREE.MeshLambertMaterial({ 
        color: this.style.color, 
        side: THREE.DoubleSide
    });
    
	var shape = generatePolygonShape(generateWallGeometry(this));
	
	var extrudedGeometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: this.properties.thickness,
                bevelEnabled: false
            });
            
	var wall = new THREE.Mesh(extrudedGeometry, material);
	var container = new THREE.Object3D();
	container.add(wall);
	container.wall = wall;
	wall.rotation.x += Math.PI/2;
	wall.position.y += this.properties.thickness/2;
    
    return container; 
}

module.exports = Internal_wall;