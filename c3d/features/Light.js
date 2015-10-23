var Feature = require('./Feature.js');

Feature.inherits(Light, Feature);

function Light(feature) {
	Feature.call(this, feature);
}
Light.prototype.style = {
			    			color: "#ffffff",
						    opacity: 0,
                            zIndex: 3,
                            prefix: "fa",
                            markerColor: "cadetblue",
                            icon: "lightbulb-o",
                            iconColor: "yellow"
					    };

Light.prototype.in_graph = true;
Light.prototype.in_2D_map = false;
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

Light.prototype.getProxy = function(idObject) {
	var self = this;
	return {
		state: true,
		name: idObject,
		getState: function() {
			return this.state;
		},
		setState: function(value) {
			state = value;
			console.log('New state for: ' + idObject + ": " + state);
		}
	};
};

Light.prototype.getInfo = function () {
    var feature = this;
    var featureInfoComponent = React.createClass({displayName: "featureInfoComponent",
    	getInitialState: function() {
    		return {
    			on: true
    		};
    	},
    	on_before_hide: function() {

    	},
    	on_hide: function() {

        },
        on_before_show: function() {
			socket.emit('client2server',{
				type: 'getInitialState',
				id: feature.id
			});     	
        },
        on_show: function() {

        },
    	componentWillMount: function() {
    		var self = this;
    		this.on_before_show();
    		socket.on('server2client',function(dataObject) {
    			if(dataObject.type === 'setInitialState') {
    				self.setState({on: dataObject.state});
    				console.log(self.state);
    			}
    		});
    	},
    	onChange: function(e) {
    		var oldState = this.state.on;
    		var newState = !oldState;
    		socket.emit('client2server', {
    			id: feature.id,
    			type: "changeState",
    			value: newState
    		});
    		console.log(newState);
    		this.setState({on: newState});
    	},
		render: function() {
			var root = Feature.prototype.getCreateElement.call(feature);
            var child = React.createElement("dl", {className: "dl-horizontal"}, 
                        	React.createElement("dt", null, "Status: "), 
                        	React.createElement("dd", null,
                        		React.createElement("div", {className: "onoffswitch"},
                        			React.createElement("input", {type: "checkbox", name:"onoffswitch", className:"onoffswitch-checkbox", id:"myonoffswitch", defaultChecked: true,  onChange: this.onChange},
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