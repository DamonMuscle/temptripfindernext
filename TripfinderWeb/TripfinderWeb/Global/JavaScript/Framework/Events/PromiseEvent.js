(function()
{
	var namespace = createNamespace("TF.Events");
	namespace.PromiseEvent = PromiseEvent;

	function PromiseEvent()
	{
		TF.Events.Event.call(this);
	};

	PromiseEvent.prototype = Object.create(namespace.Event.prototype);

	PromiseEvent.prototype.constructor = PromiseEvent;



	//the difference between PromiseEvent and Event is PromiseEvent expect handler returns a promise and calls next handler on Promise.then()
	PromiseEvent.prototype.notify = function(args, e, scope)
	{
		var self = this;
		var results = [];
		return new Promise(function(resolve, reject)
		{
			e = e || new TF.Events.EventData();
			scope = scope || this;

			function callHandler(i)
			{
				if (i < self.handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()))
				{
					self.handlers[i].call(scope, e, args)
					.then(function(result)
					{
						results.push(result);
						callHandler(i + 1);
					})
				}
				else
				{
					resolve(results);
				}
			}
			callHandler(0);
		});
	};


})();
