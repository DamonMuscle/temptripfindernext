(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.NaturalNumberBox = NaturalNumberBox;

	function NaturalNumberBox(initialValue, name, className, events)
	{
		namespace.StringBox.call(this, initialValue, name, className, undefined, undefined, events);
		// this.getElement().on("keypress keyup blur", function(event)
		// {
		// 	var key = event.which || event.keyCode || 0;

		// 	if (key < 48 || key > 57)
		// 	{
		// 		event.preventDefault();
		// 		event.stopPropagation();
		// 	}
		// });

		this.getElement().on("beforeinput", function ({originalEvent: event})
		{
			if (!event.data)
			{
				// delete a charactor
				return;
			}

			if (!event.data.split('').every(charactor => ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(charactor)))
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});

		this.getElement().on("input", function ({originalEvent: event})
		{
			if (event.currentTarget.value !== "")
			{
				let value = Number(event.currentTarget.value);
				if (Number.isNaN(value))
				{
					value = '';
				}
				event.currentTarget.value = `${value}`;
			}
		});
	}

	NaturalNumberBox.prototype = Object.create(namespace.StringBox.prototype);

	NaturalNumberBox.prototype.constructor = NaturalNumberBox;

	NaturalNumberBox.prototype.type = "NaturalNumber";
})();