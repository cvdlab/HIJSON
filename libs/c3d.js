var C3D = {
    tree: {
        id: '',
        children: []
    },
    index: {},
    path_architecture:  'json_input/architecture.json',
    path_furnitures: 'json_input/furnitures.json',
    scene: new THREE.Scene(),
	map: {},
    furnitureGen: {}
}

/*
    Funzione che genera albero ed indice a partire dai file json
 */ 

C3D.parseJSON = function() {
    C3D.index['building'] = C3D.tree;
    function readJSON(typeJSON, path) {
        $.getJSON(path, function(data) { 
            if (data.type == "FeatureCollection") 
            {
                console.log('FeatureCollection detected for '+typeJSON+'.');
                if (typeJSON === "architecture") 
                {
                    C3D.tree.id = data.id;
                    C3D.tree.properties = data.properties;
                }
                
                //THREE.FogExp2( hex, density );reach data.features
                $.each( data.features, function( key, feature ) 
                {
                    var obj = {};
                    obj.id = feature.id;
                    obj.parent = C3D.index[feature.properties.parent];
                    obj.parent.children.push(obj);
                    obj.children = [];
                    obj.geometry = feature.geometry;
                    obj.properties = feature.properties;
                    C3D.index[feature.id] = obj;
                });
                
            } 
            else 
            {   
                var err = 'ERROR: No FeatureCollection detected' 
                return err;
            }
        });
    };

    readJSON('architecture', C3D.path_architecture);
    readJSON('furnitures', C3D.path_furnitures);      


};

C3D.init2D = function() {
        
        var container2D = $("#model2D");
        var container2DWidth = container2D.width();
        var container2DHeight = container2D.width()/4*3;
        container2D.css('height', container2DHeight);



	    window.addEventListener( 'resize', onWindowResize2D, false );
	
	    function onWindowResize2D(){
	        
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        
        C3D.map = L.map('model2D').setView([0, 0], 3);
        
        
		//Quando si posizionera' sulla mappa 
        // L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        //     maxZoom: 18,
        //     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        //         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        //         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        //     id: 'examples.map-i875mjb7'
        // }).addTo(map);

}

/*
    Funzione di inizializzazione three js
 */ 

C3D.init3D = function() {
    
    var container3D = $('#model3D');
    var container3DWidth = container3D.width();
    var container3DHeight = container3D.width()/4*3;
    container3D.css('height', container3DHeight);
    
    
    var stats = initStats();
    // create a scene, that will hold all our elements such as objects, cameras and lights.
    var scene = this.scene;
    // create a camera, which defines where we're looking at.
    var camera = new THREE.PerspectiveCamera(45, container3DWidth / container3DHeight, 0.1, 1000);
    // create a render and set the size
    var renderer = new THREE.WebGLRenderer();
    
    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
    
    renderer.setClearColor(new THREE.Color(0x1D1F21, 1.0)); 
    renderer.setSize(container3DWidth, container3DHeight);
    renderer.shadowMapEnabled = true;
    
    // position and point the camera to the center of the scene
    camera.position.set(-40,-40,40);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(scene.position);
    
    // add subtle ambient lighting
    var ambiColor = "#1c1c1c";
    var ambientLight = new THREE.AmbientLight(ambiColor);
    scene.add(ambientLight);
    
    container3D.append(renderer.domElement);
    // add axis helper
    var axisHelper = new THREE.AxisHelper(3);
    scene.add(axisHelper);


      var controls = new function () {
        //this.showAxisHelper = true;
        //this.enableTrackball = false;
        this.visibleRoom = "building";
        
        this.redraw = function() {
            C3D.index["building"].obj3D.traverse(function(object) {
                object.visible = false;
            });
            C3D.index[controls.visibleRoom].obj3D.traverse(function(object) {
                object.visible = true;
            });
            for(var i in C3D.index) {
                var elementClass = C3D.index[i].properties.class;
                if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
                    if($.inArray(controls.visibleRoom, C3D.index[i].properties.connections) !== -1) {
                        C3D.index[i].obj3D.traverse(function(object) { object.visible = true; });
                    }
                }
            }            
        }
    };
    
    //var enableTrackball = false;
    var gui = new dat.GUI();   
    
    /*
	gui.add(controls, 'showAxisHelper').onChange(function (value) {
        axisHelper.visible = value;
    });

	gui.add(controls, 'enableTrackball').onChange(function (value) {
        enableTrackball = value;
    });
	*/
	
    var rooms = ["building"];
    for(var key in C3D.index) {
        var element = C3D.index[key];
        if(element.properties.class==="room" ||element.properties.class==="level") {
            rooms.push(element.id);
        }
    }
    gui.add(controls, "visibleRoom", rooms).onChange(controls.redraw);
    
    window.addEventListener( 'resize', onWindowResize3D, false );

    function onWindowResize3D(){
        
        container3DWidth = container3D.width();
        container3DHeight = container3D.width()/4*3;
        container3D.css('height', container3DHeight);
    
        camera.aspect = container3DWidth / container3DHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize( container3DWidth, container3DHeight );
    
    }
    
    render();
    
    function render() {
        stats.update();
        //if (enableTrackball) trackballControls.update();
        trackballControls.update();
        
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    
    function initStats() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms
        container3D.append(stats.domElement);
        return stats;
    }

}

