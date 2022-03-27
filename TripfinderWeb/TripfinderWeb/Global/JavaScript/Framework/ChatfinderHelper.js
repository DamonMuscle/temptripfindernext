(function()
{
	const NOTIFICATION_DISPLAY_TIME = 15000;
	createNamespace("TF").ChatfinderHelper = ChatfinderHelper;
	function ChatfinderHelper(prefix)
	{
		this.prefix = prefix;
		this.registration = null;
		this.notifications = new Map();
	}

	ChatfinderHelper.prototype.registerServiceWorker = async function(scriptUrl)
	{
		var self = this;
		self.registration = await navigator.serviceWorker.register(scriptUrl);
		self.registerOnMessage();
	}

	ChatfinderHelper.prototype.registerHub = function()
	{
		var self = this;
		var chatfinderSite = tf.authManager.supportedProducts.find(p => p.Name && p.Name.toLowerCase() == "chatfinder");
		var chatfinderApi = tf.authManager.supportedProducts.find(p => p.Name && p.Name.toLowerCase() == "chatfinderapi");
		if (chatfinderSite && chatfinderApi)
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

			var chatfinderAddress = chatfinderSite.Uri.toLowerCase();;
			var chatfinderAPIAddress = chatfinderApi.Uri;

			tf.promiseAjax.get(pathCombine(chatfinderAPIAddress, "auth", "verify"), verifyData)
				.then(function(response)
				{
					var connection = new signalR.HubConnectionBuilder()
						.withUrl(self.pathCombine(chatfinderAPIAddress, "chatfinderHub?ConnectFrom=tfweb"), {
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

					self.registerServiceWorker(`${chatfinderAddress}/chatfinder-service-worker.js`)
					tf.cfConnection = connection;

					connection.on("receivedMessage", (chatThreadId, from, chatMessage, fromUserName) =>
					{
						self.postMessage(chatThreadId, from, chatMessage, fromUserName);
					});

					connection.on("reactToMessage", (chatReaction) =>
					{
						if (chatReaction.ReactToEntUserId == tf.authManager.authorizationInfo.authorizationTree.userId)
						{
							self.postMessage(chatReaction.ChatMessage.ChatThreadId, chatReaction.UserId, chatReaction.ChatMessage)
						}
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

	ChatfinderHelper.prototype.postMessage = function(chatThreadId, fromEntId, chatMessage, fromUserName)
	{
		var self = this;
		// self sent messgage, for keeping message in sync, but do not notify user self.
		if (tf.authManager.authorizationInfo.authorizationTree.userId == fromEntId)
		{
			return;
		}

		if (self.registration)
		{
			var data = {
				chatThreadId: chatThreadId,
				sentByName: fromUserName,
				message: chatMessage
			}
			self.registration.active.postMessage(JSON.stringify(data));
		}
	}

	ChatfinderHelper.prototype.registerOnMessage = function()
	{
		var self = this;
		navigator.serviceWorker.addEventListener('message', event =>
		{
			const param = event.data
			switch (param.type)
			{
				case "showNotification":
					var options = param.data;
					options.icon = '../../Global/img/chatfinder/chatfinderLogo.ico'
					self.showNotification(options);
					break;
			}
		})
	}

	ChatfinderHelper.prototype.showNotification = function(options)
	{
		var self = this;
		var notification = new Notification(options.title, options);
		self.notifications.set(notification.timestamp, notification);

		notification.onclick = function(event)
		{
			var notifyData = event.target.data
			const urlSurfix = `/#/conversation?chatThreadId=${notifyData.chatThreadId}`
			var newwindow = window.open('/chatfinder' + urlSufix);
			newwindow.focus();
		}

		notification.onshow = function()
		{
			setTimeout(() =>
			{
				notification.close();
			}, NOTIFICATION_DISPLAY_TIME);
		}

		notification.onclose = function(event)
		{
			self.notifications.delete(event.target.timestamp);
		}
	}

	ChatfinderHelper.prototype.clearNotifications = function() 
	{
		this.notifications.forEach(function(n)
		{
			n.close();
		})
		this.notifications.clear();
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