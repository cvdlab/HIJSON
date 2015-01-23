// template for js modules that works both in node and browsers

// (1) initialize library object (namespace)
var featureFactory = {};

// (2) import any dependencies (in browser must be included before this file)
// example: var dependency = dependency || require('./dependency');

(function(){
	var featureClasses = {};
	// (3) library properties and functions (public an private)
	var generateFeature = function(feature) {
		var featureClass = capitaliseFirstLetter(feature.properties.class);
		return new featureClasses[featureClass](feature);	
	}
	
	function capitaliseFirstLetter(featureClass) {
	    return featureClass.charAt(0).toUpperCase() + featureClass.slice(1);
	}

	var inherits = function(Child, Parent) {
		var F = function() {};
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.prototype.constructor = Child;
	}

	function Feature(feature) { 
		this.id = feature.id;
		this.type = 'Feature';
		this.geometry = feature.geometry;
		this.properties = feature.properties;
		this.parent = {};
		this.children = [];
	}

	function Server(feature) {
		Feature.call(this, feature);
	}
	

	inherits(Server, Feature);
	
	featureClasses.Server = Server;	
	Server.prototype.style = {
								"weight": 0,
							    "fillColor": "#f49530",
							    "fillOpacity": 1
							};

	Server.prototype.get3DModel = function() {
		var coords = this.geometry.coordinates;
		var geometry = new THREE.BoxGeometry(coords[0][2][0], coords[0][2][1], this.properties.height);
		var material = new THREE.MeshLambertMaterial( {color: 0xf49530} );
		var wireMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, wireframe: true, wireframeLinewidth: 2} );
		var server = new THREE.Mesh(geometry, material);

		server.receiveShadow = true;
		server.castShadow = true;
		var model = packageModel(server);

		return model;
	}

	function SurveillanceCamera(feature) {
		Feature.call(this, feature);
	}

	inherits(SurveillanceCamera, Feature);
	featureClasses.SurveillanceCamera = SurveillanceCamera;

	SurveillanceCamera.prototype.style = {
										    prefix: "fa",
										    icon: "video-camera"
	    								};
	SurveillanceCamera.prototype.get3DModel = function() {
		var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
		var camera = new THREE.Object3D();

		//Creazione corpo macchina
		var widthBody = 0.2;
		var depthBody = 0.1;
		var heightBody = 0.1;

		var bodyCameraGeometry = new THREE.BoxGeometry(widthBody, depthBody, heightBody);
		var bodyCamera = new THREE.Mesh( bodyCameraGeometry, material );

		//Creazione obiettivo
		var radiusTopCameraLens = 0.04;
		var radiusBottomCameraLens = 0.06;
		var heightCylinderCamenraLens =  0.08;
		var cameraLensGeometry = new THREE.CylinderGeometry(radiusTopCameraLens, radiusBottomCameraLens, heightCylinderCamenraLens, 32 );
		var cameraLens = new THREE.Mesh( cameraLensGeometry, material );
		cameraLens.rotation.z = Math.PI/2;
		cameraLens.position.x += 2*widthBody/3;

		//Creazione asse sostegno
		var radiusTopRod = 0.005;
		var radiusBottomRod = 0.005;
		var heightRod = 0.15;

		var rodGeometry = new THREE.CylinderGeometry(radiusTopRod, radiusBottomRod, heightRod, 32 );
		var rod = new THREE.Mesh( rodGeometry, material );
		rod.rotation.z = Math.PI/2;
		rod.position.x -= widthBody/2;

		camera.add(bodyCamera);
		camera.add(cameraLens);

		camera.receiveShadow = true;
		camera.castShadow = true;
		var box = new THREE.Box3();
		box.setFromObject(camera);
		camera.add(box);
		camera.rotation.y += Math.PI*1/9;
		var model = packageModel(camera);
		return model;
	}

	function Hotspot(feature) {
		Feature.call(this, feature);	
	}

	inherits(Hotspot, Feature);
	featureClasses.Hotspot = Hotspot;
	Hotspot.prototype.style = {
									prefix: "fa",
									icon: "wifi"
								};

	Hotspot.prototype.get3DModel = function() {
		var hotspot = new THREE.Object3D();

		var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
		var bodyGeometry = new THREE.BoxGeometry( 0.1, 0.02, 0.1);
		var body = new THREE.Mesh( bodyGeometry, material );


		var antennaGeometry = new THREE.CylinderGeometry( 0.001, 0.005, 0.1 , 32);
		var antennaDx= new THREE.Mesh(antennaGeometry, material);
		var antennaSx= new THREE.Mesh(antennaGeometry, material);

		antennaDx.rotation.x = Math.PI/2;
		antennaSx.rotation.x = Math.PI/2;
		antennaSx.position.x += 0.08/2;
		antennaDx.position.x -= 0.08/2;

		antennaSx.position.z += 0.05;
		antennaDx.position.z += 0.05;

		hotspot.add(body);
		hotspot.add(antennaDx);
		hotspot.add(antennaSx);

		hotspot.receiveShadow = true;
		hotspot.castShadow = true;
		var model = packageModel(hotspot);

		return model;
	}

	function Light(feature) {
		Feature.call(this, feature);
	}

	inherits(Light, Feature);
	featureClasses.Light = Light;

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
	plane3D.position.z += height;
	light.add(plane3D);
	var groupNeon = new THREE.Object3D();
	var neonMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff} );
	var neonGeometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.58, 32 );
	var translations = [(-0.075*3), (-0.075), (0.075), (0.075*3)];
	for(i in translations)
	{
	    var neon = new THREE.Mesh( neonGeometry, neonMaterial );
	    neon.position.x += translations[i];
	    groupNeon.add(neon);
	}
	light.add(groupNeon);

	var model = packageModel(light);

	return model;
	}

	function Antenna(feature) {
		Feature.call(this, feature);
	}

	inherits(Antenna, Feature);
	featureClasses.Antenna = Antenna;
	Antenna.prototype.style =	{
									prefix: "fa",
									icon: "signal"
	    						};

	Antenna.prototype.get3DModel = function() {
	var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );

	var antenna = new THREE.Object3D();
	var geometry = new THREE.BoxGeometry( 0.3, 0.1, 0.3 );
	var base = new THREE.Mesh( geometry, material );
	base.position.z += 0.3/2;


	var geometry = new THREE.CylinderGeometry( 0.01, 0.01, 0.065, 32 );
	var baseCylinder = new THREE.Mesh( geometry, material );
	baseCylinder.position.y += 0.05;
	baseCylinder.position.z += 0.3/2;

	var geometry = new THREE.CylinderGeometry( 0.001, 0.01, 0.5, 32 );
	var cylinderAntenna = new THREE.Mesh( geometry, material );
	cylinderAntenna.rotation.x = Math.PI/2;
	cylinderAntenna.position.z += 0.3/2 +  0.5/2;
	cylinderAntenna.position.y += 0.08;

	var geometry = new THREE.SphereGeometry( 0.01, 32, 32 );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.position.z += 0.3/2;
	sphere.position.y += 0.08;
	antenna.add(base);
	antenna.add(baseCylinder);
	antenna.add(cylinderAntenna);
	antenna.add( sphere );

	var model = packageModel(antenna);
	return model;
	}

	function FireExtinguisher(feature) {
		Feature.call(this, feature);
	}

	inherits(FireExtinguisher, Feature);
	featureClasses.FireExtinguisher = FireExtinguisher;
	FireExtinguisher.prototype.style = {
										    prefix: "fa",
										    icon: "fire-extinguisher",
										    markerColor: "red"
										};

	FireExtinguisher.prototype.get3DModel = function() {
		var fireExtinguisher = new THREE.Object3D();

		var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
		var bodyGeometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.6, 32 );
		var body = new THREE.Mesh( bodyGeometry, material );
		body.rotation.x = Math.PI/2;

		fireExtinguisher.add(body);

		var geometrySphereUp = new THREE.SphereGeometry( 0.1, 32, 32 );
		var sphereUp = new THREE.Mesh( geometrySphereUp, material );
		sphereUp.position.z += 0.3;

		fireExtinguisher.add(sphereUp);

		var headGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.2);
		var materialHead = new THREE.MeshLambertMaterial( {color: 0x000000} );
		var head = new THREE.Mesh( headGeometry, materialHead );
		head.position.z += 0.4;

		fireExtinguisher.add(head);

		var materialCylinder = new THREE.MeshLambertMaterial( {color: 0x000000} );
		var cylinderGeometry = new THREE.CylinderGeometry( 0.015, 0.08, 0.25, 32 );
		var cylinder = new THREE.Mesh(cylinderGeometry, materialCylinder);
		cylinder.position.z += 0.5;
		cylinder.rotation.z = Math.PI/2;
		cylinder.position.x += 0.1;

		fireExtinguisher.add(cylinder);

		var model = packageModel(fireExtinguisher);    
		return model;
	}

	function Table(feature) {
		Feature.call(this, feature);
	}

	inherits(Table, Feature);
	featureClasses.Table = Table;

	Table.prototype.style =	{
								prefix: "fa",
								icon: "square-o"
	    					};

	Table.prototype.get3DModel = function() {
		var table = new THREE.Object3D();

		var geometry = new THREE.CylinderGeometry( 0.03, 0.03, 0.8, 32 );
		var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

		var p1 = new THREE.Mesh( geometry, material );
		p1.rotation.x += Math.PI/2;
		p1.position.z += 0.8/2;

		var p2 = new THREE.Mesh( geometry, material );
		p2.rotation.x += Math.PI/2;
		p2.position.z += 0.8/2;
		p2.position.y += 1;

		var p3 = new THREE.Mesh( geometry, material );
		p3.rotation.x += Math.PI/2;
		p3.position.z += 0.8/2;
		p3.position.x += 2;

		var p4 = new THREE.Mesh( geometry, material );
		p4.rotation.x += Math.PI/2;
		p4.position.z += 0.8/2;
		p4.position.y += 1;
		p4.position.x += 2;


		var geometry = new THREE.BoxGeometry( 2.1, 1.1, 0.04 );
		var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.x -= 0.05 - 2.1/2;
		plane.position.y -= 0.05 - 1.1/2;
		plane.position.z += 0.8;

		table.add(p1);
		table.add(p2);
		table.add(p3);
		table.add(p4);
		table.add(plane);

		var model = packageModel(table);

		return model;
	}

	function Chair(feature) {
		Feature.call(this, feature);
	}

	inherits(Chair, Feature);
	featureClasses.Chair = Chair;

	Chair.prototype.style = {
				    			prefix: "fa",
		    					icon: "minus"
							};
	Chair.prototype.get3DModel = function() {
		var chair = new THREE.Object3D();

		var geometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.5, 32 );
		var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

		var p1 = new THREE.Mesh( geometry, material );
		p1.rotation.x += Math.PI/2;
		p1.position.z += 0.5/2;

		var p2 = new THREE.Mesh( geometry, material );
		p2.rotation.x += Math.PI/2;
		p2.position.z += 0.5/2;
		p2.position.y += 0.4;

		var p3 = new THREE.Mesh( geometry, material );
		p3.rotation.x += Math.PI/2;
		p3.position.z += 0.5/2;
		p3.position.x += 0.4;

		var p4 = new THREE.Mesh( geometry, material );
		p4.rotation.x += Math.PI/2;
		p4.position.z += 0.5/2;
		p4.position.y += 0.4;
		p4.position.x += 0.4;

		var p5 = new THREE.Mesh( geometry, material );
		p5.rotation.x += Math.PI/2;
		p5.position.z += 0.5*3/2;

		var p6 = new THREE.Mesh( geometry, material );
		p6.rotation.x += Math.PI/2;
		p6.position.z += 0.5*3/2;
		p6.position.x += 0.4;

		var geometry = new THREE.BoxGeometry( 0.45, 0.45, 0.02 );
		var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.x += 0.4/2;
		plane.position.y += 0.4/2;
		plane.position.z += 0.5;

		var geometry = new THREE.BoxGeometry( 0.38, 0.02, 0.15);
		var back = new THREE.Mesh( geometry, material );
		back.position.x += 0.4/2;
		back.position.y += 0.001;
		back.position.z += 0.5*12/7;

		chair.add(back);
		chair.add(plane);
		chair.add(p1);
		chair.add(p2);
		chair.add(p3);
		chair.add(p4);
		chair.add(p5);
		chair.add(p6);
		var model = packageModel(chair);

		return model;
	}

	function BadgeReader(feature) {
		Feature.call(this, feature);
	}

	inherits(BadgeReader, Feature);
	featureClasses.BadgeReader = BadgeReader;
	BadgeReader.prototype.style = 	{
										prefix: "fa",
										icon: "ticket"
									};

	BadgeReader.prototype.get3DModel = function() {
	    var geometry = new THREE.BoxGeometry( 0.2, 0.3, 0.25 );
	    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
	    var badgeReader = new THREE.Mesh( geometry, material );
	    
	    var model = packageModel(badgeReader);

	    return model;
	}

	function External_wall(feature) {
		Feature.call(this, feature);
	}

	inherits(External_wall, Feature);
	featureClasses.External_wall = External_wall;

	External_wall.prototype.style = {
										color: "#d8d8d8",
	    								opacity: 1
	    							};

	External_wall.prototype.get3DModel = function() {
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


	function Internal_wall(feature) {
		Feature.call(this, feature);
	}

	inherits(Internal_wall, Feature);
	featureClasses.Internal_wall = Internal_wall;
	
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

	function Level(feature) {
		Feature.call(this, feature);
	}

	inherits(Level, Feature);
	featureClasses.Level = Level;
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
	
	function Door(feature) {
		Feature.call(this, feature);
	}

	inherits(Door, Feature);
	featureClasses.Door = Door;
	Door.prototype.style =  {
								color: "#000000"
	    					};

	function GraphNode(feature) {
		Feature.call(this, feature);
	}

	inherits(GraphNode, Feature);
	featureClasses.GraphNode = GraphNode;
	GraphNode.prototype.style =  {
									fillColor: "#00ff00",
									fillOpacity: 1,
									radius: 7
	    					};

	function Room(feature) {
		Feature.call(this, feature);
	}

	inherits(Room, Feature);
	featureClasses.Room = Room;
	Room.prototype.style = {
								weight: 0,
								fillColor: "#b8b8b8",
								fillOpacity: 1
	    					};
	Room.prototype.get3DModel = function() {
	    var material = new THREE.MeshLambertMaterial({
	        color: this.style.fillColor,
	        transparent: false, 
	        opacity: 0.9, 
	        side: THREE.DoubleSide
	    });

	    var model = new THREE.Mesh(generatePolygon(this.geometry), material);
	    
	    model.receiveShadow = true;

	    return model;	
	}
	function generateLineString(geoJSONgeometry) {
		var lineString = new THREE.Geometry();
	    for(var i = 0; i < geoJSONgeometry.coordinates.length; i++){
	        lineString.vertices.push( new THREE.Vector3( geoJSONgeometry.coordinates[i][0], geoJSONgeometry.coordinates[i][1], 0) );
	    }
	    return lineString;
	}

	function generatePolygonShape(geoJSONgeometry){
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

	function generatePolygon(geoJSONgeometry) {
	    return generatePolygonShape(geoJSONgeometry).makeGeometry();  
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
		return { coordinates: coordinates }
	}
	function packageModel(model3D) {
        
        var bbox = new THREE.BoundingBoxHelper(model3D, 0xff0000);
        bbox.update();
    
        var boxGeometry = new THREE.BoxGeometry( bbox.box.size().x, bbox.box.size().y, bbox.box.size().z );
        var boxMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, transparent: true, opacity: 0} );
        var el3D = new THREE.Mesh( boxGeometry, boxMaterial );
    
        el3D.add(model3D);
    
        var bboxCentroid = utilities.getCentroid(bbox);
    
        model3D.position.set(-bboxCentroid.x,-bboxCentroid.y,-bboxCentroid.z);    
    
        el3D.position.z = bbox.box.size().z/2;
        el3D.package = true;
        
        return el3D;
    }
	// (4) exported things (public)
	featureFactory.generateFeature = generateFeature;

	// (5) export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = featureFactory;
	}	
	
})();
