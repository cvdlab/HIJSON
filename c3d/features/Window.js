var Feature = require('./Feature.js');

Feature.inherits(Window, Feature);

function Window(feature) {
	Feature.call(this, feature);
}

Window.prototype.style =  {
							color: "#0000FF"
    					};
    					
module.exports = Window;