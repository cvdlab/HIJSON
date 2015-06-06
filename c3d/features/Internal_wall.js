var Feature = require('./Feature.js');

Feature.inherits(Internal_wall, Feature);

function Internal_wall(feature) {
	Feature.call(this, feature);
}

Internal_wall.prototype.style = { 
							    	color: "#E9E0D6",
    								opacity: 1,
                                    zIndex: 5
    							};

Internal_wall.prototype.in_graph = false;
Internal_wall.prototype.in_2D_map = true;

Internal_wall.prototype.get3DModel = function() {
    var material = new THREE.MeshLambertMaterial({ 
        color: this.style.color, 
        side: THREE.DoubleSide
    });
    
	var shape = Feature.generatePolygonShape(Feature.generateWallGeometry(this));
	
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
    
    wall.name = this.id;
    container.name = 'package_' + this.id;
    return container; 
};

module.exports = Internal_wall;