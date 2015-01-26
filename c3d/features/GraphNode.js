var Feature = require('./Feature.js');

Feature.inherits(GraphNode, Feature);

function GraphNode(feature) {
	Feature.call(this, feature);
}

GraphNode.prototype.style =  {
								fillColor: "#00ff00",
								fillOpacity: 1,
								radius: 7
    					};
    					
module.exports = GraphNode;