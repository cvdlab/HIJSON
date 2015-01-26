function Feature(feature) { 
	this.id = feature.id;
	this.type = 'Feature';
	this.geometry = feature.geometry;
	this.properties = feature.properties;
	this.parent = {};
	this.children = [];
}

Feature.prototype.inherits = function(Child, Parent) {
	var F = function() {};
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
}