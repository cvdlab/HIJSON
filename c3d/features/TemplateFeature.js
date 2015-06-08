var Feature = require('./Feature.js');

Feature.inherits(ExampleName, Feature);

function ExampleName(feature) {
	Feature.call(this, feature);
}

ExampleName.prototype.style = {
			    			prefix: "fa",
	    					icon: "minus",
	    					zIndex: 3
						};

ExampleName.prototype.in_graph = true;

ExampleName.prototype.in_2D_map = false;

ExampleName.prototype.get3DModel = function() {
	//TO DO
	var objectThreejs;
	var model = Feature.packageModel(objectThreejs);

	return model;
};

module.exports = ExampleName;