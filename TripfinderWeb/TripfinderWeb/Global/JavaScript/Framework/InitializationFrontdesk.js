(function()
{
	createNamespace("TF").InitializationFrontdesk = InitializationFrontdesk;

	function InitializationFrontdesk(numberOfGuest, initializer)
	{
		this.checkin = this.checkin.bind(this);
		this.numberOfGuest = numberOfGuest;
		this.initializer = initializer;
	}

	InitializationFrontdesk.prototype.checkin = function()
	{
		this.numberOfGuest--;
		if (this.numberOfGuest == 0)
		{
			this.initializer();
		}
	}
})();