(function()
{
	createNamespace("TF").ChatfinderHelper = ChatfinderHelper;
	function ChatfinderHelper(prefix)
	{
		this.prefix = prefix;
		this.chatfinderDetail = null;
		this.registration = null;
	}

	ChatfinderHelper.prototype.registerServiceWorker = async function(scriptUrl)
	{
		var self = this;
		self.registration = await navigator.serviceWorker.register(scriptUrl);
	}

	ChatfinderHelper.prototype.registerHub = function()
	{
		var self = this;
		self.chatfinderDetail = tf.authManager.supportedProducts.find(p => p.Name == "Chatfinder");
		self.chatfinderApiDetail = tf.authManager.supportedProducts.find(p => p.Name == "ChatfinderAPI");
		if (tf.authManager.authorizationInfo.authorizationTree.applications.indexOf("cfweb") >= 0
			&& self.chatfinderDetail && self.chatfinderApiDetail)
		{
			var verifyData = {
				paramData: {
					"clientId": tf.entStorageManager.get("clientKey"),
					"vendor": "Transfinder",
					"username": tf.authManager.userName,
				},
				headers: {
					'Transfinder': tf.api.server()
				}
			};

			var ChatfinderAddress = self.chatfinderDetail.Uri;
			var ChatfinderAPIAddress = self.chatfinderApiDetail.Uri;
	
				tf.promiseAjax.get(pathCombine(ChatfinderAPIAddress, "auth", "verify"), verifyData)
				.then(function(response)
				{
					var connection = new signalR.HubConnectionBuilder()
						.withUrl(self.pathCombine(ChatfinderAPIAddress, "chatfinderHub?ConnectFrom=tfweb"), {
							skipNegotiation: true,
							transport: signalR.HttpTransportType.WebSockets,
							accessTokenFactory: () =>
							{
								return response.Items[0].OpaqueToken;
							}
						})
						// .configureLogging(signalR.LogLevel.Information)
						.withAutomaticReconnect()
						.build();
		
					self.registerServiceWorker(`${ChatfinderAddress}/chatfinder-service-worker.js`)
					tf.cfConnection = connection;
		
					connection.on("receivedMessage", (chatThreadId, from, chatMessage, fromUserName) =>
					{
						if (self.registration)
						{
							var data = {
								chatThreadId: chatThreadId,
								sentByName: fromUserName,
								message: chatMessage
							}
							self.registration.active.postMessage(JSON.stringify(data));
						}
					});
		
					connection.on("connectInfo", (info) => {
						if (connection && info === "Disconnect") {
							connection.stop();
						}
						console.log(info);
					});
		
					try
					{
						connection.start();
					} catch (err)
					{
						console.log(err);
					}
				}, err => 
				{
					console.error('Failed to verify token to Chatfinder.', err || err.Message);
				})
		}
	}

	ChatfinderHelper.prototype.pathCombine = function()
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
})();