/*
    Funzione che genera il modello 3D
 */ 

C3D.generate3DModel = function() {
    var queue = [];
    var feature;
    
    C3D.index["building"].obj3D = new THREE.Object3D();

    for (var i=0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    while (queue.length>0) {
        feature = queue.shift();
        if((feature.geometry.type in archGen) && (!(feature.properties.class in C3D.furnitureGen))) {
            //console.log('(3D) Oggetto in fase di generazione: ' + feature.id);
            var el3D = archGen[feature.geometry.type](feature);
            feature.obj3D = el3D;


            if (feature.properties.rVector !== undefined) {
                var conv = Math.PI/180;
                var rotation = [
                            feature.properties.rVector[0]*conv, 
                            feature.properties.rVector[1]*conv,
                            feature.properties.rVector[2]*conv];
                el3D.rotation.set(rotation[0], rotation[1], rotation[2]);
            }

            if (feature.properties.tVector !== undefined) {
                el3D.position.x += feature.properties.tVector[0];
                el3D.position.y += feature.properties.tVector[1];
                el3D.position.z += feature.properties.tVector[2];
            }
            
            
            C3D.index[feature.parent.id].obj3D.add(el3D);
        }

        else if (feature.properties.class in C3D.furnitureGen) {
            //console.log('(3D) Oggetto in fase di generazione: ' + feature.id + " in furnitures");
            
            var el3D = C3D.furnitureGen[feature.properties.class](feature);
            feature.obj3D = el3D;


            if (feature.properties.rVector !== undefined) {
                var conv = Math.PI/180;
                var rotation = [
                            feature.properties.rVector[0]*conv, 
                            feature.properties.rVector[1]*conv,
                            feature.properties.rVector[2]*conv];
                el3D.rotation.set(rotation[0], rotation[1], rotation[2]);
            }

            if (feature.properties.tVector !== undefined) {
                el3D.position.x += feature.properties.tVector[0];
                el3D.position.y += feature.properties.tVector[1];
                el3D.position.z += feature.properties.tVector[2];
            }
            
            C3D.index[feature.parent.id].obj3D.add(el3D);
        }
        else {
            var err = 'ERROR: Class: ' + feature.geometry.type + 'not recognized.';
            return err;
        }

        for(var i=0;i< feature.children.length;i++) {
            queue.push(feature.children[i]);
        }
    }
    C3D.scene.add(C3D.index["building"].obj3D);
} // Chiude generate3DModel

/*
    Funzione che genera il modello 2D per Leaflet
*/ 
 
C3D.generate2DModel = function() {

	var geoJSONmap = {};
    var includedArchitectureClasses = ['level','room','door', 'internal_wall', 'external_wall'];
    var includedFurtituresClasses = ['server','surveillanceCamera'];
	
	var includedClasses = includedArchitectureClasses.concat(includedFurtituresClasses);
    var queue = [];
    var obj;

	var newObj = {};
	
    for(var i=0;i< C3D.tree.children.length;i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while(queue.length>0) {
        obj = queue.shift();
        if($.inArray(obj.properties.class, includedClasses)> -1)
        {
            //console.log('(2D) Oggetto in fase di generazione: ' + obj.id);
			var level = getLevel(obj);			
			
			if(!(level in geoJSONmap)) {

				geoJSONmap[level] = {
					"type": "FeatureCollection",
					"features": []
				}

			}
			
			var newObj = {};
			
			newObj.type = "Feature";
			newObj.id = obj.id;
			newObj.geometry = {
				"type": obj.geometry.type,
				"coordinates": absoluteCoords(obj)
			};
			newObj.properties = {};
			
			geoJSONmap[level].features.push(newObj);
		}
		
		for(var i=0;i< obj.children.length;i++) {
			queue.push(obj.children[i]);
        }
		
	}
	
	for(geoJSONlevel in geoJSONmap) {
		C3D.index[geoJSONlevel].layer2D = L.geoJson(geoJSONmap[geoJSONlevel]);
	}
	
	C3D.index['level_0'].layer2D.addTo(C3D.map);
	C3D.map.fitBounds(C3D.index['level_0'].layer2D.getBounds());

	function fromGradesToRadians(rVect) {
		for(var i = 0; i < rVect.length; i++) {
			rVect[i] = rVect[i] * Math.PI / 180;
		}
	}
	
	function absoluteCoords(obj) {
		var tVect = [obj.properties.tVector[0], obj.properties.tVector[1]];
	
		var oldCoords;
		var newCoords = [];
		var ancestor = C3D.index[obj.parent.id];
		
		if(obj.properties.rVector !== undefined) {
			var rVect = [obj.properties.rVector[0], obj.properties.rVector[1], obj.properties.rVector[2]];
			fromGradesToRadians(rVect);
		}
		
		while(ancestor.properties.class !== 'building') {
			tVect[0] += ancestor.properties.tVector[0];
			tVect[1] += ancestor.properties.tVector[1];
			ancestor = C3D.index[ancestor.parent.id];
		}
		//console.log(obj.geometry.type);
		switch (obj.geometry.type) {
	        case "Point":
	            return tVect;
	            break;
	        case "LineString": 
	        	oldCoords = obj.geometry.coordinates;
	        	for (var i = 0; i < oldCoords.length; i++)
	        	{
	        		var newX = ((oldCoords[i][0] * Math.cos(rVect[2])) - (oldCoords[i][1] * Math.sin(rVect[2]))) + tVect[0];
	        		var newY = ((oldCoords[i][0] * Math.sin(rVect[2])) + (oldCoords[i][1] * Math.cos(rVect[2]))) + tVect[1];
		        	newCoords.push([newX, newY]);
	        	}
	        	
	            return newCoords;
	            break;
	        case "Polygon":
	        	oldCoords = obj.geometry.coordinates;
	        	for (var i = 0; i < oldCoords.length; i++)
	        	{
		        	var newPerimeter = [];
		        	for (var j = 0; j < oldCoords[i].length; j++)
		        	{
	
		        		newPerimeter.push([oldCoords[i][j][0]+tVect[0],oldCoords[i][j][1]+tVect[1]]);
		        	}
		        	newCoords.push(newPerimeter);
		        }
	            return newCoords;
	            break;
	        default:
	        	return undefined;
	        	break;
	    }
	}
	
	function getLevel(obj) {
		var ancestor = obj;
		while (ancestor.properties.class !== 'level')
		{
			ancestor = ancestor.parent;
		}
		if (ancestor.properties.class === 'building')
		{
			return undefined;
		}
		else
		{
			return ancestor.id;
		}
	}
}// Chiude generate2DModel

/*
C3D.difference = function() {
    var a = [ [0, 0], [1, 0], [1, 50], [0, 50], [0, 0]];
    var b = [ [0, 10], [1, 10], [1, 20], [0, 20], [0, 10] ];


    var v1_1 = a.shift();
    var v2_1 = a.shift();
    var v3_1 = b.shift();
    var v4_1 = b.shift();

    var w1 = [];
    w1.push(v1_1,v2_1,v4_1,v3_1,v1_1);
    console.log(w1);

    var v1_2 = a.shift(); console.log('v1: ' + v1_2);
    var v2_2 = a.shift(); console.log('v2: ' + v2_2);
    var v3_2 = b.shift(); console.log('v3: ' + v3_2);
    var v4_2 = b.shift(); console.log('v4: ' + v4_2);

    var w2 = [];
    w2.push(v4_2,v3_2,v1_2,v2_2,v4_2);
    console.log(w2);
}
*/


C3D.furnitureGen['server'] = function parseServer(feature) {

    if(feature.properties.dimensions === undefined)
    {
        var dimensions = [1,1,2];
    }
    else
    {
        var dimensions = feature.properties.dimensions;
    }
    
    var geometry = new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
    var material = new THREE.MeshBasicMaterial( {color: 0x008080} );
    
    var server = new THREE.Mesh(geometry, material);

    server.position.z += dimensions[2]/2;
    
    return server;
};


C3D.furnitureGen['surveillanceCamera'] = function parseSurveillanceCamera(feature) {
    var radius = 0.2;
    var widthSegments = 32;
    var heightSegments = 32;
    var phiStart = 0;
    var phiLength = -Math.PI;
    var thetaStart = 0;
    var thetaLength = Math.PI;

    var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    
    var model = new THREE.Mesh( geometry, material );

    model.position.z = model.position.z + levelHeight - radius/2;
    
    var surveillanceCamera = new THREE.Object3D();
    surveillanceCamera.add(model);
    return surveillanceCamera;
}

C3D.furnitureGen['hotspot'] = function parseHotspot(feature) {
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    var geometry = new THREE.BoxGeometry(width, depth, height);
    var material = new THREE.MeshBasicMaterial( {color: 0x0000ff});
    
    var model = new THREE.Mesh( geometry, material );
    model.position.z = model.position.z + levelHeight - height/2;
    
    var hotspot = new THREE.Object3D();
    hotspot.add(model);
    return hotspot;
};

C3D.furnitureGen['light'] = function parseLight(feature) {
    var radius = 0.05;
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    var length  = 2;

    var geometry = new THREE.CylinderGeometry( radius, radius, length, 32);
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    var model = new THREE.Mesh( geometry, material);
    
    model.position.z = model.position.z + levelHeight - radius;

    var light = new THREE.Object3D();

    light.add(model);
    return light;
};

C3D.furnitureGen['antenna'] = function parseAntenna(feature) {
    var radius_down = 0.02;
    var radius_up = 0.01;
    var length = 0.3;
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    
    var geometry = new THREE.CylinderGeometry( radius_down, radius_up, length, 32);
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var model = new THREE.Mesh( geometry, material);

    model.rotation.x = Math.PI/2;
    
    model.position.z = model.position.z + levelHeight - length;

    var antenna = new THREE.Object3D();

    antenna.add(model);
    return antenna;
};



