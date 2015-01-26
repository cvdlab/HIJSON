var Feature = require('./Feature.js');

Feature.inherits(Level, Feature);

function Level(feature) {
	Feature.call(this, feature);
}

Level.prototype.style = {
			    			color: "#ffffff",
						    opacity: 0
					    };

Level.prototype.get3DModel = function() {
    var material = new THREE.MeshLambertMaterial({ 
        color: this.style.color, 
        side: THREE.DoubleSide
    });
    
    var shape = generatePolygonShape(this.geometry);
    
    var extrudedGeometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: this.properties.thickness,
                bevelEnabled: false
    });
            
    var floor = new THREE.Mesh(extrudedGeometry, material);
    var container = new THREE.Object3D();
    container.add(floor);
    container.floor = floor;
	floor.position.z -= this.properties.thickness-0.01;
    
    return container;  	
}

module.exports = Level;