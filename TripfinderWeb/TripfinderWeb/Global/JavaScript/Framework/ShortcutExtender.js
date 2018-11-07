(function()
{
	createNamespace("TF").ShortcutExtender = ShortcutExtender;
	var classKey = "ShortcutExtender", defaultEventType = "keydown",
		specialKeyCodes = {
			8: 'backspace',
			9: 'tab',
			13: 'enter',
			16: 'shift',
			17: 'ctrl',
			18: 'alt',
			20: 'capslock',
			27: 'esc',
			32: 'space',
			33: 'pageup',
			34: 'pagedown',
			35: 'end',
			36: 'home',
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down',
			45: 'ins',
			46: 'del',
			91: 'meta',
			93: 'meta',
			224: 'meta'
		};

	for (var i = 1; i < 20; ++i)
	{
		specialKeyCodes[111 + i] = 'f' + i;
	}

	for (i = 0; i <= 9; ++i)
	{
		specialKeyCodes[i + 96] = i;
	}

	function ShortcutExtender(element, forceFocusable)
	{
		this.element = $(element);
		if (this.element.data(classKey))
		{
			throw "ShortcutExtender cannot be bound to one element multiple times.";
		}

		this.element.data(classKey, this);

		if (forceFocusable)
		{
			this.element.attr("tabindex", 1).css("outline", "none");
		}

		this.keypressActions = {};
		this.keydownActions = {};
		this.keyupActions = {};
		this.bindEvents();
	}

	ShortcutExtender.prototype.bindEvents = function()
	{
		this.element.on("keypress." + classKey + " keydown." + classKey + " keyup." + classKey, this.keyHandle.bind(this));
	};

	ShortcutExtender.prototype.keyHandle = function(event)
	{
		var currentActions = this[event.type + "Actions"];
		if (!currentActions) return;

		var key = this.getKey(event), action = currentActions[key];
		if (action)
		{
			action(event);
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};

	ShortcutExtender.prototype.getKey = function(event)
	{
		var keys = [];
		if (event.ctrlKey)
		{
			keys.push("ctrl");
		}

		if (event.shiftKey)
		{
			keys.push("shift");
		}

		if (event.altKey)
		{
			keys.push("shift");
		}

		var char;
		if (event.char)
		{
			char = event.char.toLowerCase();
		}
		else if (event.charCode)
		{
			char = String.fromCharCode(event.charCode).toLowerCase();
		}
		else if (event.keyCode != null)
		{
			char = specialKeyCodes[event.keyCode];
			if (char == null)
			{
				char = String.fromCharCode(event.keyCode).toLowerCase();
			}
		}

		if (char != null)
		{
			keys.push(char);
		}

		return keys.join("+");
	};

	ShortcutExtender.prototype.add = function(keyStr, action, eventType)
	{
		eventType = (eventType || defaultEventType).trim().toLowerCase();
		var currentActions = this[eventType + "Actions"];
		if (!currentActions) return;

		var keys = keyStr.split(",");
		keys.forEach(function(key)
		{
			key = (key || "").trim().toLowerCase();
			if (!key) return;
			currentActions[key] = action;
		});
	};

	ShortcutExtender.prototype.remove = function(keyStr, eventType)
	{
		eventType = (eventType || defaultEventType).trim().toLowerCase();
		var currentActions = this[eventType + "Actions"];
		if (!currentActions) return;

		var keys = keyStr.split(",");
		keys.forEach(function(key)
		{
			key = (key || "").trim().toLowerCase();
			if (!key) return;
			delete currentActions[key];
		});
	};

	ShortcutExtender.prototype.dispose = function()
	{
		this.element.off("." + classKey);
		var data = this.element.data() || {};
		delete data[classKey];
	};
})();