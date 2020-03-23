(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.EmailBox = EmailBox;

	function EmailBox()
	{
		namespace.StringBox.apply(this, arguments);
	};

	EmailBox.prototype = Object.create(namespace.StringBox.prototype);

	EmailBox.constructor = EmailBox;

	EmailBox.prototype.type = "Email";
})();
