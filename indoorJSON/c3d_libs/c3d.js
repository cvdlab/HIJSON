/* Parser e funzioni di supporto per C3D */

/* set floor height */
var levelHeight = 5;
var error = false;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

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
            error = true;
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
            error = true;
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
    
    if(error) {
        console.log("Errori nella creazione del modello 3D.");
    }
    else {
        console.log("Modello generato correttamente.");
    }
}
