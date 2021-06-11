(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.BooleanBox = BooleanBox;

	//this is only used by grid for asthetic reason. no boolean uses <input type="text">
	function BooleanBox(initialValue, attributes, disable, events)
	{
		if (!attributes)
		{
			attributes = {};
		}

		let trueDisplayName = attributes.hasOwnProperty('trueDisplayName') && attributes.trueDisplayName() && attributes.trueDisplayName().length > 0 ? attributes.trueDisplayName() : 'True';
		let falseDisplayName = attributes.hasOwnProperty('falseDisplayName') && attributes.falseDisplayName() && attributes.falseDisplayName().length > 0 ? attributes.falseDisplayName() : 'False';

		attributes.dataList = [{ text: " ", value: null }, { text: trueDisplayName, value: true }, { text: falseDisplayName, value: false }]
		namespace.DataListBox.call(this, initialValue, attributes, disable, events);
	};

	BooleanBox.prototype = Object.create(namespace.DataListBox.prototype);

	BooleanBox.constructor = BooleanBox;

	BooleanBox.prototype.type = "Boolean";

	BooleanBox.prototype.initialize = function()
	{
		var self = this,
			$input;

		namespace.DataListBox.prototype.initialize.call(self);
		$input = self.$element.find("input");

		// Apply name attribute to input element (overwrite the base class specified one)
		if (self.attributes && self.attributes.name)
		{
			$input.attr("name", self.attributes.name);
		}
	};

	//because select is different from input, so simulate a keypress
	BooleanBox.prototype.selectClick = function(viewModel, e)
	{
		if (!this._selectOpen)
		{
			this._selectOpen = true;
			return;
		}
		this._selectOpen = false;
		var e1 = jQuery.Event("keypress");
		e1.keyCode = $.ui.keyCode.ENTER;
		$(e.target).trigger(e1);
	};
})();
