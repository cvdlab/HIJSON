var Feature = require('./Feature.js');

Feature.inherits(featureName, Feature);

function featureName(feature) {
	Feature.call(this, feature);
}

featureName.prototype.style = {
			    			prefix: "fa",
	    					icon: "minus",
	    					zIndex: 3
						};

featureName.prototype.in_graph = true;

featureName.prototype.in_2D_map = false;

featureName.prototype.get3DModel = function() {
	//TO DO
	var objectThreejs;
	var model = Feature.packageModel(objectThreejs);

	return model;
};

module.exports = featureName;