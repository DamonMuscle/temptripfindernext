(function()
{
	createNamespace("TF").DocumentEvent = DocumentEvent;

	function DocumentEvent()
	{
		this.eventMap = {};
	}

	DocumentEvent.prototype.getBindEventTarget = function()
	{
		return $(window);
	};

	DocumentEvent.prototype.bind = function(eventName, routeState, func)
	{
		var self = this;
		var $target = this.getBindEventTarget();
		if (!self.eventMap[eventName] || !$target.data(eventName))
		{
			self.eventMap[eventName] = [];
			$target.bind(eventName, self._eventFunction.bind(self, eventName));
			$target.data(eventName, true);
		}

		self.eventMap[eventName].push({
			eventName: eventName,
			routeState: routeState,
			func: func
		});
	};

	DocumentEvent.prototype.unbind = function(eventName, routeState)
	{
		if (!this.eventMap[eventName])
		{
			return;
		}
		for (var i = 0; i < this.eventMap[eventName].length; i++)
		{
			if (this.eventMap[eventName][i].routeState === routeState)
			{
				this.eventMap[eventName].splice(i, 1);
			}
		}
		if (this.eventMap[eventName].length === 0)
		{
			this.getBindEventTarget().unbind(eventName);
			delete this.eventMap[eventName];
		}
	};

	DocumentEvent.prototype._eventFunction = function(eventName, evt)
	{
		var currentRouteState;
		if (!(tf && tf.isViewfinder))
		{
			currentRouteState = this._getCurrentRouteState()
		}
		this.eventMap[eventName] && this.eventMap[eventName].forEach(function(item)
		{
			if (item.routeState === currentRouteState || (tf && tf.isViewfinder))
			{
				item.func(evt);
			}
		}, this);
	};

	DocumentEvent.prototype._getCurrentRouteState = function()
	{
		if (tf.documentManagerViewModel)
		{
			return tf.documentManagerViewModel.obCurrentDocument().routeState;
		}
		else
		{
			if (tf.pageManager && tf.pageManager.obPages()[0])
			{
				const routeState = tf.pageManager.obPages()[0].data.routeState;
				if (routeState)
				{
					return routeState;
				}
			}

			return tf.storageManager.get("routeState", false, true);
		}
	};

	DocumentEvent.prototype.unbindAllByRouteState = function(routeState)
	{
		for (var key in this.eventMap)
		{
			for (var i = 0; this.eventMap[key] && i < this.eventMap[key].length; i++)
			{
				this.unbind(this.eventMap[key][i].eventName, routeState);
			}
		}
	};
})();
