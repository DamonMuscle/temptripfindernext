(function()
{
	createNamespace("TF.Events").Event = Event;

	/***
	 * A simple publisher-subscriber implementation.
	 * @class Event
	 * @constructor
	 */
	function Event()
	{
		this.handlers = [];
	};

	Event.prototype.subscribe = function(fn)
	{
		this.handlers.push(fn);
	};

	Event.prototype.unsubscribe = function(fn)
	{
		for (var i = this.handlers.length - 1; i >= 0; i--)
		{
			if (this.handlers[i] === fn)
			{
				this.handlers.splice(i, 1);
			}
		}
	};

	Event.prototype.hasSubscribed = function(fn)
	{
		for (var i = this.handlers.length - 1; i >= 0; i--)
		{
			if (this.handlers[i] === fn)
			{
				return true;
			}
		}
		return false
	};

	Event.prototype.unsubscribeAll = function()
	{
		this.handlers = [];
	};

	/***
		 * Fires an event notifying all subscribers.
		 * @method notify
		 * @param args {Object} Additional data object to be passed to all this.handlers.
		 * @param e {EventData}
		 *      Optional.
		 *      An <code>EventData</code> object to be passed to all this.handlers.
		 *      For DOM events, an existing W3C/jQuery event object can be passed in.
		 * @param scope {Object}
		 *      Optional.
		 *      The scope ("this") within which the handler will be executed.
		 *      If not specified, the scope will be set to the <code>Event</code> instance.
		 */
	Event.prototype.notify = function(args, e, scope)
	{
		e = e || new TF.Events.EventData();
		scope = scope || this;

		var returnValue;
		for (var i = 0; i < this.handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++)
		{
			if (arguments.length > 3 && arguments[3] instanceof Array)
			{
				var appendArgs = arguments[3];
				appendArgs.unshift(e, args);
				returnValue = this.handlers[i].apply(scope, appendArgs);
			}
			else
			{
				returnValue = this.handlers[i].call(scope, e, args);
			}
		}

		return returnValue;
	};

	Event.prototype.fire = function()
	{
		var e = e || new TF.Events.EventData();
		var scope = scope || this;

		var returnValue;
		for (var i = 0; i < this.handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++)
		{
			returnValue = this.handlers[i].apply(scope, [e].concat(Array.prototype.slice.call(arguments)));
		}

		return returnValue;
	};


})();
