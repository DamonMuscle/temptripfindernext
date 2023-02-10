(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.ThroughPointDataModel = function(throughPointEntity)
	{
		namespace.BaseDataModel.call(this, throughPointEntity);
	}

	namespace.ThroughPointDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ThroughPointDataModel.prototype.constructor = namespace.ThroughPointDataModel;

	namespace.ThroughPointDataModel.prototype.mapping = [
		{ from: "Seq", default: 0 },
		{ from: "XCoord", default: 0 },
		{ from: "YCoord", default: 0 },
		{ from: "ThroughPointSeq", default: 0 },
		{ from: "Address", default: "" },
		{ from: "CurbApproach", default: 1 }
	];
})();

(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.DirectionDestinationDataModel = function(destinationEntity)
	{
		namespace.BaseDataModel.call(this, destinationEntity);
	}

	namespace.DirectionDestinationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.DirectionDestinationDataModel.prototype.constructor = namespace.DirectionDestinationDataModel;

	namespace.DirectionDestinationDataModel.prototype.mapping = [
		{ from: "Seq", default: 0 },
		{ from: "XCoord", default: 0 },
		{ from: "YCoord", default: 0 },
		{ from: "Address", default: "" },
		{ from: "CurbApproach", default: 1 },
		{ from: "ThroughPoints", default: [] }
	];

	namespace.DirectionDestinationDataModel.prototype.addThroughPoint = function(tpItem)
	{
		this.throughPoints = this.throughPoints || [];
		var tp = new TF.DataModel.ThroughPointDataModel(tpItem);
		tp.seq(tpItem.Seq || this.seq());
		this.throughPoints.push(tp);
	};

	namespace.DirectionDestinationDataModel.prototype.addThroughPoints = function(tpItems)
	{
		var self = this;
		tpItems.forEach(function(tpItem)
		{
			self.addThroughPoint(tpItem);
		});
	};
})();

(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.DirectionDetailDataModel = function(directionDetailEntity)
	{
		namespace.BaseDataModel.call(this, directionDetailEntity);
	}

	namespace.DirectionDetailDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.DirectionDetailDataModel.prototype.constructor = namespace.DirectionDetailDataModel;

	namespace.DirectionDetailDataModel.prototype.mapping = [
		{ from: "Instruction", default: "" },
		{ from: "Text", default: "" },
		{ from: "Sequence", default: 0 },
		{ from: "Type", default: "" },
		{ from: "Distance", default: "" },
		{ from: "Time", default: "" },
		{ from: "Geometry", default: {} },
		{ from: "Index", default: 0 },
		{ from: "ReadOnlyArea", default: "" },
		{ from: "EditArea", default: "" },
		{ from: "Active", default: false },
		{ from: "Editable", default: false },
		{ from: "IsCustomDirection", default: false },
		{ from: "ShowEditarea", default: false },
		{ from: "EditHtml", default: "" },
		{ from: "EditareaHeight", default: "" }
	];
})();