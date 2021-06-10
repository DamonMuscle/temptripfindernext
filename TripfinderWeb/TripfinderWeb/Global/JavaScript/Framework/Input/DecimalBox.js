(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DecimalBox = DecimalBox;

	function DecimalBox(initialValue, attributes, disable, events)
	{
		var self = this;
		var existingRetainPrecision = attributes && Object.keys(attributes).some(function(i) { return i === "retainPrecision"; });
		if (existingRetainPrecision)
		{
			delete attributes.retainPrecision;
			this.retainPrecision = true;
		}
		this.inputEnable = attributes && attributes.inputEnable == false ? false : true;
		namespace.StringBox.call(this, initialValue, attributes, disable, undefined, undefined, events);

		this.getElement().on("keypress keyup", function(event)
		{
			var keyCode = event.which || event.keyCode || 0;
			if (self.inputEnable && ((keyCode == 64 && ($(this).val() === '' || $(this).val() === '@')) || /^@@/.test($(this).val())))
			{
				return;
			}

			if ((keyCode != ".".charCodeAt(0) || $(this).val().indexOf('.') !== -1)
				&& (keyCode != "-".charCodeAt(0) || ($(this).val().indexOf('-') !== -1 ? this.selectionStart > 0 || this.selectionEnd === 0 : false) || this.selectionStart > 0) //For VIEW-1746
				&& (keyCode < "0".charCodeAt(0) || keyCode > "9".charCodeAt(0))
				&& !(keyCode == 37 && event.key != "%")
				&& !(keyCode == 39 && event.key != "'")
				&& keyCode !== 9)
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});

		this.getElement().on("blur", function(event)
		{
			if(!/^[+-]?\d*\.?\d*$/.test($(this).val()))
			{
				$(this).val('');
			}
		});
	};

	DecimalBox.prototype = Object.create(namespace.StringBox.prototype);

	DecimalBox.constructor = DecimalBox;

	DecimalBox.prototype.type = "Decimal";

	//DecimalBox.prototype.dispose = function()
	//{
	//	namespace.StringBox.prototype.dispose.call(this);
	//	ko.cleanNode(this.getElement()[0]);
	//	this.getElement().remove();
	//}
})();