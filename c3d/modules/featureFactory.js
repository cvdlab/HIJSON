// template for js modules that works both in node and browsers

// (1) initialize library object (namespace)
var featureFactory = {};

// (2) import any dependencies (in browser must be included before this file)
// example: var dependency = dependency || require('./dependency');
var utilities = utilities || require('./utilities.js');

var featureClasses = {};
featureClasses['Feature'] = require('../features/Feature.js');
featureClasses['Antenna'] = require('../features/Antenna.js');
featureClasses['BadgeReader'] = require('../features/BadgeReader.js');
featureClasses['Chair'] = require('../features/Chair.js');
featureClasses['Door'] = require('../features/Door.js');
featureClasses['External_wall'] = require('../features/External_wall.js');
featureClasses['FireExtinguisher'] = require('../features/FireExtinguisher.js');
featureClasses['GraphNode'] = require('../features/GraphNode.js');
featureClasses['Hotspot'] = require('../features/Hotspot.js');
featureClasses['Internal_wall'] = require('../features/Internal_wall.js');
featureClasses['Level'] = require('../features/Level.js');
featureClasses['Light'] = require('../features/Light.js');
featureClasses['Room'] = require('../features/Room.js');
featureClasses['Server'] = require('../features/Server.js');
featureClasses['SurveillanceCamera'] = require('../features/SurveillanceCamera.js');
featureClasses['Table'] = require('../features/Table.js');

(function(){

	// (3) library properties and functions (public an private)
	var generateFeature = function(feature) {
		var featureClass = capitaliseFirstLetter(feature.properties.class);
		return new featureClasses[featureClass](feature);	
	}
	
	function capitaliseFirstLetter(featureClass) {
	    return featureClass.charAt(0).toUpperCase() + featureClass.slice(1);
	}

	// (4) exported things (public)
	featureFactory.generateFeature = generateFeature;

	// (5) export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = featureFactory;
	}	
	
})();
