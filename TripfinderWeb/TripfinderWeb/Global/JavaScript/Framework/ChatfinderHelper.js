(function()
{
	function ChatfinderHelper()
	{
	}

	ChatfinderHelper.prototype.registerHub = function()
	{
		// Hard code for test
		var ChatfinderAPIAddress = "https://serviceplus01.transfinder.com/ChatfinderApi";

		var self = this;
		if (tf.authManager.authorizationInfo.authorizationTree.applications.indexOf("cfweb") >= 0)
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
			}

			tf.promiseAjax.get(pathCombine(ChatfinderAPIAddress, "auth", "verify"), verifyData)
			.then(function(response)
			{
				var connection = new signalR.HubConnectionBuilder()
					.withUrl(self.pathCombine(ChatfinderAPIAddress, "chatfinderHub?ConnectFrom=rfweb"), {
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
	
				tf.cfConnection = connection;
	
				connection.on("notification", (chatThreadId, from, chatMessage) =>
				{
					self.tryNotification(chatThreadId, from, chatMessage)
				});
	
				connection.on("connectInfo", (info) =>
				{
					console.log(info);
				});
	
				try
				{
					connection.start();
				} catch (err)
				{
					console.log(err);
				}
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

	ChatfinderHelper.prototype.tryNotification = function(chatThreadId, from, chatMessage)
	{
		var options = {
			body: "Someone is trying to reach you in Chatfinder",
			icon: "./Global/Img/chatfinder/chatfinderLogo.ico"
		}

		// check Notification avaliable for current browser
		if (!("Notification" in window))
		{
			console.log("This browser does not support desktop notification");
		}

		// if user agrees to use notifications
		else if (Notification.permission === "granted")
		{
			// If it's okay let's create a notification
			this.createNotification(options)
		}

		// ask user for permission
		else if (Notification.permission !== "denied")
		{
			Notification.requestPermission().then(function(permission)
			{
				if (permission === "granted")
				{
					this.createNotification(options);
				}
			});

		}
	}

	ChatfinderHelper.prototype.createNotification = function(options)
	{
		var notification = new Notification("New Chatfinder Message!", options);
		// redirect
		notification.onclick = function()
		{
			var chatfinderDetail = tf.pageManager.applicationURLMappingList.find(p => p.Name == "Chatfinder");
			if (chatfinderDetail)
			{
				var chatfinderUrl = chatfinderDetail.Uri
				window.open(chatfinderUrl,"_blank")
			}
		}
	}

	createNamespace("TF").ChatfinderHelper = new ChatfinderHelper();
})();