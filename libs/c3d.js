    /* Parser e funzioni di supporto per C3D */

/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

var C3D = {
    tree: {
        id: '',
        children: []
    },
    index: {},
    path_architecture:  'json_input/architecture_new.json',
    path_furnitures: 'json_input/furnitures_new.json',
    scene: new THREE.Scene()
}

C3D.parseJSON = function(callback) {
    var self = this;
    self.index['building'] = this.tree;
    
    function readJSON(typeJSON, path, read_callback) {
        console.log('readJson called with'+path);
        $.getJSON(path, function(data) { 
            if (data.type == "FeatureCollection") 
            {
                console.log('FeatureCollection detected for '+typeJSON+'.');
                if (typeJSON === "architecture") 
                {
                    self.tree.id = data.id;
                    self.tree.coordinates = data.coordinates;
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
                
                read_callback();

            } 
            else 
            {
                console.log('ERROR: No FeatureCollection detected');
            }
        });
    };


    readJSON('architecture', self.path_architecture, function(){
        readJSON('furnitures', self.path_furnitures, function(){
            callback();
        });
    });
    


}; // Chiude il this.parseJSON

C3D.init3D = function() {
        var stats = initStats();
        // create a scene, that will hold all our elements such as objects, cameras and lights.
        var scene = this.scene;
        // create a camera, which defines where we're looking at.
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        // create a render and set the size
        var renderer = new THREE.WebGLRenderer();
        
        var trackballControls = new THREE.TrackballControls(camera);
        
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
        
        // add axis helper
        var axisHelper = new THREE.AxisHelper(3);
        scene.add(axisHelper);

        var controls = new function () {
            this.showAxisHelper = true;
            this.enableTrackball = false;
        };
        
        var enableTrackball = false;
        var gui = new dat.GUI();
        
        gui.add(controls, 'showAxisHelper').onChange(function (value) {
            axisHelper.visible = value;
        });
        
        gui.add(controls, 'enableTrackball').onChange(function (value) {
            enableTrackball = value;
        });

        $('body').append(renderer.domElement);
        
        render();
        
        function render() {
            stats.update();
            if (enableTrackball) trackballControls.update();
            
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
    La visita avviene per ampiezza, in modo da disegnare prima i livelli   
*/
C3D.generate3DModel = function() {
    var queue = [];
    var feature;
    $.each(this.tree.children, function(key, child) {
        queue.push(child);
    });
    
    while(queue.length>0) {
        feature = queue.pop();
        
        if(feature.geometry.type in archGen) {
            var el3D = archGen[feature.geometry.type](feature);
            this.scene.add(el3D);
        }
        else {
            console.log('ERROR: Class: ' + feature.geometry.type + 'not recognized.');
        }

        for(childrenElement in element.children) {
            queue.push(childrenElement);
        }
    }

} // Chiude generate3DModel



function architectureParsing(scene, pathname) {
    
    var planimetry = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") 
        {
            console.log('FeatureCollection detected for Architecture.');
            
            //foreach data.features invocare in base al geometry.type uno dei metodi descritti in seguito, una o più volte (multi-*)
            $.each( data.features, function( key, feature ) 
            {
                if(feature.geometry.type in archGen) 
                {
					archGen[feature.geometry.type](planimetry, feature.geometry.coordinates, feature.properties);
				}
                else 
                {
					console.log('ERROR: geometry Type: ' + feature.geometry.type + 'not recognized.');
				}
            });
        } 
        else 
        {
            console.log('ERROR: No FeatureCollection detected');
    	}
    });
    
    scene.add(planimetry);

}


function furnitureParsing(scene, pathname) {
    
    var furnitures = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") 
        {
            console.log('FeatureCollection detected for Furnitures.');
            
            //foreach data.features invocare in base al geometry.type uno dei metodi descritti in seguito, una o più volte (multi-*)
            $.each( data.features, function( key, feature ) 
            {
                if(feature.properties.geomType in furnitureGen) 
                {
					furnitureGen[feature.properties.geomType](furnitures, feature);
				}
                else 
                {
					simpleFurnitureAdd(furnitures, feature);
				}
            });
        } 
        else 
        {
            console.log('ERROR: No FeatureCollection detected');
    	}
    });
    
    scene.add(furnitures);

}

/*
    La funzione parsing richiede in input un oggetto javascript con i seguenti parametri
        - scene: la scena in cui bisogna generare il modello 3D.
        - pathname_architecture: pathname del file JSON contenenti le feature che descrivono 
          l'architettura del modello 3D da rappresentare;
        - pathname_furniture: pathname del file JSON contenenti le feature che descrivono 
          gli elementi d'arredo che caratterizzano il modello 3D da rappresentare;
*/
function parsing(parsing_object) {
    architectureParsing(parsing_object.scene, parsing_object.architecturePathname);
    furnitureParsing(parsing_object.scene, parsing_object.furniturePathname);
}