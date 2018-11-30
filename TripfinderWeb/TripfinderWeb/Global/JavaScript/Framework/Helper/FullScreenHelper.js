(function()
{
	createNamespace("TF").FullScreenHelper = FullScreenHelper;

	function FullScreenHelper()
	{
		this.obIsFullScreen = ko.observable();
		this.obIsFullScreenAvailable = ko.observable(!isMobileDevice());
		this.isMobileDevice = isMobileDevice();
		this._bindFullScreenEvents();
	}

	FullScreenHelper.prototype.isFullScreen = function()
	{
		return (this.isFullScreenApi() ||
			this.isFullScreenMeasure() ||
			this.isFullScreenFirefox()) &&
			this.obIsFullScreenAvailable() &&
			!this.isMobileDevice;
	};

	FullScreenHelper.prototype.isFullScreenApi = function()
	{
		if (document.fullscreenElement ||
			document.mozFullScreenElement ||
			document.webkitFullscreenElement ||
			document.msFullscreenElement)
		{
			return true;
		}
		else
		{
			return false;
		}
	};

	FullScreenHelper.prototype.isFullScreenMeasure = function()
	{
		// If the browser takes up the entire screen
		// and there is less than 5 px of vertical chrome
		// Having vertical chrome WILL break this function. IE: dev tools open/bookmark bars
		var verticalChrome = window.outerHeight - (window.innerHeight * this._zoomLevel());
		return ($(window).width() == screen.width) &&
		(screen.height - $(window).height() <= 1) && //fix in IE
		(verticalChrome <= 5);
	};

	FullScreenHelper.prototype._zoomLevel = function()
	{
		// http://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers
		// This is only accurate in webkit browsers. All other browers return "1".
		// Multiplying by a factor of 1 won't make any difference on other browsers, so I use it to improve accuracy.
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('version', '1.1');
		document.body.appendChild(svg);
		var z = svg.currentScale;
		document.body.removeChild(svg);
		return z;
	};

	FullScreenHelper.prototype.isFullScreenFirefox = function()
	{
		var out = false;
		try
		{
			out = fullScreen;
		}
		catch (e)
		{
			// fullScreen is only defined in firefox.
		}
		return out;
	};

	FullScreenHelper.prototype.exitFullScreen = function()
	{
		if (document.exitFullscreen)
		{
			document.exitFullscreen();
		} else if (document.msExitFullscreen)
		{
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen)
		{
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen)
		{
			document.webkitExitFullscreen();
		}
	};

	FullScreenHelper.prototype.enterFullScreen = function(element)
	{
		if (element.requestFullscreen)
		{
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen)
		{
			element.mozRequestFullScreen();
		} else if (element.msRequestFullscreen)
		{
			element.msRequestFullscreen();
		} else if (element.webkitRequestFullscreen)
		{
			element.webkitRequestFullScreen();
		}
	};

	FullScreenHelper.prototype.isFullScreenAvailable = function()
	{
		if (document.body.requestFullscreen ||
			document.body.mozRequestFullScreen ||
			document.body.msRequestFullscreen ||
			document.body.webkitRequestFullscreen)
		{
			return true;
		}
		else
		{
			return false;
		}
	};


	FullScreenHelper.prototype._updateFullScreen = function()
	{
		var isFullScreen = this.isFullScreen();
		if (this.obIsFullScreen() != isFullScreen) this.obIsFullScreen(isFullScreen);
	};

	FullScreenHelper.prototype._bindFullScreenEvents = function()
	{
		var fullScreenEvent = null;
		$(window).on("resize.fullscreen", (function()
		{
			clearTimeout(fullScreenEvent);
			fullScreenEvent = setTimeout(this._updateFullScreen.bind(this), 100);

		}).bind(this));


		this.obIsFullScreenAvailable(this.isFullScreenAvailable());
		this._updateFullScreen();
	};

})();
