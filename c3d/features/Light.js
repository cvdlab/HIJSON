var Feature = require('./Feature.js');

Feature.inherits(Light, Feature);

function Light(feature) {
	Feature.call(this, feature);
}
Light.prototype.style = {
			    			color: "#ffffff",
						    opacity: 0,
                            zIndex: 3
					    };

Light.prototype.in_graph = true;
Light.prototype.in_2D_map = true;
Light.prototype.get3DModel = function() {
	var light = new THREE.Object3D();
	var height = 0.05;
	var width = 0.6;
	var externalPlaneGeometry = new THREE.PlaneGeometry(width,width);
	var externalPlaneMaterial = new THREE.MeshLambertMaterial({
	                                                            color:0xE7E6DD,
	                                                            side: THREE.DoubleSide
	                                                        });

	var plane3D = new THREE.Mesh(externalPlaneGeometry, externalPlaneMaterial);
	plane3D.name = "plane3D_" + this.id;
	plane3D.position.z += height;
	light.add(plane3D);
	var groupNeon = new THREE.Object3D();
	groupNeon.name = "groupNeon_" + this.id;
	var neonMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff} );
	var neonGeometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.58, 32 );
	var translations = [(-0.075*3), (-0.075), (0.075), (0.075*3)];
	for(var i in translations)
	{
	    var neon = new THREE.Mesh( neonGeometry, neonMaterial );
	    neon.name = "neon"+i+"_" + this.id;
	    neon.position.x += translations[i];
	    groupNeon.add(neon);
	}
	light.add(groupNeon);
	light.name = this.id;
	light.feature = this;
	var model = Feature.packageModel(light);

	return model;
};

Light.prototype.getInfo = function () {
    var feature = this;
    var featureInfoComponent = React.createClass({displayName: "featureInfoComponent",
        render: function() {

            var root = Feature.prototype.getCreateElement.call(feature);
            var child = React.createElement("dl", {className: "dl-horizontal"}, 
                        	React.createElement("dt", null, "Status: "), 
                        	React.createElement("dd", null,
                        		React.createElement("div", {className: "onoffswitch"},
                        			React.createElement("input", {type: "checkbox", name:"onoffswitch", className:"onoffswitch-checkbox", id:"myonoffswitch", defaultChecked: true},
                        				React.createElement("label", {className:"onoffswitch-label", htmlFor:"myonoffswitch"},
                        					React.createElement("span", {className: "onoffswitch-inner"}, null),
                            				React.createElement("span", {className: "onoffswitch-switch"}, null)
                        				)
                        			)
                        		)
                        	)
                        );
            var result = React.createElement("div", null, root, child);
            return result;
    	}
    });

    return featureInfoComponent;
};

module.exports = Light;