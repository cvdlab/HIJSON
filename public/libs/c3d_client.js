var C3D = {};

C3D.handlers = {};
C3D.options3D = {};
C3D.on = function(event, handler) {
    var handlers_list = this.handlers[event];

    if(handlers_list === undefined) {
        handlers_list = this.handlers[event] = [];
    }

    handlers_list.push(handler);
}

C3D.emit = function(event, id) {
    var handlers_list = this.handlers[event];

    if(handlers_list !== undefined) {
        handlers_list.forEach(function (handler) {
            handler(id);
        });
    }
}

C3D.setIndexAndParents = function() {
    var queue = [];
    var feature;
    C3D.index = {};
    C3D.index['building'] = C3D.tree;
    for (var i = 0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while (queue.length > 0) {
        feature = queue.shift();
		C3D.index[feature.id] = feature;

        for(var i = 0; i < feature.children.length; i++) {
            queue.push(feature.children[i]);
        }
    }
    
    for (id in C3D.index) {
    	var feature = C3D.index[id];
		feature.parent = C3D.index[feature.properties.parent];
	}
}

C3D.init2D = function() {
        
        var container2D = $("#container2D");
        var container2DWidth = container2D.width();
        var container2DHeight = container2D.width()/4*3;
        container2D.css('height', container2DHeight);

		C3D.map2D = L.map('container2D').setView([0, 0], 3);
		$(".leaflet-container").css({"background": C3D.config.style.background.color});
	    window.addEventListener('resize', onWindowResize2D, false);
	
	    function onWindowResize2D() {
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        C3D.on('selectFeature', function(idObject) {
		    if(C3D.index[idObject].properties.class === 'level') {
		        C3D.map2D.eachLayer(function(layer) { C3D.map2D.removeLayer(layer); });
		        C3D.index[idObject].layer2D.addTo(C3D.map2D);
		    }
		    if(C3D.index[idObject].properties.class !== 'building') 
		        C3D.map2D.fitBounds(C3D.getRoom(C3D.index[idObject]).layer2D.getBounds());

            orderLayer();
        });
        
        
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
	C3D.scene3D = new THREE.Scene();
	
    var container3D = $('#container3D');
    var container3DWidth = container3D.width();
    var container3DHeight = container3D.width()/4*3;
    container3D.css('height', container3DHeight);
    
    var stats = initStats();
    // create a scene, that will hold all our elements such as objects, cameras and lights.
    
    var scene = C3D.scene3D;
    // create a camera, which defines where we're looking at.
    var camera = new THREE.PerspectiveCamera(45, container3DWidth / container3DHeight, 0.1, 1000);
    C3D.camera3D = camera;
    // create a render and set the size
    var renderer = new THREE.WebGLRenderer();
    
    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
    
    renderer.setClearColor(new THREE.Color(C3D.config.style.background.color, 1.0)); 
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
        computeFPControls();
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
    
    C3D.on('selectFeature', function(idObject) {
	    C3D.index["building"].obj3D.traverse(function(object) {
	        object.visible = false;
	    });
	    
	    C3D.index[idObject].obj3D.traverse(function(object) {
	        object.visible = true;
	    });
	    
	    for(var i in C3D.index) {
	        var elementClass = C3D.index[i].properties.class;
	        if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
	            if($.inArray(idObject, C3D.index[i].properties.connections) !== -1) {
	                C3D.index[i].obj3D.traverse(function(object) { object.visible = true; });
	            }   
	        }
	    } 
    });
    C3D.on('startFPS', function() {
        controls = new THREE.PointerLockControls(camera);
        scene.add(controls.getObject());
        container3D.requestPointerLock = container3D.requestPointerLock || container3D.mozRequestPointerLock || container3D.webkitRequestPointerLock;
        if (/Firefox/i.test(navigator.userAgent)) {
          var fullscreenchange = function(event) {
            if (container3D.fullscreenElement === element || container3D.mozFullscreenElement === element || container3D.mozFullScreenElement === container3D) {
              container3D.removeEventListener('fullscreenchange', fullscreenchange);
              container3D.removeEventListener('mozfullscreenchange', fullscreenchange);
              element.requestPointerLock();
            }
          }
          container3D.addEventListener('fullscreenchange', fullscreenchange, false);
          container3D.addEventListener('mozfullscreenchange', fullscreenchange, false);
          container3D.requestFullscreen = container3D.requestFullscreen || container3D.mozRequestFullscreen || container3D.mozRequestFullScreen || container3D.webkitRequestFullscreen;
          container3D.requestFullscreen();
        } else {
          container3D.requestPointerLock();
        }
    });
    function computeFPControls() {
        controls.isOnObject(false);
        rayMove.ray.origin.copy(controls.getObject().position);
        rayMove.ray.origin.y -= 4;
        var intersections = rayMove.intersectObjects(objects);
        if (intersections.length > 0) {
          var distance = intersections[0].distance;
          if (distance > 0 && distance < 4) {
            controls.isOnObject(true);
          }
    }
    controls.update();
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
        if(feature.properties.class in C3D.generator3D) {
	        
            var el3D = C3D.generator3D[feature.properties.class](feature);
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

        for(var i=0;i< feature.children.length;i++) {
            queue.push(feature.children[i]);
        }
    }
    C3D.scene3D.add(C3D.index["building"].obj3D);
} // Chiude generate3DModel

/*
    Funzione che genera il modello 2D per Leaflet
*/ 

C3D.generate2DModel = function() {
	
	for(geoJSONlevel in C3D.geoJSONmap) {
		var layer = L.geoJson(C3D.geoJSONmap[geoJSONlevel], {
																style: styleFunction, 
																pointToLayer: furnitureMarker,
                                                                onEachFeature: onEachFeature
															});
		C3D.index[geoJSONlevel].layer2D = layer;
		var markers = new L.featureGroup();
		markers.addTo(C3D.index[geoJSONlevel].layer2D);
		C3D.index[geoJSONlevel].layer2D.userMarkers = markers;
	}

	
    C3D.index['level_0'].layer2D.addTo(C3D.map2D);

	C3D.map2D.fitBounds(C3D.index['level_0'].layer2D.getBounds());
    orderLayer();	
	function styleFunction(feature) {
		return C3D.config.style[feature.properties.class];
	}
	
	function furnitureMarker(feature, latlng) {
		
		if (C3D.config.style[feature.properties.class] !== undefined) {
			var markerIcon = L.AwesomeMarkers.icon(C3D.config.style[feature.properties.class]);
		} else {
			var markerIcon = L.AwesomeMarkers.icon({ icon: "asterisk" });
		}
		
		return L.marker(latlng, {icon: markerIcon});
	}
	function onEachFeature(feature, layer) {
        layer.on({
            //mouseover: highlightFeature,
            //mouseout: resetHighlight,
            click: selectFeature
        });
        C3D.index[feature.id].layer2D = layer;
    }

    function selectFeature(e) {
        C3D.emit('selectFeature', e.target.feature.id);
    }


    // function highlightFeature(feature, layer) {
    //         var layer = e.target;
    //         layer.setStyle({
    //             weight: 5,
    //             color: '#666',
    //             dashArray: '',
    //             fillOpacity: 1
    //         });
    //         if(!L.Browser.ie && L.Browser.opera) {
    //             layer.bringToFront();
    //         }
    // }

    // function resetHighlight(e) {
    //     C3D.geojson.resetStyle(e.target);
    // }
}	// Chiude generate2DModel

function getActualLevelId() {
    var id;
    for(idLayer in C3D.map2D._layers){
        layer = C3D.map2D._layers[idLayer];
        if(layer.feature !== undefined) {
            if(layer.feature.properties.class === 'level')
            {
                id = layer.feature.id;
            }
        }
    }   
    return id;
}

function orderLayer() {

    var orderClass = ['room','external_wall','internal_wall','door'];
    while(orderClass.length !== 0) {
        var classElement = orderClass.shift();
        for(idLayer in C3D.map2D._layers) {
            console.log(idLayer);
            layer = C3D.map2D._layers[idLayer];
            if(layer.feature !== undefined) {
                if(layer.feature.properties.class === classElement)
                {
                    console.log(classElement);
                    layer.bringToFront();
                }
            }     
        }
    }
}
C3D.generator3D = {};

C3D.generator3D['server'] = function (feature) {

    if(feature.properties.dimensions === undefined)
    {
        var dimensions = [1,1,2];
    }
    else
    {
        var dimensions = feature.properties.dimensions;
    }
    
    var geometry = new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
    var material = new THREE.MeshLambertMaterial( {color: 0x008080} );
    
    var server = new THREE.Mesh(geometry, material);

    server.position.z += dimensions[2]/2;
    
    return server;
};

C3D.generator3D['surveillanceCamera'] = function(feature) {
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

    
    var surveillanceCamera = new THREE.Object3D();
    surveillanceCamera.add(model);
    return surveillanceCamera;
}

C3D.generator3D['hotspot'] = function(feature) {
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

C3D.generator3D['light'] = function(feature) {
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

C3D.generator3D['antenna'] = function(feature) {
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

function generateLineString(geometry) {
	var lineString = new THREE.Geometry();
    for(var i = 0; i < geometry.coordinates.length; i++){
        lineString.vertices.push( new THREE.Vector3( geometry.coordinates[i][0], geometry.coordinates[i][1], 0) );

    }
    return lineString;
}

function generatePolygon(geometry) {
	
	var shape = new THREE.Shape();
    for (var j = 0; j < geometry.coordinates[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(geometry.coordinates[0][j][0], geometry.coordinates[0][j][1]);
        } else { // altri punti
            shape.lineTo(geometry .coordinates[0][j][0], geometry.coordinates[0][j][1]);
        }
    }
    
    for (var i = 1; i < geometry.coordinates.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < geometry.coordinates[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(geometry.coordinates[i][j][0], geometry.coordinates[i][j][1]);
            } else { // altri punti
                hole.lineTo(geometry.coordinates[i][j][0], geometry.coordinates[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    
    var polygon = shape.makeGeometry();
    
    return polygon;
}

function generateWallGeometry(wallFeature) {
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
	return {
		coordinates: coordinates
	}
}

C3D.generator3D['external_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
    	color: C3D.config.style.external_wall.color, 
        side: THREE.DoubleSide
	});
	
	var geometry = generatePolygon(generateWallGeometry(feature));
	var wall = new THREE.Mesh(geometry, material);
	
	var container = new THREE.Object3D();
	container.add(wall);
	wall.rotation.x += Math.PI/2;
	return container;	
}

C3D.generator3D['internal_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.internal_wall.color, 
        side: THREE.DoubleSide
    });
    
	var geometry = generatePolygon(generateWallGeometry(feature));
	var wall = new THREE.Mesh(geometry, material);
	
	var container = new THREE.Object3D();
	container.add(wall);
	wall.rotation.x += Math.PI/2;
	return container;
}

C3D.generator3D['door'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.door.color, 
        linewidth: feature.properties.thickness 
    });
	return new THREE.Line(generateLineString(feature.geometry), material);
}

C3D.generator3D['level'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color:C3D.config.style.level.color, 
        linewidth: feature.properties.thickness 
    });
	return new THREE.Line(generateLineString(feature.geometry), material);
}

C3D.generator3D['room'] = function(feature) {
    var material = new THREE.MeshBasicMaterial({
        color: C3D.config.style.room.fillColor,
        transparent: true, 
        opacity: 0.9, 
        side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(generatePolygon(feature.geometry), material);
}

C3D.getRoom = function(obj) {
    var ancestor = obj;
    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
        console.log(ancestor);
        while(ancestor.properties.class !== 'room') {
            ancestor = ancestor.parent;
        }
    }
    return ancestor;
}