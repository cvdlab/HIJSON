// template for js modules that works both in node and browsers

// (1) initialize library object (namespace)
var featureFactory = {};

// (2) import any dependencies (in browser must be included before this file)
// example: var dependency = dependency || require('./dependency');
var utilities = utilities || require('./utilities.js');
var requireDir = require('require-dir');
var featureClasses = requireDir('../features');

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
