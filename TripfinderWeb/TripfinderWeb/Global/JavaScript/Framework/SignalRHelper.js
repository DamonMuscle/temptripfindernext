(function()
{
	function SignalRHelper()
	{
		this.connection = null;
		this.continuouslyCheckConnectionInterval = null;
		this.init();
	}

	SignalRHelper.prototype.init = function()
	{
		// do NOT use pathCombine, because Viewfinder cannot access this function at this place.
		TF.connection = this.connection = $.hubConnection(this.pathCombine(this.getApiServerUrl(), "Signalr"), { useDefaultPath: false });
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

	SignalRHelper.prototype.registerSignalRHubs = function(hubs,qs) 
	{
		const self = this;
		const hubProxys = [];
		var f = function() { };
		hubs.forEach(function(hub)
		{
			try
			{
				var hubProxy = self.connection.createHubProxy(hub);
				hubProxys.push(hubProxy);
				hubProxy.on("addCallmap", f);
			} catch (e)
			{
				console.error(e);
			}
		});

		self.connection.qs = qs? qs :{
			'username': tf.authManager.userName,
			'clientkey': tf.authManager.clientKey,
			'sessionitemid': TF.SessionItem.getId()
		};
		self.connection.start();
		hubProxys.forEach(function(hubProxy)
		{
			hubProxy.off("addCallmap", f);
		});

		self.continuouslyCheckConnectionInterval = setInterval(() =>
		{
			self.ensureConnection();
		}, 2000);
	};

	SignalRHelper.prototype.bindEvent = function(hubName, eventName, event)
	{
		//$.connection.GpsEventHub.updateGPSEvent
		this.connection.proxies[hubName.toLowerCase()].on(eventName, event);
	};

	SignalRHelper.prototype.unbindEvent = function(hubName, eventName, event)
	{
		//$.connection.GpsEventHub.updateGPSEvent
		this.connection.proxies[hubName.toLowerCase()].off(eventName, event);
	};

	SignalRHelper.prototype.send = function(hubName, eventName)
	{
		var hubProxy = this.connection.proxies[hubName.toLowerCase()];
		hubProxy.invoke.apply(hubProxy, Array.prototype.slice.call(arguments, 1));
	};

	SignalRHelper.prototype.ensureConnection = function()
	{
		if (!this.connection.id)
		{
			return new Promise((resolve) =>
			{
				this.connection.start().done(() =>
				{
					resolve();
				});
			});
		}
		return Promise.resolve();
	};

	SignalRHelper.prototype.dispose = function()
	{
		this.connection.stop();
		clearInterval(this.continuouslyCheckConnectionInterval);
	}

	createNamespace("TF").SignalRHelper = new SignalRHelper();
})();