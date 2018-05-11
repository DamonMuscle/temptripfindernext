(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.TimeBox = TimeBox;

	function TimeBox()
	{
		namespace.DateTimeBox.apply(this, arguments);

		this.height = 158;
	};

	TimeBox.prototype = Object.create(namespace.DateTimeBox.prototype);

	TimeBox.constructor = TimeBox;

	TimeBox.prototype.type = "Time";

	TimeBox.prototype.formatString = "LT";

	TimeBox.prototype.pickerIconClass = "k-i-clock";

})();