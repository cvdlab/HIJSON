var C3D = {};

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
		
	    window.addEventListener('resize', onWindowResize2D, false);
	
	    function onWindowResize2D() {
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        
        
        
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

      var controls = new function () {

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
    
    
    var gui = new dat.GUI();   
    
    var rooms = ["building"];
    for(var key in C3D.index) {
        var element = C3D.index[key];
        if(element.properties.class === "room" || element.properties.class === "level") {
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
        if(feature.properties.class in C3D.generator3D) {
            //console.log('(3D) Oggetto in fase di generazione: ' + feature.id);
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
        } else {
            var err = 'ERROR: Class: ' + feature.geometry.type + 'not recognized.';
            return err;
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
		C3D.index[geoJSONlevel].layer2D = L.geoJson(C3D.geoJSONmap[geoJSONlevel], {style: styleFunction});
	}
	
	C3D.index['level_0'].layer2D.addTo(C3D.map2D);
	C3D.map2D.fitBounds(C3D.index['level_0'].layer2D.getBounds());
	
	function styleFunction(feature) {
		return C3D.config.style[feature.properties.class];
	}
	
}	// Chiude generate2DModel

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
    var material = new THREE.MeshBasicMaterial( {color: 0x008080} );
    
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

    model.position.z = model.position.z + levelHeight - radius/2;
    
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

C3D.generator3D['external_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
    	color: C3D.config.style.external_wall.color, 
		linewidth: feature.properties.thickness 
	});
	return new THREE.Line(generateLineString(feature.geometry), material);	
}

C3D.generator3D['internal_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.internal_wall.color, 
        linewidth:  feature.properties.thickness 
    });
	return new THREE.Line(generateLineString(feature.geometry), material);
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
        opacity: 0.3, 
        side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(generatePolygon(feature.geometry), material);
}
