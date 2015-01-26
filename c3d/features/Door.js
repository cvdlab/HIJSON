var Feature = require('./Feature.js');

Feature.inherits(Door, Feature);

function Door(feature) {
	Feature.call(this, feature);
}

Door.prototype.style =  {
							color: "#000000"
    					};