var C3D = {
    tree: {
        id: '',
        children: []
    },
    index: {},
    path_architecture:  'json_input/architecture_polygon.json',
    path_furnitures: 'json_input/furnitures_new.json',
    scene: new THREE.Scene()
}

/*
    Funzione che genera albero ed indice a partire dai file json
 */ 

C3D.parseJSON = function() {
    var self = C3D;
    self.index['building'] = self.tree;
    function readJSON(typeJSON, path) {
        $.getJSON(path, function(data) { 
            if (data.type == "FeatureCollection") 
            {
                console.log('FeatureCollection detected for '+typeJSON+'.');
                if (typeJSON === "architecture") 
                {
                    self.tree.id = data.id;
                    //self.tree.coordinates = data.coordinates;
                    self.tree.properties = data.properties;
                }
                
                //THREE.FogExp2( hex, density );reach data.features
                $.each( data.features, function( key, feature ) 
                {
                    var obj = {};
                    obj.id = feature.id;
                    obj.parent = self.index[feature.properties.parent];
                    obj.parent.children.push(obj);
                    obj.children = [];
                    obj.geometry = feature.geometry;
                    obj.properties = feature.properties;
                    self.index[feature.id] = obj;
                });
                
            } 
            else 
            {   
                var err = 'ERROR: No FeatureCollection detected' 
                return err;
            }
        });
    };

    readJSON('architecture', self.path_architecture);
    //readJSON('furnitures', self.path_furnitures);      


};

/*
    Funzione di inizializzazione three js
 */ 

C3D.init3D = function() {
    var stats = initStats();
    // create a scene, that will hold all our elements such as objects, cameras and lights.
    var scene = this.scene;
    // create a camera, which defines where we're looking at.
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // create a render and set the size
    var renderer = new THREE.WebGLRenderer();
    
    // var trackballControls = new THREE.TrackballControls(camera);
    
    renderer.setClearColor(new THREE.Color(0x092D52, 1.0)); 
    //renderer.setClearColor(new THREE.Color(0x2C3848, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    
    // position and point the camera to the center of the scene
    camera.position.set(-40,-40,40);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(scene.position);
    
    // add subtle ambient lighting
    var ambiColor = "#1c1c1c";
    var ambientLight = new THREE.AmbientLight(ambiColor);
    scene.add(ambientLight);
    
    $('body').append(renderer.domElement);
    // add axis helper
    var axisHelper = new THREE.AxisHelper(3);
    scene.add(axisHelper);



    
    render();
    
    function render() {
        stats.update();
        // if (enableTrackball) trackballControls.update();
        
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    
    function initStats() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms
        $('body').append(stats.domElement);
        return stats;
    }

}

/*
    Funzione che genera il modello 3D
 */ 

C3D.generate3DModel = function() {
    var self = C3D;
    var queue = [];
    var feature;
    
    self.index["building"].obj3D = new THREE.Object3D();

    for(var i=0;i< self.tree.children.length;i++) {
        queue.push(self.tree.children[i]);
    }
    while(queue.length>0) {
        feature = queue.shift();
        if(feature.geometry.type in archGen) {
            console.log('Oggetto in fase di generazione: ' + feature.id);
            var el3D = archGen[feature.geometry.type](feature.geometry.coordinates, feature.properties);
            feature.obj3D = el3D;


            if(feature.properties.rVector!==undefined) {
                var conv = Math.PI/180;
                var rotation = [
                            feature.properties.rVector[0]*conv, 
                            feature.properties.rVector[1]*conv,
                            feature.properties.rVector[2]*conv];
                el3D.rotation.set(rotation[0], rotation[1], rotation[2]);
            }

            if(feature.properties.tVector!==undefined) {
                var position = new THREE.Vector3(
                            feature.properties.tVector[0], 
                            feature.properties.tVector[1],
                            feature.properties.tVector[2]);
                el3D.position = position;
            }
            // if(feature.properties.z!==undefined)
            //     el3D.position.z = feature.properties.tVector[3];
            
            self.index[feature.parent.id].obj3D.add(el3D);
        }
        else {
            var err = 'ERROR: Class: ' + feature.geometry.type + 'not recognized.';
            return err;
        }

        for(var i=0;i< feature.children.length;i++) {
            queue.push(feature.children[i]);
        }
    }
    self.scene.add(self.index["building"].obj3D);
} // Chiude generate3DModel

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

C3D.initControls = function() {
      var controls = new function () {
        this.showAxisHelper = true;
        // this.enableTrackball = false;
        this.visibleRoom = "building";
        
        this.redraw = function() {
            C3D.index["building"].obj3D.traverse(function(object) {
                object.visible = false;
            });
            C3D.index[controls.visibleRoom].obj3D.traverse(function(object) {
                object.visible = true;
            });
            for(var i in C3D.index) {
                if((C3D.index[i].properties.class==="internal_wall") || 
                    (C3D.index[i].properties.class==="external_wall")) {
                    if(!($.inArray(controls.visibleRoom, C3D.index[i].properties.connections))) {
                        C3D.index[i].obj3D.traverse(function(object) {
                        object.visible = true;
                        });
                    }
                }
            }            
        }
    };
    
    // var enableTrackball = false;
    var gui = new dat.GUI();   
    
    gui.add(controls, 'showAxisHelper').onChange(function (value) {
        axisHelper.visible = value;
    });
    
    // gui.add(controls, 'enableTrackball').onChange(function (value) {
    //     enableTrackball = value;
    // });
    var rooms = ["building"];
    for(var key in C3D.index) {
        var element = C3D.index[key];
        if(element.properties.class==="room") {
            rooms.push(element.id);
        }
    }
    gui.add(controls, "visibleRoom", rooms).onChange(controls.redraw);  
}


