/*
Global define:false.
ShortCutKeys is a simple keyboard shortcut library for Javascript with no external dependencies.
*/
(function()
{
	createNamespace("TF").ShortCutKeys = ShortCutKeys;

	function ShortCutKeys()
	{
		/*
		Object: mapping of special keycodes to their corresponding keys.
		Everything in this dictionary cannot use keypress events,
		so it has to be here to map to the correct keycodes for keyup/keydown events.
		*/
		this._SPECIAL_KEYCODE_MAP = {
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

		/*
		Object: mapping for special characters so they can support.
		This dictionary is only used incase you want to bind a keyup or keydown event to one of these keys.
		*/
		this._SYMBOL_KEYCODE_MAP = {
			106: '*',
			107: '+',
			109: '-',
			110: '.',
			111: '/',
			186: ';',
			187: '=',
			188: ',',
			189: '-',
			190: '.',
			191: '/',
			192: '`',
			219: '[',
			220: '\\',
			221: ']',
			222: '\''
		};

		/*
		Object: this is a mapping of keys that require shift on a US keypad back to the non shift equivelents.
		This is so you can use keyup events with these keys,
		note that this will only work reliably on US keyboards.
		*/
		this._SHIFT_KEYCODE_MAP = {
			'~': '`',
			'!': '1',
			'@': '2',
			'#': '3',
			'$': '4',
			'%': '5',
			'^': '6',
			'&': '7',
			'*': '8',
			'(': '9',
			')': '0',
			'_': '-',
			'+': '=',
			':': ';',
			'\"': '\'',
			'<': ',',
			'>': '.',
			'?': '/',
			'|': '\\'
		};

		/*
		Object: this is a list of special strings you can use to map,
		to modifier keys when you specify your keyboard shortcuts.
		*/
		this._SPECIAL_KEYCODE_ALIASES_MAP = {
			'option': 'alt',
			'command': 'meta',
			'return': 'enter',
			'escape': 'esc',
			'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
		},

			/*
			Object: variable to store the flipped version of _SPECIAL_KEYCODE_MAP from above,
			needed to check if we should use keypress or not when no action is specified.
			*/
			this._BACK_UP_MAP,

			/*
			Object: the global hash key, it means always execute.
			*/
			this._GLOBAL_KEY = 'global',

			/*
			Object: no find, it means the hash key do not find in hash map.
			*/
			this._NO_FIND = 'nofind',

			/*
			Object: a list of all the keys setup via ShortCutKeys.bind().
			*/
			this._keyboardKeysHashMap = {},

			/*
			Object: the current use of hash key, default: global.
			*/
			this._currentHashKey = this._GLOBAL_KEY,

			/*
			Object: the base of hash key, default: global.
			*/
			this._baseHashKey = this._GLOBAL_KEY,

			/*
			Object: map of string combinations to keys used for trigger().
			*/
			this._triggerMap = {},

			/*
			Object: keeps track of what level each sequence is at since multiple,
			sequences can start out with the same sequence.
			*/
			this._sequenceLevels = {},

			/*
			Object: variable to store the setTimeout call.
			*/
			this._resetTimer,

			/*
			Object: scope name of the ShortCutKeys event scope.
			*/
			//this._scopeName,

			/*
			Object: scope name list of the ShortCutKeys event scope.
			*/
			//this._scopeNameList = [],

			/*
			Object: temporary state where we will ignore the next keyup.
			*/
			this._loseNextKeyup = false,

			/*
			Object: temporary state where we will ignore the next keypress.
			*/
			this._loseNextKeypress = false,

			/*
			Object: are we currently inside of a sequence?
			Type of action ("keyup" or "keydown" or "keypress") or false.
			*/
			this._nextProspectiveAction = false,

			/*
			Object: Is complete of a keypress sequence.
			*/
			this._wrappedCallbackFinal = false,

			/*
			Object: Is complete of a keypress sequence.
			*/
			this._specialHashMap = null,

			/*
			Object: If true, the event was not runned.
			*/
			this._shutdown = false;

		/*
		loop through the f keys, f1 to f19 and add them to the map.
		*/
		for (var i = 1; i < 20; ++i)
		{
			this._SPECIAL_KEYCODE_MAP[111 + i] = 'f' + i;
		}

		/*
		loop through to map numbers on the numeric keypad.
		*/
		for (i = 0; i <= 9; ++i)
		{
			this._SPECIAL_KEYCODE_MAP[i + 96] = i;
		}

		// start!
		this._addClientEvent($(document), 'keypress', this._keyHandleEvent);
		this._addClientEvent($(document), 'keydown', this._keyHandleEvent);
		this._addClientEvent($(document), 'keyup', this._keyHandleEvent);
	}
	/*
	Pars: p1 {Element|HTMLDocument} object; p2 {string} type; p3 {Function} event function;
	Func: cross browser add event method;
	*/
	ShortCutKeys.prototype._addClientEvent = function(object, eventName, eventFunction)
	{
		object.on(eventName, { self: this }, eventFunction);
	}

	/*
	Pars: p1 {Event} e;
	Func: takes the event and returns the key character;
	Return: {string} character of e
	*/
	ShortCutKeys.prototype._characterOfKeyboard = function(e)
	{

		// for keypress events we should return the character as is
		if (e.type == 'keypress')
		{
			var character = String.fromCharCode(e.which);

			// if the shift key is not pressed then it is safe to assume
			// that we want the character to be lowercase.  this means if
			// you accidentally have caps lock on then your key bindings
			// will continue to work
			//
			// the only side effect that might not be desired is if you
			// bind something like 'A' cause you want to trigger an
			// event when capital A is pressed caps lock will no longer
			// trigger the event.  shift+a will though.
			if (!e.shiftKey)
			{
				character = character.toLowerCase();
			}

			return character;
		}

		// for non keypress events the special maps are needed
		if (this._SPECIAL_KEYCODE_MAP[e.which])
		{
			return this._SPECIAL_KEYCODE_MAP[e.which];
		}

		if (this._SYMBOL_KEYCODE_MAP[e.which])
		{
			return this._SYMBOL_KEYCODE_MAP[e.which];
		}

		// if it is not in the special map

		// with keydown and keyup events the character seems to always
		// come in as an uppercase character whether you are pressing shift
		// or not.  we should make sure it is always lowercase for comparisons
		return String.fromCharCode(e.which).toLowerCase();
	}

	/*
	Pars: p1 {Array} specialKeys1; p2 {Array} specialKeys2;
	Func: checks if two arrays are equal;
	Return: {boolean} comparison result
	*/
	ShortCutKeys.prototype._specialKeysMatch = function(specialKeys1, specialKeys2)
	{
		return specialKeys1.sort().join(',') === specialKeys2.sort().join(',');
	}

	/*
	Pars: p1 {Object} UnResetObject;
	Func: resets all sequence counters except for the ones passed in;
	*/
	ShortCutKeys.prototype._resetSequences = function(UnResetObject)
	{
		UnResetObject = UnResetObject || {};

		var InSequences = false,
			key;

		for (key in this._sequenceLevels)
		{
			if (UnResetObject[key])
			{
				InSequences = true;
				continue;
			}
			this._sequenceLevels[key] = 0;
		}

		if (!InSequences)
		{
			this._nextProspectiveAction = false;
		}
	}

	/*
	Pars: p1 {string} character; p2 {Array} specialKeys; p3 {Event|Object} e;
	p4 {string} sequenceName - name of the sequence we are looking for; p5 {string} group; p6 {number} level;
	Func: finds all keys that match based on the keycode, specialKeys and action;
	Return: {Array} the array of keyboard keys
	*/
	ShortCutKeys.prototype._getKeysByParam = function(NotBind, character, hashMap, specialKeys, e, sequenceName, group, level)
	{
		var i,
			j,
			keyboardKeyGlobal,
			keyboardKeySpecial,
			keyboardKey,
			self = this,
			keys = [],
			baseHashMap = [],
			newHashMap = [],
			action = e.type;

		// if there are no events related to this keycode
		if (!(hashMap && hashMap[character]) && !(NotBind && self._specialHashMap && self._specialHashMap[character]))
		{
			if (!NotBind ||
				!this._keyboardKeysHashMap[this._GLOBAL_KEY] ||
				!this._keyboardKeysHashMap[this._GLOBAL_KEY][character] ||
				!(this._currentHashKey === this._baseHashKey || this._keyboardKeysHashMap[this._baseHashKey].usingGlobal === 0))
			{
				return [];
			}
		}
		if (self._specialHashMap && self._specialHashMap[character])
		{
			if (hashMap && hashMap[character])
			{
				baseHashMap = baseHashMap.concat(hashMap[character]);
			}
			else
			{
				baseHashMap = [];
			}
			for (i = 0; i < self._specialHashMap[character].length; i++)
			{
				keyboardKeySpecial = self._specialHashMap[character][i];
				if (hashMap && hashMap[character])
				{
					var notInHashMap = true;
					for (j = 0; j < hashMap[character].length; j++)
					{
						keyboardKey = hashMap[character][j];
						if (keyboardKeySpecial.group == keyboardKey.group && keyboardKeySpecial.level == keyboardKey.level && keyboardKeySpecial.seq == keyboardKey.seq)
							notInHashMap = false;
					}
					if (notInHashMap)
					{
						baseHashMap.push(keyboardKeySpecial);
					}
				}
				else
				{
					baseHashMap.push(keyboardKeySpecial);
				}
			}
			newHashMap = newHashMap.concat(baseHashMap);
		}
		if (NotBind && (this._currentHashKey === this._baseHashKey || this._keyboardKeysHashMap[this._baseHashKey].usingGlobal === 0))
		{
			if (newHashMap.length === 0)
			{
				if (hashMap && hashMap[character])
				{
					newHashMap = newHashMap.concat(hashMap[character]);
					baseHashMap = baseHashMap.concat(hashMap[character]);
				}
				else
				{
					newHashMap = [];
				}
			}
			if (this._keyboardKeysHashMap[this._GLOBAL_KEY] && this._keyboardKeysHashMap[this._GLOBAL_KEY][character])
			{
				for (i = 0; i < this._keyboardKeysHashMap[this._GLOBAL_KEY][character].length; i++)
				{
					keyboardKeyGlobal = this._keyboardKeysHashMap[this._GLOBAL_KEY][character][i];

					if (baseHashMap.length > 0)
					{
						var notInHashMap = true;
						for (j = 0; j < baseHashMap.length; j++)
						{
							keyboardKey = baseHashMap[j];
							if (keyboardKeyGlobal.group == keyboardKey.group && keyboardKeyGlobal.level == keyboardKey.level && keyboardKeyGlobal.seq == keyboardKey.seq)
								notInHashMap = false;
						}
						if (notInHashMap)
						{
							newHashMap.push(keyboardKeyGlobal);
						}
					}
					else
					{
						newHashMap.push(keyboardKeyGlobal);
					}
				}
			}
		}
		if (newHashMap.length === 0)
		{
			newHashMap = hashMap[character];
		}

		// if a modifier key is coming up on its own we should allow it
		if (action == 'keyup' && this._isSpecialKeys(character))
		{
			specialKeys = [character];
		}

		// loop through all keys for the key that was pressed
		// and see if any of them match
		for (i = 0; i < newHashMap.length; ++i)
		{
			keyboardKey = newHashMap[i];

			// if a sequence name is not specified, but this is a sequence at
			// the wrong level then move onto the next match
			if (!sequenceName && keyboardKey.seq && this._sequenceLevels[keyboardKey.seq] != keyboardKey.level)
			{
				continue;
			}

			// if the action we are looking for doesn't match the action we got
			// then we should keep going
			if (action != keyboardKey.action)
			{
				continue;
			}

			// if this is a keypress event and the meta key and control key
			// are not pressed that means that we need to only look at the
			// character, otherwise check the specialKeys as well
			//
			// chrome will not fire a keypress if meta or control is down
			// safari will fire a keypress if meta or meta+shift is down
			// firefox will fire a keypress if meta or control is down
			if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || this._specialKeysMatch(specialKeys, keyboardKey.specialKeys))
			{

				// when you bind a group or sequence a second time it
				// should overwrite the first one.  if a sequenceName or
				// group is specified in this call it does just that
				//
				// @todo make deleting its own method?
				var deleteGroup = !sequenceName && keyboardKey.group == group && !keyboardKey.seq;
				var deleteSequence = sequenceName && keyboardKey.seq == sequenceName && keyboardKey.level == level;
				if (deleteGroup || deleteSequence)
				{
					newHashMap.splice(i, 1);
				}

				keys.push(keyboardKey);
			}
		}

		return keys;
	}

	/*
	Pars: p1 {Event} e;
	Func: takes a key event and figures out what the specialKeys are;
	Return: {Array} the array of special keys
	*/
	ShortCutKeys.prototype._handleKeyExpand = function(e)
	{
		var specialKeys = [];

		if (e.shiftKey)
		{
			specialKeys.push('shift');
		}

		if (e.altKey)
		{
			specialKeys.push('alt');
		}

		if (e.ctrlKey)
		{
			specialKeys.push('ctrl');
		}

		if (e.metaKey)
		{
			specialKeys.push('meta');
		}

		return specialKeys;
	}

	/*
	Pars: p1 {Event} e;
	Func: prevents default for this event;
	*/
	ShortCutKeys.prototype._preventDefault = function(e)
	{
		if (e.preventDefault)
		{
			e.preventDefault();
			return;
		}

		e.returnValue = false;
	}

	/*
	Pars: p1 {Event} e;
	Func: stops propogation for this event;
	*/
	ShortCutKeys.prototype._stopPropagation = function(e)
	{
		if (e.stopPropagation)
		{
			e.stopPropagation();
			return;
		}

		e.cancelBubble = true;
	}

	/*
	Pars: p1 {Function} callback function; p2 {Event} e; p3 {string} key - character for key; p4 {string} sequence;
	Func: actually calls the callback function,
	if your callback function returns false this will use the jquery convention - prevent default and stop propogation on the event;
	*/
	ShortCutKeys.prototype._callbackStart = function(callback, e, key, allowElements, sequence)
	{

		// if this event should not happen stop here
		if (this.callbackStop(e, e.target || e.srcElement, key, allowElements, sequence))
		{
			return;
		}

		if (callback(e, key) === false)
		{
			this._preventDefault(e);
			this._stopPropagation(e);
		}
	}

	/*
	Pars: p1 {string} character function; p2 {Array} specialKeys; p3 {Event} e;
	Func: handles a character key event;
	*/
	ShortCutKeys.prototype._keyHandle = function(character, specialKeys, e)
	{
		var hashMap = this._getChildHashMap(this._keyboardKeysHashMap[this._baseHashKey], this._currentHashKey);
		var keys = this._getKeysByParam(true, character, hashMap, specialKeys, e),
			i,
			UnResetObject = {},
			maxLevel = 0,
			sequenceCallback = false;

		// Calculate the maxLevel for sequences so we can only execute the longest callback sequence
		for (i = 0; i < keys.length; ++i)
		{
			if (keys[i].seq)
			{
				maxLevel = Math.max(maxLevel, keys[i].level);
			}
		}

		// loop through matching keys for this key event
		for (i = 0; i < keys.length; ++i)
		{

			// fire for all sequence keys
			// this is because if for example you have multiple sequences
			// bound such as "g i" and "g t" they both need to fire the
			// callback for matching g cause otherwise you can only ever
			// match the first one
			if (keys[i].seq)
			{

				// only fire keys for the maxLevel to prevent
				// subsequences from also firing
				//
				// for example 'a option b' should not cause 'option b' to fire
				// even though 'option b' is part of the other sequence
				//
				// any sequences that do not match here will be discarded
				// below by the _resetSequences call
				if (keys[i].level != maxLevel)
				{
					continue;
				}

				sequenceCallback = true;

				// keep a list of which sequences were matches for later
				UnResetObject[keys[i].seq] = 1;
				this._callbackStart(keys[i].callback, e, keys[i].group, keys[i].allowElements, keys[i].seq);
				continue;
			}

			// if there were no sequence matches but we are still here
			// that means this is a regular match so we should fire that
			if (!sequenceCallback)
			{
				this._callbackStart(keys[i].callback, e, keys[i].group, keys[i].allowElements);
			}
		}

		// if the key you pressed matches the type of sequence without
		// being a modifier (ie "keyup" or "keypress") then we should
		// reset all sequences that were not matched by this event
		//
		// this is so, for example, if you have the sequence "h a t" and you
		// type "h e a r t" it does not match.  in this case the "e" will
		// cause the sequence to reset
		//
		// modifier keys are ignored because you can have a sequence
		// that contains specialKeys such as "enter ctrl+space" and in most
		// cases the modifier key will be pressed before the next key
		//
		// also if you have a sequence such as "ctrl+b a" then pressing the
		// "b" key will trigger a "keypress" and a "keydown"
		//
		// the "keydown" is expected when there is a modifier, but the
		// "keypress" ends up matching the _nextProspectiveAction since it occurs
		// after and that causes the sequence to reset
		//
		// we ignore keypresses in a sequence that directly follow a keydown
		// for the same character
		var loseThisKeypress = e.type == 'keypress' && this._loseNextKeypress;
		if (e.type == this._nextProspectiveAction && !this._isSpecialKeys(character) && !loseThisKeypress)
		{
			this._resetSequences(UnResetObject);
		}

		this._loseNextKeypress = sequenceCallback && e.type == 'keydown';
	}

	/*
	Pars: p1 {Event} e;
	Func: handles a keydown event;
	*/
	ShortCutKeys.prototype._keyHandleEvent = function(e)
	{
		var self = e.data.self;

		// no event can be runned
		if (self._shutdown)
		{
			return;
		}
		//VIEW-2754, stop a user multiple hit the same key.
		if (self.stickyKey && self.stickyKey === e.key)
		{
			return;
		}
		else
		{
			self.stickyKey = e.key;
			setTimeout(function()
			{
				self.stickyKey = null;
			});
		}

		// normalize e.which for key events
		// @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
		if (typeof e.which !== 'number')
		{
			e.which = e.keyCode;
		}

		var character = self._characterOfKeyboard(e);

		// no character found then stop
		if (!character)
		{
			return;
		}

		// need to use === for the character check because the character can be 0
		if (e.type == 'keyup' && self._loseNextKeyup === character)
		{
			self._loseNextKeyup = false;
			return;
		}

		self._keyHandle(character, self._handleKeyExpand(e), e);
	}

	/*
	Pars: p1 {string} key - character for key;
	Func: determines if the keycode specified is a modifier key or not;
	Return: {boolean} is special of key
	*/
	ShortCutKeys.prototype._isSpecialKeys = function(key)
	{
		return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
	}

	/*
	Pars: p1 {Function} callback function; p2 {string} key - character for key; p3 {Event} e;
	Func: called to set a 1 second timeout on the specified sequence,
	this is so after each key press in the sequence you have 1 second to press the next key before you have to start over;
	*/
	ShortCutKeys.prototype._resetSequenceSetTimerout = function(hashKey, callback, key, e)
	{
		clearTimeout(this._resetTimer);
		this._resetTimer = setTimeout(function()
		{
			var self = e.data.self;
			self._resetSequences();
			if (callback && !self._wrappedCallbackFinal)
			{
				var info = self._getKeyInfo(key);
				if ($.grep(self._keyboardKeysHashMap[this.hashKey][info.key], function(n) { return !n.seq }).length != 0)
					callback(e, key);
			}
			self._wrappedCallbackFinal = false;
		}.bind({ hashKey: hashKey }), 1000);
	}

	/*
	Func: reverses the map lookup so that we can look for specific keys to see what can and can't use keypress;
	Return: {Object} the back up map
	*/
	ShortCutKeys.prototype._getBackUpMap = function()
	{
		if (!this._BACK_UP_MAP)
		{
			this._BACK_UP_MAP = {};
			for (var key in this._SPECIAL_KEYCODE_MAP)
			{

				// pull out the numeric keypad from here cause keypress should
				// be able to detect the keys from the character
				if (key > 95 && key < 112)
				{
					continue;
				}

				if (this._SPECIAL_KEYCODE_MAP.hasOwnProperty(key))
				{
					this._BACK_UP_MAP[this._SPECIAL_KEYCODE_MAP[key]] = key;
				}
			}
		}
		return this._BACK_UP_MAP;
	}

	/*
	Pars: p1 {Function} {string} key - character for key; p2 {Array} special keys; p3 {string} action;
	Func: picks the best action based on the key group;
	Return: {string} action
	*/
	ShortCutKeys.prototype._pickBestAction = function(key, specialKeys, action)
	{

		// if no action was picked in we should try to pick the one
		// that we think would work best for this key
		if (!action)
		{
			action = this._getBackUpMap()[key] ? 'keydown' : 'keypress';
		}

		// modifier keys don't work as expected with keypress,
		// switch to keydown
		if (action == 'keypress' && specialKeys.length)
		{
			action = 'keydown';
		}

		return action;
	}

	/*
	Pars: p1 {string} group - group specified in bind call key - character for key; p2 {Array} keys;
	p3 {Function} callback function; p4 {string} action;
	Func: binds a key sequence to an event;
	*/
	ShortCutKeys.prototype._bindKeysSequence = function(hashMap, group, keys, callback, action, options)
	{

		// start off by adding a sequence level record for this group
		// and setting the level to 0
		this._sequenceLevels[group] = 0;

		// loop through keys one at a time and bind the appropriate callback
		// function.  for any key leading up to the final one it should
		// increase the sequence. after the final, it should reset all sequences
		//
		// if an action is specified in the original bind call then that will
		// be used throughout.  otherwise we will pass the action that the
		// next key in the sequence should match.  this allows a sequence
		// to mix and match keypress and keydown events depending on which
		// ones are better suited to the key provided
		for (var i = 0; i < keys.length; ++i)
		{
			var isLastKey = i + 1 === keys.length,
				permission = options ? options.permission : undefined;
			var wrappedCallback = isLastKey ? this._callbackAndResetSequences(callback, group, permission, action) : this._increaseSequence(hashMap.name, action || this._getKeyInfo(keys[i + 1]).action, callback, keys[i], group);
			this._bindSingleKey(hashMap, keys[i], wrappedCallback, action, options, group, i);
		}
	}

	/*
	Pars: p1 {string} nextAction; p2 {Function} callback function; p3 {string} key; p4 {string} group;
	Func: callback to increase the sequence level for this sequence and reset all other sequences that were active;
	Return: {Function}
	*/
	ShortCutKeys.prototype._increaseSequence = function(hashKey, nextAction, callback, key, group)
	{
		return function(e)
		{
			var self = e.data.self;
			self._nextProspectiveAction = nextAction;
			++self._sequenceLevels[group];
			self._resetSequenceSetTimerout(this.hashKey, callback, key, e);
		}.bind({ hashKey: hashKey });
	}

	/*
	Pars: p1 {Function} callback function; p2 {string} group; p3 {string} action;
	Func: wraps the specified callback inside of another function in order to reset all sequence counters as soon as this sequence is done;
	Return: {Function}
	*/
	ShortCutKeys.prototype._callbackAndResetSequences = function(callback, group, allowElements, action)
	{
		return function(e)
		{
			var self = e.data.self;
			self._callbackStart(callback, e, group, allowElements);
			self._wrappedCallbackFinal = true;

			// we should ignore the next key up if the action is key down
			// or keypress.  this is so if you finish a sequence and
			// release the key the final key will not trigger a keyup
			if (action !== 'keyup')
			{
				self._loseNextKeyup = self._characterOfKeyboard(e);
			}

			// weird race condition if a sequence ends with the key
			// another sequence begins with
			setTimeout(self._resetSequences, 10);
		}
	}

	/*
	Pars: p1 {string} group like "command+shift+l";
	Func: Converts from a string key group to an array;
	Return: {Array} the array of group.split
	*/
	ShortCutKeys.prototype._keysFromString = function(group)
	{
		if (group === '+')
		{
			return ['+'];
		}

		return group.split('+');
	}

	/*
	Pars: p1 {string} group key group ("command+s" or "a" or "*"); p2 {string} action;
	Func: Gets info for a specific key group;
	Return: {Object} object of key
	*/
	ShortCutKeys.prototype._getKeyInfo = function(group, action)
	{
		var keys,
			key,
			i,
			specialKeys = [];

		// take the keys from this pattern and figure out what the actual
		// pattern is all about
		keys = this._keysFromString(group);

		for (i = 0; i < keys.length; ++i)
		{
			key = keys[i];

			// normalize key names
			if (this._SPECIAL_KEYCODE_ALIASES_MAP[key])
			{
				key = this._SPECIAL_KEYCODE_ALIASES_MAP[key];
			}

			// if this is not a keypress event then we should
			// be smart about using shift keys
			// this will only work for US keyboards however
			if (action && action != 'keypress' && this._SHIFT_KEYCODE_MAP[key])
			{
				key = this._SHIFT_KEYCODE_MAP[key];
				specialKeys.push('shift');
			}

			// if this key is a modifier then add it to the list of specialKeys
			if (this._isSpecialKeys(key))
			{
				specialKeys.push(key);
			}
		}

		// depending on what the key group is
		// we will try to pick the best event for it
		action = this._pickBestAction(key, specialKeys, action);

		return {
			key: key,
			specialKeys: specialKeys,
			action: action
		};
	}

	/*
	Pars: p1 {string} group; p2 {Function} callback function; p3 {string} action;
	p5 {string} sequenceName - name of sequence if part of sequence; p6 {number} level;
	Func: binds a single keyboard group;
	*/
	ShortCutKeys.prototype._bindSingleKey = function(hashMap, group, callback, action, options, sequenceName, level)
	{
		hashKey = hashMap.name;
		// store a direct mapped reference for use with ShortCutKeys.trigger
		this._triggerMap[hashKey] = this._triggerMap[hashKey] || {};
		this._triggerMap[hashKey][group + ':' + action] = callback;

		// make sure multiple spaces in a row become a single space
		group = group.replace(/\s+/g, ' ');

		var sequence = group.split(' '),
			info;

		// if this pattern is a sequence of keys then run through this method
		// to reprocess each pattern one key at a time
		if (sequence.length > 1)
		{
			this._bindKeysSequence(hashMap, group, sequence, callback, action, options);
			return;
		}

		info = this._getKeyInfo(group, action);

		// make sure to initialize array if this is the first time
		// a callback is added for this key
		hashMap[info.key] = hashMap[info.key] || [];

		// remove an existing match if there is one
		this._getKeysByParam(false, info.key, hashMap, info.specialKeys, { type: info.action }, sequenceName, group, level);

		// add this call back to the array
		// if it is a sequence put it at the beginning
		// if not put it at the end
		//
		// this is important because the way these are processed expects
		// the sequence ones to come first
		var key = {
			callback: callback,
			specialKeys: info.specialKeys,
			action: info.action,
			seq: sequenceName,
			level: level,
			group: group
		};

		if (options)
		{
			key.allowElements = options.permission;
		}

		hashMap[info.key][sequenceName ? 'unshift' : 'push'](key);
	}

	/*
	Pars: p1 {Array} combinations; p2 {Function} callback function; p3 {string|undefined} action;
	Func: binds a single keyboard group;
	*/
	ShortCutKeys.prototype._bindMultipleKeys = function(hashMap, combinations, callback, action, options)
	{
		for (var i = 0; i < combinations.length; ++i)
		{
			this._bindSingleKey(hashMap, combinations[i], callback, action, options);
		}
	}

	/**
	 * binds an event to mousetrap;
	 * can be a single key, a group of keys separated with +,an array of keys, or a sequence of keys separated by spaces;
	 * be sure to list the modifier keys first to make sure that the correct key ends up getting bound (the last key in the pattern);
	 * @param {string|Array} keys the keys which is binded an event to mousetrap.
	 * @param {function} callback callback function.
	 * @param {string} hashKey hash key word.
	 * @param {string} action 'keypress', 'keydown', or 'keyup'.
	 * @param {object} options permission and so on.
	 * @returns {object} ShortCutKeys or {boolean}false of bind faild
	 */
	ShortCutKeys.prototype.bind = function(keys, callback, hashKey, action, options)
	{
		var hashMap;
		if (!hashKey)
		{
			hashKey = this._GLOBAL_KEY;
		}
		else
		{
			this.addChildKey(hashKey, options ? options.isLastKey : false, options ? options.isDetailGrid : false);
		}

		if (this._baseHashKey === this._currentHashKey)
		{
			this._keyboardKeysHashMap[hashKey] = this._keyboardKeysHashMap[hashKey] || {};
			this._keyboardKeysHashMap[hashKey].name = hashKey;
			this._keyboardKeysHashMap[hashKey].isDetailGrid = options ? options.isDetailGrid : false;
			hashMap = this._keyboardKeysHashMap[hashKey];
		}
		else
		{
			hashMap = this._getChildHashMap(this._keyboardKeysHashMap[this._baseHashKey], hashKey);
			if (hashMap === this._NO_FIND)
			{
				return false;
			}
		}
		keys = $.isArray(keys) ? keys : [keys];
		this._bindMultipleKeys(hashMap, keys, callback, action, options);
		return this;
	};

	/*
	Pars: p1 {string|Array} keys; p2 {string} action - 'keypress', 'keydown', or 'keyup';
	Func: unbinds an event to mousetrap;
	the unbinding sets the callback function of the specified key group to an empty function and deletes the corresponding key in the _triggerMap dict;
	TODO: actually remove this from the _keyboardKeys dictionary instead of binding an empty function;
	the keycombo+action has to be exactly the same as it was defined in the bind method;
	Return: {Object} ShortCutKeys
	*/
	ShortCutKeys.prototype.unbind = function(keys, hashKey, action)
	{
		return this.bind(keys, function() { }, hashKey, action);
	};

	/*
	Pars: p1 {string} keys; p2 {string} action - 'keypress', 'keydown', or 'keyup';
	Func: triggers an event that has already been bound;
	*/
	ShortCutKeys.prototype.trigger = function(hashKey, keys, action)
	{
		if (this._triggerMap[hashKey] && this._triggerMap[hashKey][keys + ':' + action])
		{
			this._triggerMap[hashKey][keys + ':' + action]({}, keys);
		}
		return this;
	};

	/*
	Func: resets the library back to its initial state;
	if you want to clear out the current keyboard shortcuts and bind new ones - for example if you switch to another page;
	*/
	ShortCutKeys.prototype.reset = function()
	{
		this._keyboardKeysHashMap = {};
		this._currentHashKey = this._GLOBAL_KEY;
		this._keyboardKeysHashMap[this._currentHashKey] = {};
		this._triggerMap = {};
		return this;
	};

	/*
	Pars: p1 {Event} e; p2 {Element} element;
	Func: should we stop this event before firing off keys;
	Return: {boolean} the result of stop callback
	*/
	ShortCutKeys.prototype.callbackStop = function(e, element, key, allowElements, sequence)
	{
		var self = this;
		// if the element is allowed to trigger the callback function.
		if (allowElements && Array.isArray(allowElements) && allowElements.indexOf(element.tagName) !== -1 && !$(element).hasClass("unBindHotKey"))
		{
			return false;
		}
		// if the element has the class "mousetrap" then no need to stop
		if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1)
		{
			return false;
		}
		if (element.tagName == 'TEXTAREA' && $(element.parentElement).hasClass('kendo-grid'))
		{
			return false;
		}
		if (key.indexOf("tab") > -1)
		{
			return false;
		}
		if (self.isAlwaysTriggerCallBack(element))
		{
			return false;
		}

		// stop for input, select, and textarea
		return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
	}

	/**
	 * Check the focus is in the special element;
	 * @param {element} element the element which is focused.
	 * @returns {boolean} if true, trigger callback function.
	 */
	ShortCutKeys.prototype.isAlwaysTriggerCallBack = function(element)
	{
		var special = [{ tagName: "INPUT", class: "dropdown-list" }];
		for (var i in special)
		{
			if (special[i].tagName === element.tagName && $(element).hasClass(special[i].class))
			{
				return true;
			}
		}
		return false;
	};

	/*
	Pars: p1 {string} hash key;
	Func: Set up the current use of hash key;
	*/
	ShortCutKeys.prototype.changeHashKey = function(key)
	{
		if (!key)
		{
			key = this._GLOBAL_KEY;
		}
		this._currentHashKey = key;
	}

	/*
	Pars: p1 {string} hash key;
	Func: Set up the base hash key and current hash key;
	*/
	ShortCutKeys.prototype.changeBaseHashKey = function(key)
	{
		this._keyboardKeysHashMap[key] = this._keyboardKeysHashMap[key] || {};
		this._keyboardKeysHashMap[key].name = key;
		this._baseHashKey = key;
		this._currentHashKey = this._getLastChildHashMap(this._keyboardKeysHashMap[key]).name;
	}

	/*
	Pars: p1 {string} hash key;
	Func: Set up the base hash key and current hash key to the same;
	*/
	ShortCutKeys.prototype.changeSameBaseAndCurrentHashKey = function(key)
	{
		this._keyboardKeysHashMap[key] = this._keyboardKeysHashMap[key] || {};
		this._keyboardKeysHashMap[key].name = key;
		this._baseHashKey = key;
		this._currentHashKey = key;
	}

	/*
	Pars: p1 {string} hash key;
	Func: remove hash key in hash map;
	*/
	ShortCutKeys.prototype.removeHashKey = function(key)
	{
		if (this._keyboardKeysHashMap[key])
			delete this._keyboardKeysHashMap[key];
	}

	/*
	Pars: p1 {string} hash key;
	Func: add the child key in hash map;
	Return: {boolean} the result of success
	*/
	ShortCutKeys.prototype.addChildKey = function(key, isLastKey, isDetailGrid)
	{
		if (key != this._currentHashKey)
		{
			this._keyboardKeysHashMap[this._baseHashKey] = this._keyboardKeysHashMap[this._baseHashKey] || {};
			this._keyboardKeysHashMap[this._baseHashKey].name = this._baseHashKey;
			var hashMap = isLastKey ? this._getLastChildHashMap(this._keyboardKeysHashMap[this._baseHashKey]) : this._getChildHashMap(this._keyboardKeysHashMap[this._baseHashKey], this._currentHashKey);
			if (hashMap.isDetailGrid && !isLastKey)
			{
				hashMap = this._getLastChildHashMap(this._keyboardKeysHashMap[this._baseHashKey]);
			}
			if (hashMap === this._NO_FIND)
			{
				return false;
			}

			hashMap.ChildKey = hashMap.ChildKey || {};
			hashMap.ChildKey.name = key;
			hashMap.ChildKey.isDetailGrid = isDetailGrid;
			this.changeHashKey(key);
			this._addUsingGolbal();
		}
		return true;
	}

	/**
	 * remove hash key in child hash map;
	 * @param {string} key hash key.
	 * @param {boolean} notDeep if true, only remove key's event, and reserve its child key's event.
	 * @returns {void}
	 */
	ShortCutKeys.prototype.removeChildKey = function(key, notDeep)
	{
		var self = this,
			hashMap = key ? self._getParentHashMap(self._keyboardKeysHashMap[self._baseHashKey], key) : self._keyboardKeysHashMap[self._baseHashKey];
		if (hashMap != null && hashMap !== self._NO_FIND)
		{
			var childKey = hashMap.ChildKey;
			if (notDeep && childKey && childKey.ChildKey)
			{
				hashMap.ChildKey = childKey.ChildKey;
				self._currentHashKey = childKey.ChildKey.name;
			}
			else
			{
				self._currentHashKey = hashMap.name;
				delete hashMap.ChildKey;
			}
			delete childKey;
			self._reduceUsingGolbal();
		}
	}

	/*
	Pars: p1 {object} hash map; p2 {string} hash key;
	Func: get the parent hash map;
	Return: {object} hash map or {string}error:no find
	*/
	ShortCutKeys.prototype._getParentHashMap = function(hashMap, key, parentHashMap)
	{
		if (hashMap.name === key)
		{
			return parentHashMap;
		}
		if (!hashMap.ChildKey)
		{
			return this._NO_FIND;
		}
		parentHashMap = hashMap;
		return this._getParentHashMap(hashMap.ChildKey, key, parentHashMap);
	}

	/*
	Pars: p1 {object} hash map; p2 {string} hash key;
	Func: get the child hash map;
	Return: {object} hash map or {string}error:no find
	*/
	ShortCutKeys.prototype._getChildHashMap = function(hashMap, key)
	{
		if (!hashMap)
		{
			return this._NO_FIND;
		}
		if (hashMap.name === key)
		{
			return hashMap;
		}
		if (!hashMap.ChildKey)
		{
			return this._NO_FIND;
		}
		return this._getChildHashMap(hashMap.ChildKey, key);
	}

	/*
	Pars: p1 {object} hash map; p2 {string} hash key;
	Func: get the child hash map;
	Return: {object} hash map
	*/
	ShortCutKeys.prototype._getLastChildHashMap = function(hashMap)
	{
		if (!hashMap.ChildKey)
		{
			return hashMap;
		}
		return this._getLastChildHashMap(hashMap.ChildKey);
	}

	/*
	Func: add golbal used;
	*/
	ShortCutKeys.prototype._addUsingGolbal = function()
	{
		if (!this._keyboardKeysHashMap[this._baseHashKey].usingGlobal)
			this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = 0;
		this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = this._keyboardKeysHashMap[this._baseHashKey].usingGlobal + 1;
	}

	/*
	Func: reduce golbal used;
	*/
	ShortCutKeys.prototype._reduceUsingGolbal = function()
	{
		if (!this._keyboardKeysHashMap[this._baseHashKey].usingGlobal)
			this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = 0;
		this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = this._keyboardKeysHashMap[this._baseHashKey].usingGlobal - 1;
	}

	/*
	Func: reset golbal used;
	*/
	ShortCutKeys.prototype.resetUsingGolbal = function(resetNumber)
	{
		if (!this._keyboardKeysHashMap[this._baseHashKey].usingGlobal)
			this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = 0;
		this._keyboardKeysHashMap[this._baseHashKey].usingGlobal = this._keyboardKeysHashMap[this._baseHashKey].usingGlobal - resetNumber;
	}

	/**
	 * create a special hash map;
	 * @param {string} specialKey the special key's name.
	 * @returns {void}
	 */
	ShortCutKeys.prototype.createSpecialHashMap = function(specialKey)
	{
		var self = this, hashMap = self._keyboardKeysHashMap[self._baseHashKey];
		if (hashMap)
		{
			var specialHashMap = self._getChildHashMap(hashMap, specialKey);
			if (specialHashMap !== self._NO_FIND)
			{
				self._specialHashMap = specialHashMap;
			}
		}
	};

	/**
	 * clear the special hash map;
	 * @returns {void}
	 */
	ShortCutKeys.prototype.clearSpecialHashMap = function()
	{
		this._specialHashMap = null;
	};

	/**
	 * Shutdown or Starting up;
	 * @param {boolean} status if true, shutdown all event.
	 * @returns {void}
	 */
	ShortCutKeys.prototype.power = function(status)
	{
		var self = this;
		this._shutdown = status;
	}

	/*
	Func: exposes _keyHandle publicly so it can be overwritten by extensions;
	*/
	//keyHandle: this._keyHandle

	/*
	expose ShortCutKeys to the global object;
	*/
	//window.ShortCutKeys = ShortCutKeys;
})();
