(function()
{
	createNamespace("TF.RoutingMap").PlayBackTickTool = PlayBackTickTool;

	function PlayBackTickTool(options)
	{
		var nowSeconds = this.getNowSeconds();
		this.obPlaying = ko.observable(false);
		this.obPlaying.subscribe(this.playingChange.bind(this));
		this.obTimeSliderMax = ko.observable(24 * 60 * 60 - 1);
		this.obTimeSliderMin = ko.observable(0);
		this.obTargetTimeAsSecond = ko.observable(nowSeconds);
		this.obTargetTimeAsSecond.subscribe(this.timelineChange.bind(this));
		this.obPlaySpeed = ko.observable(1);
		this.tick = this.tick.bind(this);
		this.options = $.extend({ onProcess: function() { }, enableKeyDown: true }, options);
		this.playSpeedText = ko.observable('Normal Speed');
		this.obPlaySpeed.subscribe(v =>
		{
			this.speedText(v);
		});
		this.keyDownEventName = "keydown.arrowPlayBackTick" + TF.createId();
		this.keyUpEventName = "keyup.arrowPlayBackTick";
	}

	PlayBackTickTool.prototype.init = function()
	{
		this.routeState = tf.documentManagerViewModel ? tf.documentManagerViewModel.obCurrentDocument().routeState : "";
		this.obTargetTimeAsSecond(this.obTimeSliderMin());
		this.initKeyArrow();
	};

	PlayBackTickTool.prototype.initKeyArrow = function()
	{
		const arrowMoveSeconds = 1;
		if (!this.options.enableKeyDown)
		{
			return;
		}
		let continueRunTimeout;
		let moveArrow = (time) =>
		{
			let newTime = this.obTargetTimeAsSecond() + time;
			let isGo = false;
			if (newTime < this.obTimeSliderMin())
			{
				this.obTargetTimeAsSecond(this.obTimeSliderMin());
				isGo = true;
			} else if (newTime > this.obTimeSliderMax())
			{
				this.obTargetTimeAsSecond(this.obTimeSliderMax());
				isGo = true;
			} else
			{
				this.obTargetTimeAsSecond(newTime);
				isGo = true;
			}

			if (isGo)
			{
				clearTimeout(continueRunTimeout);
				continueRunTimeout = setTimeout(() =>
				{
					moveArrow(time);
				}, 1000);
			}
		};
		tf.documentEvent.bind(this.keyDownEventName, this.routeState, (e) =>
		{
			if (this.options.obMap && this.options.obMap() && this.options.obMap().mapView.container)
			{
				if (!$(this.options.obMap().mapView.container).is(":visible"))
				{
					return;
				}
				this.options.obMap().mapView.navigation.gamepad.enabled = false;
			}
			switch (e.keyCode)
			{
				// left arrow
				case 37:
					moveArrow(-1 * arrowMoveSeconds);
					break;
				// right arrow
				case 39:
					moveArrow(arrowMoveSeconds);
					break;
			}
		});

		tf.documentEvent.bind(this.keyUpEventName, this.routeState, () =>
		{
			clearTimeout(continueRunTimeout);
		});

		if (this.options.obMap && this.options.obMap())
		{
			this.keyDownEvent = this.options.obMap().mapView.on("key-down", function(event)
			{
				const prohibitedKeys = [
					"ArrowRight",
					"ArrowLeft"
				];
				const keyPressed = event.key;
				if (prohibitedKeys.indexOf(keyPressed) !== -1)
				{
					event.stopPropagation();
				}
			});
		}
	};

	PlayBackTickTool.prototype.disposeKeyArrow = function()
	{
		if (this.options.enableKeyDown)
		{
			tf.documentEvent.unbind(this.keyDownEventName, this.routeState);
			tf.documentEvent.unbind(this.keyUpEventName, this.routeState);
			this.keyDownEvent && this.keyDownEvent.remove();
			this.keyDownEvent = null;
		}
	};

	PlayBackTickTool.prototype.close = function()
	{
		this.obTimeSliderMin(0);
		this.obTimeSliderMax(24 * 60 * 60 - 1);
		this.obPlaying(false);
	};

	PlayBackTickTool.prototype.setTimeSliderRange = function(minStartTime, maxFinishTime)
	{
		this.obTimeSliderMin(minStartTime);
		this.obTimeSliderMax(maxFinishTime);
		if (this.obTargetTimeAsSecond() > maxFinishTime || this.obTargetTimeAsSecond() < minStartTime)
		{
			this.obTargetTimeAsSecond(minStartTime);
		}
	};

	PlayBackTickTool.prototype.togglePlay = function()
	{
		// if is running at the end of the timeline, move time handler to the start position
		if (this.obTargetTimeAsSecond() == this.obTimeSliderMax() && !this.obPlaying())
		{
			this.obTargetTimeAsSecond(this.obTimeSliderMin());
		}
		this.obPlaying(!this.obPlaying());
	};

	PlayBackTickTool.prototype.playNow = function()
	{
		var nowSeconds = this.getNowSeconds();
		if (nowSeconds >= this.obTimeSliderMin() && nowSeconds <= this.obTimeSliderMax())
		{
			this.obTargetTimeAsSecond(nowSeconds);
		}
		this.obPlaying(true);
	};

	PlayBackTickTool.prototype.stop = function()
	{
		this.obTargetTimeAsSecond(this.obTimeSliderMin());
		this.obPlaying(false);
	};

	PlayBackTickTool.prototype.playingChange = function()
	{
		if (this.obPlaying())
		{
			this.beforeTick();
			this.tick();
		}
	};

	PlayBackTickTool.prototype.changeSpeed = function(speed)
	{
		this.obPlaySpeed(speed);
	};

	PlayBackTickTool.prototype.beforeTick = function()
	{
		var now = new Date().getTime();
		this.lastIncrementTime = now;
		this.startTime = now;
	};

	PlayBackTickTool.prototype.tick = function()
	{
		if (!this.obPlaying())
		{
			return;
		}
		var onSecondMill = 1000;
		var nextFrameTime = this.obTargetTimeAsSecond();
		var speed = this.obPlaySpeed();
		var millSecondPerSpeed = onSecondMill / speed;
		var now = new Date().getTime(),
			dt = now - this.lastIncrementTime,
			diff = dt - millSecondPerSpeed;

		if (diff > 0)
		{
			nextFrameTime += Math.max(Math.floor(dt / millSecondPerSpeed), 1);
			this.obTargetTimeAsSecond(nextFrameTime);
			this.lastIncrementTime = now - (diff < millSecondPerSpeed ? diff : 0);
		}
		if (nextFrameTime < this.obTimeSliderMax())
		{
			// continue run
			this.animationFrame = requestAnimationFrame(this.tick);
		} else
		{
			// stop run
			this.obTargetTimeAsSecond(this.obTimeSliderMax());
			this.obPlaying(false);
		}
	};

	PlayBackTickTool.prototype.timelineChange = function()
	{
		this.update();
	};

	PlayBackTickTool.prototype.update = function()
	{
		this.process(parseInt(this.obTargetTimeAsSecond()));
	};

	PlayBackTickTool.prototype.process = function(targetTimeAsSecond)
	{
		this.options.onProcess(targetTimeAsSecond);
	};

	PlayBackTickTool.prototype.getNowSeconds = function()
	{
		var now = moment().currentTimeZoneTime();
		return this.timeToSecond(now);
	};

	PlayBackTickTool.prototype.timeToSecond = function(momentTime)
	{
		return momentTime.get("hour") * 60 * 60 + momentTime.get("minute") * 60 + momentTime.get("second");
	};

	PlayBackTickTool.prototype.secondToTimeFormatter = function(value)
	{
		var time = moment(moment().currentTimeZoneTime().format("L"));
		time.second(value);
		return time.format("LTS");
	};

	PlayBackTickTool.prototype.speedText = function(v)
	{
		let text = '';
		switch (v)
		{
			case 1:
				text = 'Normal Speed';
				break;
			case 2:
				text = '2x';
				break;
			case 10:
				text = '10x';
				break;
			case 20:
				text = '20x';
				break;
			case 30:
				text = '30x';
				break;
			case 60:
				text = '60x';
				break;
			case 120:
				text = '120x';
				break;
		}
		this.playSpeedText(text);
	}

	PlayBackTickTool.prototype.dispose = function()
	{
		this.obPlaying(false);
		this.animationFrame && cancelAnimationFrame(this.animationFrame);
		this.disposeKeyArrow();
	};
})();