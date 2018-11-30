(function()
{
	createNamespace('TF.Events').EventData = EventData;
	function EventData()
	{
		var isPropagationStopped = false;
		var isImmediatePropagationStopped = false;

		/***
		 * Stops event from propagating up the DOM tree.
		 * @method stopPropagation
		 */
		this.stopPropagation = function()
		{
			isPropagationStopped = true;
		};

		/***
		 * Returns whether stopPropagation was called on this event object.
		 * @method isPropagationStopped
		 * @return {Boolean}
		 */
		this.isPropagationStopped = function()
		{
			return isPropagationStopped;
		};

		/***
		 * Prevents the rest of the handlers from being executed.
		 * @method stopImmediatePropagation
		 */
		this.stopImmediatePropagation = function()
		{
			isImmediatePropagationStopped = true;
		};

		/***
		 * Returns whether stopImmediatePropagation was called on this event object.\
		 * @method isImmediatePropagationStopped
		 * @return {Boolean}
		 */
		this.isImmediatePropagationStopped = function()
		{
			return isImmediatePropagationStopped;
		}
	};

})();