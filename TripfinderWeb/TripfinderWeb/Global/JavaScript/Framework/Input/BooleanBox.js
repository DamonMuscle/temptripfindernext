(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.BooleanBox = BooleanBox;

	//this is only used by grid for asthetic reason. no boolean uses <input type="text">
	function BooleanBox(initialValue, attributes, disable)
	{
		if (!attributes)
		{
			attributes = {};
		}
		attributes.dataList = [{ text: " ", value: null }, { text: 'True', value: true }, { text: 'False', value: false }]
		namespace.DataListBox.call(this, initialValue, attributes, disable);
	};

	BooleanBox.prototype = Object.create(namespace.DataListBox.prototype);

	BooleanBox.constructor = BooleanBox;

	BooleanBox.prototype.type = "Boolean";

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
