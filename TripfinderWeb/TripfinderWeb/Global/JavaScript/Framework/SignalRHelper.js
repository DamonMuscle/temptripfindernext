(function()
{
	var connection = null;
	function SignalRHelper()
	{
		// do NOT use pathCombine, because Viewfinder cannot access this function at this place.
		connection = $.hubConnection(this.pathCombine(this.getApiServerUrl(), "signalr"), { useDefaultPath: false });
		// connection.logging = true;
		TF.connection = connection;
	}

	SignalRHelper.prototype.getApiServerUrl = function()
	{
		if (APIServer.indexOf("http") == -1)
		{
			var apiBaseUrl = APIServer.startsWith("//") ? APIServer : "//" + APIServer;
			var server = window.location.protocol + apiBaseUrl;
		}
		else
		{
			server = APIServer;
		}

		return server;
	};

	SignalRHelper.prototype.pathCombine = function()
	{
		var output = arguments[0];
		for (var i = 1, len = arguments.length; i < len; i++)
		{
			if (output.substr(output.length - 1) != "/")
			{
				output += "/" + arguments[i];
			}
			else
			{
				output += arguments[i];
			}
		}
		output = output.replace(/[/]+/g, "/").replace("http:/", "http://").replace("https:/", "https://");
		return output;
	};

	SignalRHelper.prototype.registerSignalRHubs = function(hubs) 
	{
		var hubProxys = [];
		var f = function() { };
		hubs.map(function(hub)
		{
			try
			{
				var hubProxy = connection.createHubProxy(hub);
				hubProxys.push(hubProxy);
				hubProxy.on("addCallmap", f);
			} catch (e) { }
		});

		connection.qs = {
			'username': tf.authManager.userName,
			'clientkey': tf.authManager.clientKey,
			'sessionitemid': TF.SessionItem.getId()
		};
		connection.start();
		hubProxys.map(function(hubProxy)
		{
			hubProxy.off("addCallmap", f);
		});
	};

	SignalRHelper.prototype.bindEvent = function(hubName, eventName, event)
	{
		//$.connection.GpsEventHub.updateGPSEvent
		connection.proxies[hubName.toLowerCase()].on(eventName, event);
	};

	SignalRHelper.prototype.unbindEvent = function(hubName, eventName, event)
	{
		//$.connection.GpsEventHub.updateGPSEvent
		connection.proxies[hubName.toLowerCase()].off(eventName, event);
	};

	SignalRHelper.prototype.send = function(hubName, eventName)
	{
		var hubProxy = connection.proxies[hubName.toLowerCase()];
		hubProxy.invoke.apply(hubProxy, Array.prototype.slice.call(arguments, 1));
	};

	SignalRHelper.prototype.ensureConnection = function()
	{
		if (!connection.id)
		{
			return new Promise((resolve) =>
			{
				connection.start().done(() =>
				{
					resolve();
				});
			});
		}
		return Promise.resolve();
	};

	createNamespace("TF").SignalRHelper = new SignalRHelper();
})();